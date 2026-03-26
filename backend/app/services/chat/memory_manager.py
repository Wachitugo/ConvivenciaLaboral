import re
import json
import logging
from typing import List, Dict
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_EXTRACT_PROMPT = """Eres un extractor de hechos clave de conversaciones sobre casos laborales chilenos.

Analiza la conversación y extrae/actualiza los hechos clave del caso.
Si ya hay hechos previos, actualízalos con la nueva información.

HECHOS A EXTRAER (solo si están confirmados en la conversación):
- denunciante: nombre y cargo/área del denunciante
- denunciado: nombre y cargo/área del denunciado
- tipo_caso: tipo de situación (Ley Karin, acoso laboral, acoso sexual, bullying, conflicto, etc.)
- fecha_denuncia: fecha de la denuncia si se menciona
- etapa: etapa actual del proceso (recepción, investigación, resolución, cierre, etc.)
- decisiones: lista de decisiones o recomendaciones clave tomadas
- pendientes: acciones pendientes identificadas

REGLAS:
- Solo incluye hechos CONFIRMADOS en la conversación, no suposiciones
- Si un hecho no se menciona, omítelo completamente (no escribas "no mencionado")
- Mantén los hechos previos si siguen siendo válidos
- Responde SOLO con JSON válido, sin texto adicional ni markdown

HECHOS PREVIOS:
{existing_facts}

CONVERSACIÓN RECIENTE:
{conversation}

JSON de hechos actualizados:"""


class MemoryManager:
    def __init__(self):
        self._llm = None

    @property
    def llm(self):
        if self._llm is None:
            from langchain_google_vertexai import ChatVertexAI
            model_name = settings.VERTEX_MODEL_FLASH or "gemini-2.0-flash-exp"
            self._llm = ChatVertexAI(
                model_name=model_name,
                temperature=0.1,
                project=settings.PROJECT_ID,
                location=settings.VERTEX_LOCATION or "us-central1",
            )
        return self._llm

    async def extract_and_update_facts(
        self, messages: List[BaseMessage], existing_facts: dict, window: int = 6
    ) -> dict:
        """Extract key facts from recent messages and merge with existing facts."""
        try:
            recent = messages[-window:] if len(messages) > window else messages
            conversation = ""
            for msg in recent:
                role = "Usuario" if isinstance(msg, HumanMessage) else "Asistente"
                content = msg.content if isinstance(msg.content, str) else str(msg.content)
                conversation += f"{role}: {content[:500]}\n"

            if not conversation.strip():
                return existing_facts or {}

            prompt = _EXTRACT_PROMPT.format(
                existing_facts=json.dumps(existing_facts or {}, ensure_ascii=False),
                conversation=conversation,
            )

            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            content = response.content.strip()

            # Strip markdown fences if present
            if "```" in content:
                match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", content)
                if match:
                    content = match.group(1)

            new_facts = json.loads(content)
            merged = {**existing_facts, **new_facts}
            # Remove empty / falsy values
            merged = {k: v for k, v in merged.items() if v}
            logger.info(f"🧠 [MEMORY] Facts updated: {list(merged.keys())}")
            return merged

        except Exception as e:
            logger.warning(f"[MEMORY] Error extracting facts: {e}")
            return existing_facts or {}

    def format_memory_context(self, facts: dict) -> str:
        """Format facts as readable text for injection into prompts."""
        if not facts:
            return ""

        label_map = {
            "denunciante": "Denunciante",
            "denunciado": "Denunciado",
            "tipo_caso": "Tipo de caso",
            "fecha_denuncia": "Fecha de denuncia",
            "etapa": "Etapa del proceso",
            "decisiones": "Decisiones tomadas",
            "pendientes": "Acciones pendientes",
        }

        lines = ["📋 MEMORIA DEL CASO (datos confirmados en sesiones anteriores):"]
        for key, value in facts.items():
            label = label_map.get(key, key.replace("_", " ").title())
            if isinstance(value, list):
                lines.append(f"- {label}: {', '.join(str(v) for v in value)}")
            else:
                lines.append(f"- {label}: {value}")

        return "\n".join(lines)


memory_manager = MemoryManager()
