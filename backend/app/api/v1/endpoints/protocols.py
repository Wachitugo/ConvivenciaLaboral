from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.case_service import case_service
from app.schemas.protocol import ProtocolResponse, StepResponse, StepUpdateRequest
from app.services.protocols.protocol_extractor import protocol_extractor
from app.services.chat.chat_service import vertex_agent

router = APIRouter()

@router.get("/{case_id}", response_model=ProtocolResponse)
async def get_case_protocol(case_id: str):
    """Obtiene el protocolo completo de un caso"""
    try:
        protocol_case = case_service.get_protocol_case(case_id)
        if not protocol_case:
            raise HTTPException(status_code=404, detail="Protocol not found for this case")
        
        return ProtocolResponse(**protocol_case.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{case_id}/current-step", response_model=StepResponse)
async def get_current_step(case_id: str):
    """Obtiene el paso actual del protocolo"""
    try:
        current_step = case_service.get_current_step(case_id)
        if not current_step:
            raise HTTPException(status_code=404, detail="No active step found for this case")
        
        protocol_case = case_service.get_protocol_case(case_id)
        is_current = protocol_case.current_step == current_step.id
        
        return StepResponse(
            step=current_step,
            is_current=is_current,
            can_complete=is_current
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{case_id}/steps/{step_id}/complete")
async def complete_step(case_id: str, step_id: int, update_data: StepUpdateRequest):
    """Marca un paso como completado"""
    try:
        updated_protocol = case_service.update_protocol_step(
            case_id=case_id,
            step_id=step_id,
            notes=update_data.notes,
            evidence_files=update_data.evidence_files
        )
        
        return {"message": "Step completed successfully", "protocol": updated_protocol.model_dump()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{case_id}/steps", response_model=List[StepResponse])
async def get_all_steps(case_id: str):
    """Obtiene todos los pasos del protocolo con su estado"""
    try:
        protocol_case = case_service.get_protocol_case(case_id)
        if not protocol_case:
            raise HTTPException(status_code=404, detail="Protocol not found for this case")
        
        steps_response = []
        for step in protocol_case.steps:
            steps_response.append(StepResponse(
                step=step,
                is_current=protocol_case.current_step == step.id,
                can_complete=protocol_case.current_step == step.id
            ))
        
        return steps_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_case_for_protocol(case_description: str, case_type: str = None):
    """Analiza un caso y sugiere protocolos aplicables"""
    try:
        from app.services.protocols.protocol_service import protocol_manager
        
        suggested_protocols = protocol_manager.suggest_multiple_protocols(
            case_description=case_description,
            case_type=case_type,
            limit=3
        )
        
        suggestions = []
        for template, score, keywords in suggested_protocols:
            suggestions.append({
                "protocol_name": template.name,
                "category": template.category,
                "description": template.description,
                "confidence_score": score,
                "matched_keywords": keywords,
                "steps_count": len(template.steps),
                "estimated_duration": f"Entre {len(template.steps)} y {len(template.steps) * 2} días"
            })
        
        return {
            "suggestions": suggestions,
            "recommended": suggestions[0] if suggestions else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates")
async def get_all_protocol_templates():
    """Obtiene todas las plantillas de protocolos disponibles"""
    try:
        from app.services.protocols.protocol_service import protocol_manager
        
        templates = protocol_manager.get_all_templates()
        return {
            "templates": [
                {
                    "name": t.name,
                    "category": t.category,
                    "description": t.description,
                    "keywords": t.applicable_keywords,
                    "steps_count": len(t.steps)
                }
                for t in templates
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== NUEVOS ENDPOINTS PARA PROTOCOLOS DINÁMICOS RAG =====

@router.get("/dynamic/{case_id}")
async def get_dynamic_protocol(case_id: str, session_id: str):
    """
    Obtiene el protocolo dinámico completo extraído del RAG para un caso específico
    """
    try:
        # Cargar protocolo dinámico
        protocol = vertex_agent._load_dynamic_protocol(case_id, session_id)
        
        if not protocol:
            raise HTTPException(status_code=404, detail="No se encontró protocolo dinámico para este caso")
        
        # Formatear respuesta completa con todos los pasos
        formatted_response = protocol_extractor.format_complete_protocol_response(protocol)
        
        return {
            "protocol_name": protocol.protocol_name,
            "case_id": protocol.case_id,
            "session_id": protocol.session_id,
            "current_step": protocol.current_step,
            "total_steps": len(protocol.steps),
            "steps": [step.model_dump() for step in protocol.steps],
            "formatted_response": formatted_response,
            "is_completed": protocol.is_completed,
            "extracted_from_response": protocol.extracted_from_response[:500] + "..." if len(protocol.extracted_from_response) > 500 else protocol.extracted_from_response
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo protocolo dinámico: {str(e)}")

@router.post("/dynamic/{case_id}/step/{step_id}/complete")
async def complete_dynamic_step(
    case_id: str, 
    step_id: int, 
    session_id: str, 
    completion_data: Dict[str, Any]
):
    """
    Marca un paso del protocolo dinámico como completado
    """
    try:
        from datetime import datetime
        
        # Cargar protocolo actual
        protocol = vertex_agent._load_dynamic_protocol(case_id, session_id)
        
        if not protocol:
            raise HTTPException(status_code=404, detail="No se encontró protocolo dinámico para este caso")
        
        # Buscar el paso y marcarlo como completado
        step_found = False
        for step in protocol.steps:
            if step.id == step_id:
                step.status = "completed"
                step.completed_at = completion_data.get("completed_at", datetime.now().isoformat())
                step.notes = completion_data.get("notes", "Paso completado por el usuario")
                step_found = True
                break
        
        if not step_found:
            raise HTTPException(status_code=404, detail=f"No se encontró el paso {step_id}")
        
        # Actualizar paso actual al siguiente
        if step_id == protocol.current_step and protocol.current_step < len(protocol.steps):
            protocol.current_step += 1
        
        # Verificar si el protocolo está completado
        if all(step.status == "completed" for step in protocol.steps):
            protocol.is_completed = True
        
        # Guardar protocolo actualizado
        vertex_agent._save_dynamic_protocol(protocol)
        
        # Formatear nueva respuesta con todos los pasos actualizados
        formatted_response = protocol_extractor.format_complete_protocol_response(protocol)
        
        next_step_info = None
        if protocol.current_step <= len(protocol.steps):
            next_step_info = protocol.steps[protocol.current_step - 1].model_dump()
        
        return {
            "message": f"Paso {step_id} marcado como completado exitosamente",
            "protocol_name": protocol.protocol_name,
            "current_step": protocol.current_step,
            "is_completed": protocol.is_completed,
            "formatted_response": formatted_response,
            "next_step": next_step_info,
            "total_completed": len([s for s in protocol.steps if s.status == "completed"]),
            "total_steps": len(protocol.steps)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error completando paso dinámico: {str(e)}")

@router.get("/dynamic/{case_id}/next-step")
async def get_next_dynamic_step(case_id: str, session_id: str):
    """
    Obtiene el siguiente paso pendiente del protocolo dinámico
    """
    try:
        protocol = vertex_agent._load_dynamic_protocol(case_id, session_id)
        
        if not protocol:
            raise HTTPException(status_code=404, detail="No se encontró protocolo dinámico para este caso")
        
        # Buscar siguiente paso pendiente
        next_step = None
        for step in protocol.steps:
            if step.status in ["pending", "in_progress"]:
                next_step = step
                break
        
        if not next_step:
            return {
                "message": "¡Protocolo completado! Todos los pasos han sido finalizados.",
                "is_completed": True,
                "protocol_name": protocol.protocol_name,
                "total_steps": len(protocol.steps),
                "completed_steps": len(protocol.steps)
            }
        
        return {
            "protocol_name": protocol.protocol_name,
            "current_step": protocol.current_step,
            "next_step": next_step.model_dump(),
            "total_steps": len(protocol.steps),
            "completed_steps": len([s for s in protocol.steps if s.status == "completed"]),
            "progress_percentage": round((len([s for s in protocol.steps if s.status == "completed"]) / len(protocol.steps)) * 100, 1)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo siguiente paso dinámico: {str(e)}")

@router.get("/dynamic/{case_id}/formatted-response")
async def get_formatted_protocol_response(case_id: str, session_id: str):
    """
    Obtiene la respuesta formateada completa del protocolo dinámico para mostrar en el chat
    """
    try:
        protocol = vertex_agent._load_dynamic_protocol(case_id, session_id)
        
        if not protocol:
            raise HTTPException(status_code=404, detail="No se encontró protocolo dinámico para este caso")
        
        formatted_response = protocol_extractor.format_complete_protocol_response(protocol)
        
        return {
            "protocol_name": protocol.protocol_name,
            "formatted_response": formatted_response,
            "current_step": protocol.current_step,
            "is_completed": protocol.is_completed
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando respuesta formateada: {str(e)}")