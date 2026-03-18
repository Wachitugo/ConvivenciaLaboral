from typing import List, Optional
import datetime
import logging
import json
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.core.config import get_settings
from app.services.chat.search_service import search_service
from app.services.chat.prompt_service import prompt_service

logger = logging.getLogger(__name__)
settings = get_settings()

class ProtocolAgent:
    """
    Agente simplificado para generación de protocolos.
    Usa RAG para obtener contexto y una sola llamada al LLM.
    NO usa ReAct loops para evitar errores de recursión y agotar cuota.
    """
    
    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self.location = settings.LOCATION
        self.model_location = settings.VERTEX_LOCATION or "us-central1"
        self._llm = None

    @property
    def llm(self):
        if self._llm is None:
            model_name = settings.VERTEX_MODEL_FLASH or settings.VERTEX_MODEL
            
            self._llm = ChatVertexAI(
                model=model_name,
                temperature=0.2,
                max_output_tokens=4096,
                project=self.project_id,
                location=self.model_location,
            )
        return self._llm

    async def process_request(
        self, 
        message: str, 
        history: List, 
        school_name: str, 
        protocol_context: str = None, 
        files: List[str] = None, 
        bucket_name: str = None, 
        case_id: str = "temp", 
        session_id: str = "temp",
        user_id: str = None
    ):
        """
        Procesa una solicitud de protocolo usando RAG + una sola llamada al LLM.
        """
        from app.services.users.user_service import user_service
        try:
            logger.info(f"🧠 [PROTOCOL AGENT] Processing request for case_id={case_id}, session_id={session_id}")
            
            # 1. Obtener contexto RAG relevante
            rag_context = await self._get_rag_context(message, school_name)
            logger.info(f"📚 [PROTOCOL AGENT] RAG context retrieved: {len(rag_context)} characters")
            
            # 2. Construir prompt con contexto RAG
            system_prompt = self._build_protocol_prompt(school_name, rag_context, protocol_context)
            
            # 3. Preparar mensajes (historial + mensaje actual)
            messages = [SystemMessage(content=system_prompt)]
            
            # Incluir últimos 10 intercambios para contexto conversacional completo
            if history and len(history) > 0:
                recent_history = history[-20:]  # Últimos 10 intercambios (20 mensajes)
                messages.extend(recent_history)
                logger.info(f"📜 [PROTOCOL AGENT] Added {len(recent_history)} history messages for context")
            
            messages.append(HumanMessage(content=message))
            
            # 4. Llamada única al LLM
            logger.info(f"🤖 [PROTOCOL AGENT] Calling LLM...")
            response = await self.llm.ainvoke(messages)
            
            # Track Usage
            if user_id and hasattr(response, 'usage_metadata'):
                user_service.update_token_usage(
                    user_id=user_id,
                    input_tokens=response.usage_metadata.get('input_tokens', 0),
                    output_tokens=response.usage_metadata.get('output_tokens', 0),
                    model_name=self.llm.model_name
                )
            
            ai_response = response.content
            logger.info(f"✅ [PROTOCOL AGENT] LLM response received")
            
            # 5. Extraer y guardar protocolo del JSON en la respuesta
            protocol_saved = await self._extract_and_save_protocol(
                ai_response, case_id, session_id
            )
            
            if protocol_saved:
                logger.info(f"💾 [PROTOCOL AGENT] Protocol saved for case {case_id}")
            else:
                logger.warning(f"⚠️ [PROTOCOL AGENT] No protocol JSON found in response")
            
            return ai_response, []  # Retornamos lista vacía de mensajes (no hay tool calls)

        except Exception as e:
            logger.error(f"Error en ProtocolAgent: {str(e)}")
            raise e

    async def _get_rag_context(self, query: str, school_name: str) -> str:
        """
        Obtiene contexto relevante usando Vertex AI Search (RAG).
        Hace dos búsquedas en paralelo: una para los pasos del protocolo y
        otra específicamente para los plazos, ya que suelen estar en secciones
        distintas del documento.
        """
        try:
            search_tool = search_service.create_search_tool()

            if not search_tool:
                logger.warning("⚠️ [PROTOCOL AGENT] Search tool not available")
                return "No hay herramienta de búsqueda configurada. Genera un protocolo general según normativa chilena."

            # Búsqueda 1: pasos del protocolo (query original)
            # Búsqueda 2: plazos (pueden estar en otra sección del documento)
            deadlines_query = "plazos días hábiles procedimiento protocolo"

            result_steps, result_deadlines = await asyncio.gather(
                search_tool.ainvoke(query),
                search_tool.ainvoke(deadlines_query),
                return_exceptions=True
            )

            def _is_valid(r):
                return (
                    r and not isinstance(r, Exception)
                    and "No se encontraron" not in r
                    and "Error" not in r
                )

            combined_parts = []
            if _is_valid(result_steps):
                combined_parts.append(result_steps)
                logger.info(f"📚 [PROTOCOL AGENT] Steps search: {len(result_steps)} chars")
            if _is_valid(result_deadlines):
                combined_parts.append(result_deadlines)
                logger.info(f"⏱️ [PROTOCOL AGENT] Deadlines search: {len(result_deadlines)} chars")

            if combined_parts:
                return "=== DOCUMENTOS NORMATIVOS ENCONTRADOS ===\n" + "\n---\n".join(combined_parts)

            # Fallback: búsqueda más general
            logger.info("🔍 [PROTOCOL AGENT] Trying broader search...")
            general_result = await search_tool.ainvoke("protocolo convivencia laboral procedimiento")
            if _is_valid(general_result):
                return f"=== DOCUMENTOS NORMATIVOS ENCONTRADOS ===\n{general_result}"

            return "No se encontró contexto específico en los documentos. Genera un protocolo general según normativa chilena vigente."

        except Exception as e:
            logger.warning(f"Error obteniendo contexto RAG: {e}")
            return "Error obteniendo contexto. Genera un protocolo general según normativa chilena vigente."

    def _build_protocol_prompt(self, school_name: str, rag_context: str, protocol_context: str = None) -> str:
        """
        Construye el prompt del sistema con contexto RAG incluido.
        Los pasos, títulos y plazos deben extraerse de los documentos del colegio (RAG).
        """
        has_school_docs = (
            rag_context
            and "No se encontró" not in rag_context
            and "No hay herramienta" not in rag_context
            and "Error obteniendo" not in rag_context
        )

        if has_school_docs:
            source_instruction = f"""Los pasos, títulos y plazos deben extraerse EXCLUSIVAMENTE de los documentos de {school_name} que aparecen en el CONTEXTO NORMATIVO.
No agregues pasos que no estén en esos documentos.
Los plazos deben ser exactamente los que indica el documento (ej: "5 días hábiles", "24 horas", "inmediato").
Si el documento no especifica un plazo para un paso en particular, usa null en estimated_time."""
        else:
            source_instruction = f"""No se encontraron documentos de protocolo para {school_name}.
Genera un protocolo basado en la normativa chilena vigente (Ley Karin 21.643 / Código del Trabajo).
Indica claramente en "source_document" que la fuente es "Ley Karin 21.643 - Código del Trabajo".

Plazos legales obligatorios que DEBES asignar correctamente a cada paso según su función:
- Recepción / acuse de recibo de la denuncia → "24 horas hábiles"
- Adopción de medidas de protección para la víctima → "48 horas hábiles"
- Notificación a la Inspección del Trabajo (solo acoso sexual) → "3 días hábiles"
- Investigación de los hechos → "30 días corridos"
- Elaboración del informe final → "Al término de la investigación"
- Comunicación de resultados y sanciones → "3 días hábiles"
- Seguimiento post-resolución → "Continuo"

IMPORTANTE: Asigna el plazo correcto a CADA paso según su función real, no de forma genérica."""

        prompt = f"""Eres un asistente especializado en protocolos de convivencia laboral para {school_name}.

=== CONTEXTO NORMATIVO DEL COLEGIO ===
{rag_context}

=== INSTRUCCIONES ===

{source_instruction}

FORMATO DE RESPUESTA OBLIGATORIO:

Primero, escribe una breve justificación (2-3 líneas) explicando qué protocolo aplica y de qué documento proviene.

Luego, el JSON en este formato EXACTO:

```json
{{
  "type": "protocol",
  "protocol_name": "Nombre del protocolo tal como aparece en el documento",
  "steps": [
    {{
      "id": 1,
      "title": "Título del paso tal como aparece en el documento",
      "description": "Descripción con las acciones concretas indicadas en el documento.",
      "estimated_time": "Plazo exacto, ej: '5 días hábiles'",
      "deadline_from": "case_creation"
    }}
  ],
  "source_document": "Nombre exacto del documento de referencia"
}}
```

REGLAS:
- Incluye todos los pasos que indica el documento para este tipo de caso
- Siempre incluye el plazo en estimated_time cuando la ley o documento lo especifique
- No inventes pasos, títulos ni plazos que no estén en el documento o en la ley
- En "deadline_from" indica desde cuándo se cuenta el plazo de ese paso:
  * "case_creation" → el plazo corre desde la recepción de la denuncia (ej: medidas de protección, investigación)
  * "previous_step" → el plazo corre desde que termina el paso anterior (ej: comunicación de resultados después del informe)

NO OLVIDES incluir el bloque ```json en tu respuesta. Es OBLIGATORIO."""

        if protocol_context:
            prompt += f"\n\nContexto adicional:\n{protocol_context}"

        return prompt

    async def _extract_and_save_protocol(self, response: str, case_id: str, session_id: str) -> bool:
        """
        Extrae el JSON del protocolo de la respuesta y lo guarda.
        """
        try:
            import re
            
            # Buscar bloque JSON en la respuesta
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response)
            
            if not json_match:
                logger.warning("No se encontró bloque JSON en la respuesta")
                return False
            
            json_str = json_match.group(1)
            protocol_data = json.loads(json_str)
            
            if protocol_data.get('type') != 'protocol':
                logger.warning(f"JSON encontrado pero no es de tipo 'protocol': {protocol_data.get('type')}")
                return False
            
            # Importar servicios necesarios
            from app.services.protocols.protocol_extractor import protocol_extractor
            from app.services.protocols.protocol_execution_service import protocol_execution_service
            from app.schemas.protocol import ExtractedProtocol, ProtocolStep
            from app.services.case_service import case_service
            
            # Obtener fecha base del caso
            base_date = None
            if case_id and case_id != "temp":
                try:
                    case = case_service.get_case_by_id(case_id)
                    if case and case.created_at:
                        base_date = case.created_at
                        if base_date.tzinfo:
                            base_date = base_date.replace(tzinfo=None)
                        logger.info(f"📅 [PROTOCOL AGENT] Using case date: {base_date}")
                except Exception as e:
                    logger.warning(f"No se pudo obtener fecha del caso: {e}")
            
            # Convertir pasos del AI a objetos ProtocolStep.
            # El LLM indica en "deadline_from" si el plazo corre desde:
            #   "case_creation"  → desde la creación del caso (base_date)
            #   "previous_step"  → desde el deadline del paso anterior
            # Esto funciona para cualquier protocolo sin importar su estructura.
            from datetime import datetime as _dt

            steps = []
            last_deadline_dt = None  # deadline del paso anterior (para "previous_step")

            for s in protocol_data.get('steps', []):
                estimated_time = s.get('estimated_time') or ''
                deadline_from = s.get('deadline_from', 'case_creation')

                if deadline_from == 'previous_step' and last_deadline_dt is not None:
                    step_base = last_deadline_dt
                else:
                    step_base = base_date

                deadline = protocol_extractor.calculate_deadline(estimated_time, step_base)
                steps.append(ProtocolStep(
                    id=s.get('id'),
                    title=s.get('title'),
                    description=s.get('description'),
                    estimated_time=estimated_time,
                    deadline=deadline
                ))

                # Actualizar last_deadline_dt para el próximo paso
                if deadline:
                    try:
                        last_deadline_dt = _dt.strptime(deadline, "%Y-%m-%d %H:%M")
                    except Exception:
                        pass
            
            # Crear protocolo
            protocol = ExtractedProtocol(
                protocol_name=protocol_data.get('protocol_name', 'Protocolo'),
                case_id=case_id,
                session_id=session_id,
                steps=steps,
                extracted_from_response="",
                current_step=1,
                source_document=protocol_data.get('source_document')
            )
            
            # Guardar protocolo
            await protocol_execution_service.save_dynamic_protocol(protocol)
            
            return True
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parseando JSON del protocolo: {e}")
            return False
        except Exception as e:
            logger.error(f"Error guardando protocolo: {e}")
            return False


protocol_agent = ProtocolAgent()
