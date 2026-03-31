"""
Protocol Guide Tool — Guía interactiva del protocolo Ley Karin paso a paso.

Esta tool permite al agente LÍA:
1. Consultar el estado actual del protocolo de un caso
2. Marcar un paso como completado
3. Obtener el siguiente paso con su plazo legal

Plazos Ley Karin (Ley 21.643):
- Inmediato     : Medidas de resguardo al recibir la denuncia
- 3 días hábiles: Notificar a la Dirección del Trabajo (DT)
- 30 días       : Concluir la investigación interna
- 2 días hábiles: Remitir informe + conclusiones a la DT
- 30 días hábiles: DT se pronuncia sobre el informe
- 15 días corridos: Empleador aplica medidas y sanciones
- 3 días hábiles: Comunicar despido por escrito (si aplica)
"""

import json
import logging
from typing import Optional
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

# Guías y acciones sugeridas por paso del protocolo Ley Karin
STEP_GUIDANCE = {
    1: {
        "guia": (
            "Adopta de forma **inmediata** medidas para proteger a la persona denunciante: "
            "separación de espacios físicos, redistribución de jornada o cambio de turno. "
            "Estas medidas son **cautelares**, no implican prejuzgamiento de ninguna de las partes."
        ),
        "acciones": [
            "📄 Escribe **'redactar medida de resguardo'** para generar la Resolución de Medida de Resguardo.",
        ],
    },
    2: {
        "guia": (
            "Informa a la **Inspección del Trabajo** sobre la recepción de la denuncia y las medidas de resguardo adoptadas. "
            "Si no realizarás investigación interna o la denuncia es contra el empleador, también debes remitir la denuncia a la DT en este plazo."
        ),
        "acciones": [
            "📄 Escribe **'redactar notificación a la DT'** para generar la carta a la Dirección del Trabajo.",
            "📧 Escribe **'redactar correo a la DT'** si prefieres enviarlo por correo electrónico.",
        ],
    },
    3: {
        "guia": (
            "Designa formalmente a la persona que conducirá la investigación. "
            "Debe ser **imparcial**, sin relación directa con las partes y con capacitación en acoso laboral. "
            "Notifica tu decisión a las partes."
        ),
        "acciones": [
            "📄 Escribe **'redactar resolución de apertura'** para formalizar el inicio de la investigación y designar al investigador/a.",
        ],
    },
    4: {
        "guia": (
            "Notifica por escrito a la persona **denunciante** y a la persona **denunciada** sobre: "
            "la apertura del proceso, el nombre del investigador/a designado/a, sus derechos (ser escuchados, presentar pruebas, derecho a defensa) "
            "y el plazo del proceso. Garantiza la confidencialidad."
        ),
        "acciones": [
            "📄 Escribe **'redactar notificación al denunciado'** para la carta formal a la persona denunciada.",
            "📄 Escribe **'redactar notificación al denunciante'** para confirmar la recepción de la denuncia.",
        ],
    },
    5: {
        "guia": (
            "Realiza el proceso completo de investigación: entrevista a la persona denunciante, a la persona denunciada "
            "y a los testigos. Recopila evidencias y documentos relevantes. Elabora actas de cada entrevista. "
            "Tienes un plazo máximo de **30 días corridos** desde la recepción de la denuncia."
        ),
        "acciones": [
            "📅 Escribe **'agendar entrevista con denunciante'** para programar la primera declaración.",
            "📅 Escribe **'agendar entrevista con denunciado'** para la declaración de la persona investigada.",
            "📅 Escribe **'agendar entrevista con testigos'** si hay testigos a entrevistar.",
        ],
    },
    6: {
        "guia": (
            "Redacta el **informe final de investigación** e inclúyelo con las conclusiones. "
            "Debe contener: hechos investigados, pruebas analizadas, conclusiones y medidas o sanciones sugeridas. "
            "Debes remitirlo electrónicamente a la DT dentro de **2 días hábiles** tras cerrar la investigación."
        ),
        "acciones": [
            "📄 Escribe **'redactar informe de conclusiones'** para elaborar el informe final de investigación.",
            "📧 Escribe **'redactar correo para remitir informe a la DT'** para preparar el envío electrónico.",
        ],
    },
    7: {
        "guia": (
            "Aplica las medidas y sanciones definitivas según las conclusiones del informe "
            "(o las del pronunciamiento de la DT si hubo). "
            "Tienes **15 días corridos** desde la notificación del pronunciamiento. "
            "Si la sanción es el despido, debes comunicarlo por escrito en **3 días hábiles**."
        ),
        "acciones": [
            "📄 Escribe **'redactar comunicación de sanción'** para notificar la medida disciplinaria.",
            "📄 Escribe **'redactar carta de despido'** si esa es la sanción aplicada.",
        ],
    },
}


