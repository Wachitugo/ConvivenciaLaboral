import logging
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class TranscriptionService:
    def __init__(self):
        self._llm = None
    
    @property
    def llm(self):
        if self._llm is None:
            model_name = settings.VERTEX_MODEL_FLASH or settings.VERTEX_MODEL_REASON or settings.VERTEX_MODEL
            
            self._llm = ChatVertexAI(
                model_name=model_name,
                temperature=0.0,
                project=settings.PROJECT_ID,
                location=settings.VERTEX_LOCATION or "us-central1",
            )
        return self._llm
    
    async def transcribe_audio(self, audio_uri: str, mime_type: str, user_id: str = None) -> str:
        """
        Transcribes audio from GCS URI using Vertex AI (Gemini).
        This is more robust to file formats than Speech-to-Text API.
        """
        try:
            logger.info(f"Transcribing audio from {audio_uri} using Gemini")
            
            message = HumanMessage(
                content=[
                    {"type": "text", "text": "Transcribe el siguiente audio textualmente. Entrega SOLO el texto transcrito, sin etiquetas de hablantes, sin introducciones ni texto adicional."},
                    {
                        "type": "media",
                        "mime_type": mime_type,
                        "file_uri": audio_uri
                    }
                ]
            )
            
            response = await self.llm.ainvoke([message])
        
            # Track Usage
            if user_id and hasattr(response, 'usage_metadata'):
                 from app.services.users.user_service import user_service
                 user_service.update_token_usage(
                    user_id=user_id,
                    input_tokens=response.usage_metadata.get('input_tokens', 0),
                    output_tokens=response.usage_metadata.get('output_tokens', 0),
                    model_name=self.llm.model_name
                )

            return response.content
            
        except Exception as e:
            logger.error(f"Error transcribing with Gemini: {e}")
            raise e

transcription_service = TranscriptionService()
