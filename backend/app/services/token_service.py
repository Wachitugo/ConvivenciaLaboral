import logging
from typing import Optional, Tuple
from app.services.users.user_service import user_service
from app.services.school_service import school_service

logger = logging.getLogger(__name__)

class LimitExceededException(Exception):
    def __init__(self, message: str, limit_type: str):
        self.message = message
        self.limit_type = limit_type
        super().__init__(self.message)

class TokenService:
    def check_limits(self, user_id: str, input_tokens_cost: int = 0) -> None:
        """
        Verifica si el usuario o su colegio han excedido los límites de tokens.
        Lanza LimitExceededException si se excede algún límite.
        
        Args:
            user_id: ID del usuario
            input_tokens_cost: Costo estimado de tokens de entrada para esta request (opcional)
        """
        if not user_id:
            return

        try:
            # 1. Obtener usuario con sus datos de uso y límites
            user = user_service.get_user_by_id(user_id)
            if not user:
                return

            # --- CHECK USUARIO ---
            if user.token_usage:
                # Input Limit
                if user.input_token_limit is not None:
                    current_input = user.token_usage.input_tokens
                    if current_input + input_tokens_cost > user.input_token_limit:
                        raise LimitExceededException(
                            f"Has excedido tu límite mensual de tokens de entrada ({user.input_token_limit}).",
                            "user_input"
                        )
                
                # Output Limit (Solo chequeamos uso histórico, no podemos predecir output exacto)
                # Si ya está pasado, no dejamos generar más.
                if user.output_token_limit is not None:
                    current_output = user.token_usage.output_tokens
                    if current_output >= user.output_token_limit:
                        raise LimitExceededException(
                            f"Has excedido tu límite mensual de tokens de salida ({user.output_token_limit}).",
                            "user_output"
                        )

            # --- CHECK COLEGIOS ---
            # Si el usuario pertenece a colegios, verificamos los límites de CADA colegio.
            # Basta con que UNO esté bloqueado para bloquear (o política estricta).
            # Asumimos que el usuario consume de TODOS sus colegios asociados (aunque usualmente es 1).
            if user.colegios:
                for school_id in user.colegios:
                    school = school_service.get_colegio_by_id(school_id)
                    if school and school.token_usage:
                        # Input Limit
                        if school.input_token_limit is not None:
                            current_input = school.token_usage.input_tokens
                            if current_input + input_tokens_cost > school.input_token_limit:
                                raise LimitExceededException(
                                    f"El colegio {school.nombre} ha excedido su límite de tokens de entrada.",
                                    "school_input"
                                )
                        
                        # Output Limit
                        if school.output_token_limit is not None:
                            current_output = school.token_usage.output_tokens
                            if current_output >= school.output_token_limit:
                                raise LimitExceededException(
                                    f"El colegio {school.nombre} ha excedido su límite de tokens de salida.",
                                    "school_output"
                                )

        except LimitExceededException:
            raise
        except Exception as e:
            logger.error(f"Error checking token limits for user {user_id}: {e}")
            # En caso de error de sistema, decidimos si bloquear o fall open. 
            # Fall open (no bloquear) es más seguro para UX a menos que sea crítico.
            pass

token_service = TokenService()