def create_protocol_guide_tool(case_id: Optional[str], session_id: Optional[str]):
    """
    Fábrica que crea la tool de guía de protocolo capturando case_id/session_id por closure.
    Retorna None si no hay case_id activo.
    """
    if not case_id:
        return None

    @tool
    def guia_protocolo_karin(action: str, step_id: Optional[int] = None, notes: Optional[str] = None) -> str:
        """Gestiona el protocolo Ley Karin del caso activo.

        Usa esta herramienta cuando el usuario quiera:
        - Saber en qué paso del protocolo está ("estado", "qué sigue", "siguiente paso")
        - Completar un paso del protocolo ("completar paso", "marcar como hecho", "paso completado")
        - Ver los plazos legales del protocolo

        Args:
            action: Una de estas opciones:
                    "estado"    → Ver el paso actual y progreso del protocolo
                    "completar" → Marcar el paso actual como completado (requiere step_id)
                    "plazos"    → Ver todos los plazos de la Ley Karin
                    "activar"   → Activar el protocolo estándar Ley Karin para este caso
            step_id: ID numérico del paso a completar (solo para action="completar")
            notes:   Notas opcionales al completar un paso

        Returns:
            Resumen del estado del protocolo con el siguiente paso y su plazo legal.
        """
        from app.services.protocols.protocol_execution_service import protocol_execution_service
        import asyncio

        try:
            if action == "plazos":
                return _get_ley_karin_plazos()

            if action == "activar":
                return _activate_ley_karin_protocol(case_id, session_id or "")

            # Cargar protocolo desde Firestore
            loop = asyncio.new_event_loop()
            try:
                protocol = loop.run_until_complete(
                    protocol_execution_service.load_dynamic_protocol(case_id, session_id or "")
                )
            finally:
                loop.close()

            if not protocol:
                return (
                    "No hay un protocolo activo para este caso. "
                    "Puedes activarlo diciéndome **'activar protocolo Ley Karin'**."
                )

            if action == "estado":
                return _format_protocol_status(protocol)

            elif action == "completar":
                if step_id is None:
                    current = protocol_execution_service.get_current_dynamic_step(protocol)
                    if current:
                        step_id = current.id
                    else:
                        return "✅ Todos los pasos del protocolo han sido completados."

                return _complete_step(protocol, step_id, notes, case_id, session_id)

            else:
                return f"Acción '{action}' no reconocida. Usa: 'activar', 'estado', 'completar' o 'plazos'."

        except Exception as e:
            logger.error(f"❌ [PROTOCOL GUIDE] Error: {e}")
            return f"Error al consultar el protocolo: {str(e)}"

    return guia_protocolo_karin


