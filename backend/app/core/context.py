from contextvars import ContextVar
from typing import Optional

# ContextVar para propagar el ID del Data Store de Discovery Engine
# Esto permite que el SearchService (singleton) sepa qué índice consultar en cada request.
current_data_store_id: ContextVar[Optional[str]] = ContextVar("current_data_store_id", default=None)

# Mantenemos school_id por si acaso se requiere loguear o filtrar por metadatos adicionales,
# aunque el aislamiento fuerte ahora es por Data Store ID.
current_school_id: ContextVar[Optional[str]] = ContextVar("current_school_id", default=None)

# Store case context summary for query enrichment in search tools
current_case_context: ContextVar[Optional[str]] = ContextVar("current_case_context", default=None)

# Store session_id for session context retrieval in search tools
current_session_id: ContextVar[Optional[str]] = ContextVar("current_session_id", default=None)

# Store user email for tools that need to send emails on behalf of the user
current_user_email: ContextVar[Optional[str]] = ContextVar("current_user_email", default=None)
