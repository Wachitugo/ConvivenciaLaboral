import re
import logging
import json
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime
from app.schemas.protocol import ProtocolStep, ExtractedProtocol


logger = logging.getLogger(__name__)
class ProtocolExtractor:
    def __init__(self):
        pass

    def extract_protocol_from_response(self, ai_response: str, case_id: str, session_id: str) -> Optional[ExtractedProtocol]:
        """
        Extrae automáticamente un protocolo de la respuesta del agente RAG buscando un bloque JSON.
        """
        # 1. Buscar bloque JSON en la respuesta
        json_data = self._extract_json_block(ai_response)
        
        if not json_data:
            return None
            
        try:
            # 2. Validar estructura básica
            if "protocol_name" not in json_data or "steps" not in json_data:
                logger.warning(f" JSON extraído no tiene la estructura requerida (protocol_name, steps)")
                return None
                
            protocol_name = json_data.get("protocol_name", "Protocolo de Convivencia Escolar")
            steps_data = json_data.get("steps", [])
            
            if not steps_data:
                return None
                
            # 3. Convertir pasos a objetos ProtocolStep
            steps = []
            for step_item in steps_data:
                # Manejar posibles variaciones en las claves
                step_id = step_item.get("id")
                title = step_item.get("title")
                description = step_item.get("description", "")
                
                if step_id is not None and title:
                    steps.append(ProtocolStep(
                        id=int(step_id),
                        title=str(title).strip(),
                        description=str(description).strip(),
                        estimated_time=step_item.get("estimated_time")
                    ))
            
            if not steps:
                return None
                
            # Ordenar por ID
            steps.sort(key=lambda x: x.id)
            
            # 4. Marcar el primer paso como completado si así se indica o por defecto
            current_step_idx = json_data.get("current_step", 1)
            
            # Lógica opcional: marcar pasos anteriores como completados
            for step in steps:
                if step.id < current_step_idx:
                    step.status = "completed"
                    step.completed_at = datetime.now().isoformat()
                elif step.id == current_step_idx:
                    step.status = "in_progress"
                    step.notes = json_data.get("next_step_instruction", "Paso actual")
            
            return ExtractedProtocol(
                protocol_name=protocol_name,
                case_id=case_id,
                session_id=session_id,
                steps=steps,
                extracted_from_response=ai_response,
                current_step=current_step_idx + 1 if current_step_idx < len(steps) else current_step_idx,
                source_document=json_data.get("source_document")
            )
            
        except Exception as e:
            logger.error(f"Error procesando JSON de protocolo: {e}")
            return None

    def _extract_json_block(self, text: str) -> Optional[Dict[str, Any]]:
        """Busca y extrae el primer bloque JSON válido en el texto"""
        # Patrón para encontrar bloques de código JSON: ```json ... ```
        json_pattern = r'```(?:json)?\s*(\{.*?\})\s*```'
        matches = re.findall(json_pattern, text, re.DOTALL)
        
        for match in matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue
                
        # Intentar buscar JSON sin bloques de código si no se encontró nada
        # Busca desde la primera { hasta la última }
        try:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1 and end > start:
                json_str = text[start:end+1]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass
            
        return None

    def format_complete_protocol_response(self, protocol: 'ExtractedProtocol') -> str:
        """
        Formatea una respuesta legible para el usuario basada en el protocolo extraído.
        Retorna un bloque JSON para que el frontend lo renderice interactivamente.
        """
        if not protocol or not protocol.steps:
            return ""
        
        # Convertir a diccionario
        protocol_dict = {
            "protocol_name": protocol.protocol_name,
            "steps": [
                {
                    "id": step.id,
                    "title": step.title,
                    "description": step.description,
                    "status": step.status,
                    "estimated_time": step.estimated_time,
                    "deadline": step.deadline,
                    "notes": step.notes
                } for step in protocol.steps
            ],
            "current_step": protocol.current_step,
            "next_step_instruction": next((s.title for s in protocol.steps if s.status == "in_progress"), next((s.title for s in protocol.steps if s.status == "pending"), "Proceder con el siguiente paso")),
            "source_document": protocol.source_document
        }

        # Retornar como bloque de código JSON
        return f"```json\n{json.dumps(protocol_dict, ensure_ascii=False, indent=2)}\n```"
    
    def calculate_deadline(self, estimated_time: str, base_date: Optional[datetime] = None) -> Optional[str]:
        """Calcula una fecha límite basada en el tiempo estimado (texto)"""
        if not estimated_time:
            return None
            
        import re
        from datetime import datetime, timedelta
        
        try:
            now = base_date or datetime.now()
            # Ensure timezone awareness/unawareness consistency is handled by caller or here
            # For simple calculation, we might want to strip tz if mixed, but better to respect base_date
            
            deadline = None
            
            # Normalizar
            text = estimated_time.lower().strip()
            
            try:
                import holidays
                chile_holidays = holidays.CL()
            except ImportError:
                # Fallback: Cálculo manual de feriados fijos
                chile_holidays = set()
                years = [now.year, now.year + 1]
                
                # Feriados fijos de Chile base
                fixed_dates = [
                    (1, 1),   # Año Nuevo
                    (5, 1),   # Día del Trabajo
                    (5, 21),  # Glorias Navales
                    (6, 29),  # San Pedro y San Pablo
                    (7, 16),  # Virgen del Carmen
                    (8, 15),  # Asunción de la Virgen
                    (9, 18),  # Independencia Nacional
                    (9, 19),  # Glorias del Ejército
                    (10, 31), # Iglesias Evangélicas (aprox)
                    (11, 1),  # Todos los Santos
                    (12, 8),  # Inmaculada Concepción
                    (12, 25)  # Navidad
                ]
                
                for year in years:
                    for month, day in fixed_dates:
                        from datetime import date
                        chile_holidays.add(date(year, month, day))

            if "inmediato" in text or "inmediata" in text:
                deadline = now
            elif "hora" in text:
                # Buscar número de horas
                matches = re.findall(r'(\d+)\s*hora', text)
                if matches:
                    hours = int(matches[0])
                    deadline = now + timedelta(hours=hours)
            elif "día" in text or "dia" in text:
                # Buscar número de días
                matches = re.findall(r'(\d+)', text) 
                if matches:
                    days = int(matches[-1]) 
                    
                    is_business_days = "hábiles" in text or "habiles" in text
                    
                    if is_business_days:
                        current_date = now
                        days_added = 0
                        # Limit loop to avoid infinite loops in weird cases
                        max_iterations = days * 4 
                        iterations = 0
                        
                        while days_added < days and iterations < max_iterations:
                            current_date += timedelta(days=1)
                            iterations += 1
                            
                            # 0=Monday, 5=Saturday, 6=Sunday
                            if current_date.weekday() >= 5:
                                continue
                            
                            # Chequear si es feriado
                            # Handle both date objects and timestamps depending on library
                            check_date = current_date.date() if isinstance(current_date, datetime) else current_date
                            if check_date in chile_holidays:
                                continue
                                
                            days_added += 1
                        deadline = current_date
                    else:
                        deadline = now + timedelta(days=days)
            
            if deadline:
                return deadline.strftime("%Y-%m-%d %H:%M")
                
            return None
        except Exception as e:
            logger.warning(f"Error calculating deadline: {e}")
            return None

protocol_extractor = ProtocolExtractor()