def _get_ley_karin_plazos() -> str:
    return """**Plazos legales Ley Karin (Ley 21.643):**

⚡ **Inmediato** — Adoptar medidas de resguardo al recibir la denuncia
   (separación de espacios, redistribución de jornada, etc.)

📅 **3 días hábiles** — Informar a la Dirección del Trabajo (DT) sobre:
   • La recepción de la denuncia
   • Las medidas de resguardo adoptadas
   • Remitir a DT si no se realiza investigación interna o si la denuncia es contra el empleador

📅 **30 días corridos** — Plazo máximo para concluir la investigación interna

📅 **2 días hábiles** — Remitir informe y conclusiones a la DT tras la investigación

📅 **30 días hábiles** — Plazo de la DT para pronunciarse sobre el informe
   (si no hay pronunciamiento, las conclusiones de la empresa son válidas)

📅 **15 días corridos** — Empleador aplica medidas y sanciones definitivas
   (contados desde la notificación del pronunciamiento de la DT)

📅 **3 días hábiles** — Comunicar el despido por escrito al trabajador (si esa es la sanción)"""


def _format_protocol_status(protocol) -> str:
    total = len(protocol.steps)
    completed = sum(1 for s in protocol.steps if s.status == "completed")
    current = None
    for s in protocol.steps:
        if s.status == "pending":
            current = s
            break

    lines = [f"**Protocolo:** {protocol.protocol_name}"]
    lines.append(f"**Progreso:** {completed}/{total} pasos completados\n")

    # Pasos completados
    for s in protocol.steps:
        if s.status == "completed":
            lines.append(f"[ok] Paso {s.id}: {s.title}")

    # Paso actual
    if current:
        lines.append(f"\n**Paso actual — Paso {current.id}: {current.title}**")
        if current.deadline:
            lines.append(f"**Plazo:** {current.deadline}")
        elif current.estimated_time:
            lines.append(f"**Plazo:** {current.estimated_time}")

        # Guía específica del paso
        guidance = STEP_GUIDANCE.get(current.id)
        if guidance:
            lines.append(f"\n{guidance['guia']}")
            if guidance.get("acciones"):
                lines.append("\n**¿Qué hacer ahora?**")
                for accion in guidance["acciones"]:
                    lines.append(f"• {accion}")

        lines.append(f"\nCuando completes este paso dime **'completar paso {current.id}'**.")
    else:
        lines.append("\n**Todos los pasos han sido completados.**")

    # Pasos pendientes siguientes (preview)
    pending_next = [s for s in protocol.steps if s.status == "pending" and (current is None or s.id > current.id)]
    if pending_next:
        lines.append("\n**Próximos pasos:**")
        for s in pending_next[:3]:
            deadline_str = f" — {s.deadline or s.estimated_time}" if (s.deadline or s.estimated_time) else ""
            lines.append(f"  {s.id}. {s.title}{deadline_str}")

    return "\n".join(lines)


def _activate_ley_karin_protocol(case_id: str, session_id: str) -> str:
    """
    Crea y guarda el protocolo estándar Ley Karin (Ley 21.643) en Firestore.
    Calcula los plazos desde la fecha de creación del caso.
    """
    from app.schemas.protocol import ProtocolStep, ExtractedProtocol
    from app.services.protocols.protocol_execution_service import protocol_execution_service
    from app.services.protocols.protocol_extractor import protocol_extractor
    from app.services.case_service import case_service
    from datetime import datetime
    import asyncio

    # Obtener fecha de creación del caso como base para plazos
    base_date = None
    try:
        case = case_service.get_case_by_id(case_id)
        if case and case.created_at:
            base_date = case.created_at
            if hasattr(base_date, 'tzinfo') and base_date.tzinfo:
                base_date = base_date.replace(tzinfo=None)
    except Exception as e:
        logger.warning(f"⚠️ [PROTOCOL ACTIVATE] Could not fetch case date: {e}")

    if not base_date:
        base_date = datetime.utcnow()

    # Verificar si ya existe un protocolo
    loop = asyncio.new_event_loop()
    try:
        existing = loop.run_until_complete(
            protocol_execution_service.load_dynamic_protocol(case_id, session_id)
        )
    finally:
        loop.close()

    if existing:
        return (
            f"⚠️ Ya existe un protocolo activo para este caso: **{existing.protocol_name}**.\n"
            f"Tiene {len(existing.steps)} pasos. Para ver el estado actual dime 'estado del protocolo'."
        )

    # Definir los 7 pasos estándar Ley Karin
    raw_steps = [
        {
            "id": 1,
            "title": "Adoptar Medidas de Resguardo",
            "description": (
                "Adoptar de forma inmediata medidas para proteger a la persona denunciante: "
                "separación de espacios físicos, redistribución de jornada, cambio de turno u otras "
                "medidas que eviten el contacto entre las partes mientras dure la investigación. "
                "Dejar constancia escrita de las medidas adoptadas."
            ),
            "estimated_time": "Inmediato",
        },
        {
            "id": 2,
            "title": "Notificar a la Dirección del Trabajo (DT)",
            "description": (
                "Informar a la Inspección del Trabajo competente sobre: la recepción de la denuncia, "
                "las medidas de resguardo adoptadas y si se realizará investigación interna o externa. "
                "Plazo: 3 días hábiles desde la recepción de la denuncia."
            ),
            "estimated_time": "3 días hábiles",
        },
        {
            "id": 3,
            "title": "Designar Investigador/a",
            "description": (
                "Designar formalmente a la persona que conducirá la investigación interna. "
                "Debe ser imparcial, no tener relación directa con las partes y contar con "
                "capacitación en materias de acoso y violencia laboral. Notificar a las partes."
            ),
            "estimated_time": "Inmediato",
        },
        {
            "id": 4,
            "title": "Notificar Formalmente a las Partes",
            "description": (
                "Notificar por escrito a la persona denunciante y a la persona denunciada sobre: "
                "la apertura del proceso de investigación, el nombre del investigador/a designado/a, "
                "sus derechos (a ser escuchados, a presentar pruebas, derecho a defensa) "
                "y el plazo del proceso. Garantizar confidencialidad."
            ),
            "estimated_time": "3 días hábiles",
        },
        {
            "id": 5,
            "title": "Conducir la Investigación Interna",
            "description": (
                "Realizar el proceso de investigación: entrevistar a la persona denunciante, "
                "a la persona denunciada y a testigos; recopilar evidencias y documentos relevantes; "
                "elaborar actas de cada entrevista; analizar los antecedentes. "
                "Plazo máximo: 30 días corridos desde la recepción de la denuncia."
            ),
            "estimated_time": "30 días corridos",
        },
        {
            "id": 6,
            "title": "Remitir Informe con Conclusiones a la DT",
            "description": (
                "Redactar y remitir el informe final de investigación a la Inspección del Trabajo, "
                "incluyendo: hechos investigados, pruebas analizadas, conclusiones y medidas "
                "o sanciones sugeridas. "
                "Plazo: 2 días hábiles desde el término de la investigación."
            ),
            "estimated_time": "2 días hábiles",
        },
        {
            "id": 7,
            "title": "Aplicar Medidas y Sanciones",
            "description": (
                "Una vez que la DT se pronuncie sobre el informe (o transcurridos 30 días hábiles "
                "sin pronunciamiento), el empleador aplica las medidas y sanciones definitivas "
                "según las conclusiones. Si la sanción es el despido, comunicarlo por escrito "
                "al trabajador dentro de 3 días hábiles. "
                "Plazo para aplicar medidas: 15 días corridos desde la notificación del pronunciamiento."
            ),
            "estimated_time": "15 días corridos",
        },
    ]

    # Calcular deadlines desde base_date
    steps = []
    for raw in raw_steps:
        deadline = protocol_extractor.calculate_deadline(raw["estimated_time"], base_date)
        steps.append(ProtocolStep(
            id=raw["id"],
            title=raw["title"],
            description=raw["description"],
            estimated_time=raw["estimated_time"],
            deadline=deadline,
        ))

    protocol = ExtractedProtocol(
        protocol_name="Protocolo Ley Karin (Ley 21.643)",
        case_id=case_id,
        session_id=session_id,
        steps=steps,
        current_step=1,
        extracted_from_response="Activado manualmente por LÍA",
    )

    # Guardar en Firestore
    save_loop = asyncio.new_event_loop()
    try:
        save_loop.run_until_complete(protocol_execution_service.save_dynamic_protocol(protocol))
    finally:
        save_loop.close()

    logger.info(f"✅ [PROTOCOL ACTIVATE] Protocol activated for case {case_id}")

    # Formatear respuesta
    first_step = steps[0]
    lines = [
        "**Protocolo Ley Karin activado** para este expediente.",
        f"Se han creado **{len(steps)} pasos** con sus plazos legales.\n",
        f"**Paso 1: {first_step.title}**",
        f"{first_step.description}",
    ]
    if first_step.deadline:
        lines.append(f"\n**Plazo:** {first_step.deadline}")
    else:
        lines.append(f"\n**Plazo:** {first_step.estimated_time}")

    # Guía específica del primer paso
    guidance = STEP_GUIDANCE.get(1)
    if guidance and guidance.get("acciones"):
        lines.append("\n**¿Qué hacer ahora?**")
        for accion in guidance["acciones"]:
            lines.append(f"• {accion}")

    return "\n".join(lines)


def _complete_step(protocol, step_id: int, notes: Optional[str], case_id: str, session_id: Optional[str]) -> str:
    from google.cloud import firestore as _firestore
    from app.core.config import get_settings
    from app.services.protocols.protocol_execution_service import protocol_execution_service
    from datetime import datetime
    import asyncio

    settings = get_settings()

    # Marcar el paso como completado en el objeto
    step_found = None
    for s in protocol.steps:
        if s.id == step_id:
            s.status = "completed"
            s.completed_at = datetime.utcnow().isoformat()
            if notes:
                s.notes = notes
            step_found = s
            break

    if not step_found:
        return f"No se encontró el paso {step_id} en el protocolo."

    # Persistir en Firestore
    try:
        db = _firestore.Client(project=settings.PROJECT_ID, database=settings.FIRESTORE_DATABASE)
        doc_ref = db.collection("case_protocols").document(case_id)
        doc_ref.update({
            "steps": [s.model_dump() for s in protocol.steps],
            "updated_at": _firestore.SERVER_TIMESTAMP,
        })
        logger.info(f"✅ [PROTOCOL GUIDE] Step {step_id} marked as completed for case {case_id}")
    except Exception as e:
        logger.error(f"❌ [PROTOCOL GUIDE] Error saving step completion: {e}")

    # Obtener siguiente paso
    next_step = None
    for s in protocol.steps:
        if s.status == "pending":
            next_step = s
            break

    completed_count = sum(1 for s in protocol.steps if s.status == "completed")
    total = len(protocol.steps)

    lines = [f"**Paso {step_id} completado:** {step_found.title}"]
    lines.append(f"Progreso: {completed_count}/{total} pasos\n")

    if next_step:
        lines.append(f"**Siguiente paso — Paso {next_step.id}: {next_step.title}**")
        if next_step.deadline:
            lines.append(f"**Plazo:** {next_step.deadline}")
        elif next_step.estimated_time:
            lines.append(f"**Plazo:** {next_step.estimated_time}")

        # Guía específica del siguiente paso
        guidance = STEP_GUIDANCE.get(next_step.id)
        if guidance:
            lines.append(f"\n{guidance['guia']}")
            if guidance.get("acciones"):
                lines.append("\n**¿Qué hacer ahora?**")
                for accion in guidance["acciones"]:
                    lines.append(f"• {accion}")

        lines.append(f"\nCuando completes este paso dime **'completar paso {next_step.id}'**.")
    else:
        lines.append("**Protocolo completado.** Todos los pasos han sido ejecutados.")

    return "\n".join(lines)
