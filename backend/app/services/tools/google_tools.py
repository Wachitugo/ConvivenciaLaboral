from google.oauth2 import service_account
import logging
from googleapiclient.discovery import build
import datetime
import base64
from email.mime.text import MIMEText
from app.core.config import get_settings


logger = logging.getLogger(__name__)
settings = get_settings()

class GoogleTools:
    def __init__(self):
        self.creds = service_account.Credentials.from_service_account_file(
            settings.GOOGLE_APPLICATION_CREDENTIALS,
            scopes=[
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/gmail.compose',
                'https://www.googleapis.com/auth/gmail.send'
            ]
        )
        # Delegación de dominio para enviar como el usuario especificado
        self.creds = self.creds.with_subject('contacto@convivenciainteligente.cl')

    def _text_to_html(self, text: str) -> str:
        """
        Convierte texto plano a HTML para mejor formato en correos.
        Detecta y formatea listas (*, -, •, números) como HTML.
        Elimina word-wrapping artificial del LLM y mantiene solo párrafos reales.
        Preserva el formato de la firma (nombre, cargo, institución).
        """
        import html
        import re
        
        # Escapar caracteres HTML especiales
        text = html.escape(text)

        # Convertir markdown a HTML (negritas, cursivas)
        # ***texto*** -> negrita + cursiva
        text = re.sub(r'\*\*\*(.*?)\*\*\*', r'<strong><em>\1</em></strong>', text)
        # **texto** -> negrita
        text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
        # *texto* -> cursiva (solo si tiene contenido)
        text = re.sub(r'\*([^\*\s][^\*]*?)\*', r'<em>\1</em>', text)
        
        # Normalizar saltos de línea
        text = text.replace('\r\n', '\n')
        
        # Detectar si hay una firma al final (después de "Atentamente" o similar)
        signature_markers = ['atentamente', 'cordialmente', 'saludos cordiales', 'quedo atento', 'queda atento', 'un saludo', 'sinceramente']
        signature_block = None
        main_text = text
        
        # Buscar el marcador de firma
        text_lower = text.lower()
        for marker in signature_markers:
            idx = text_lower.rfind(marker)
            if idx != -1:
                # Encontrar el final de la línea con el marcador
                end_of_marker_line = text.find('\n', idx)
                if end_of_marker_line != -1:
                    main_text = text[:end_of_marker_line + 1]
                    signature_block = text[end_of_marker_line + 1:]
                break
        
        def process_paragraph(p: str) -> str:
            """Procesa un párrafo, detectando si contiene una lista."""
            p = p.strip()
            if not p:
                return ''
            
            lines = p.split('\n')
            
            
            # Detectar si este párrafo contiene una lista
            list_pattern = re.compile(r'^[\s]*(?:[-*•]|\d+\.)\s+')
            list_items = []
            non_list_content = []
            current_list_type = None  # 'ul' para viñetas, 'ol' para números
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                
                # Detectar tipo de lista
                if re.match(r'^[-*•]\s+', line):
                    # Lista con viñetas
                    if current_list_type == 'ol' and list_items:
                        # Cambio de tipo, cerrar lista anterior
                        non_list_content.append(self._build_list_html('ol', list_items))
                        list_items = []
                    current_list_type = 'ul'
                    # Extraer contenido sin el marcador
                    content = re.sub(r'^[-*•]\s+', '', line)
                    list_items.append(content)
                elif re.match(r'^\d+\.\s+', line):
                    # Lista numerada
                    if current_list_type == 'ul' and list_items:
                        # Cambio de tipo, cerrar lista anterior
                        non_list_content.append(self._build_list_html('ul', list_items))
                        list_items = []
                    current_list_type = 'ol'
                    # Extraer contenido sin el número
                    content = re.sub(r'^\d+\.\s+', '', line)
                    list_items.append(content)
                else:
                    # No es ítem de lista
                    if list_items:
                        # Cerrar lista pendiente
                        non_list_content.append(self._build_list_html(current_list_type, list_items))
                        list_items = []
                        current_list_type = None
                    non_list_content.append(line)
            
            # Cerrar lista pendiente al final
            if list_items:
                non_list_content.append(self._build_list_html(current_list_type, list_items))
            
            # Si todo el párrafo era una lista, devolver solo la lista
            if len(non_list_content) == 1 and non_list_content[0].startswith('<'):
                return non_list_content[0]
            
            # Combinar contenido no-lista en párrafo
            text_content = ' '.join([c for c in non_list_content if not c.startswith('<')])
            list_content = ''.join([c for c in non_list_content if c.startswith('<')])
            
            result = ''
            if text_content:
                result += f'<p style="margin: 0 0 16px 0; line-height: 1.6;">{text_content}</p>'
            if list_content:
                result += list_content
            
            return result
        
        # Detectar párrafos reales (separados por línea en blanco)
        paragraphs = re.split(r'\n\s*\n', main_text)
        
        
        # CRITICAL FIX: Fusionar párrafos numerados consecutivos en un solo bloque
        # Problema: LLM genera "1. Item\n\n2. Item\n\n3. Item" → 3 listas separadas
        # Solución: Fusionar en "1. Item\n2. Item\n3. Item" → 1 lista única
        merged_paragraphs = []
        i = 0
        while i < len(paragraphs):
            current = paragraphs[i].strip()
            
            # Si este párrafo empieza con número (lista numerada)
            if re.match(r'^\d+\.\s+', current):
                # Iniciar acumulación de items consecutivos
                numbered_items = [current]
                i += 1
                
                # Mirar párrafos siguientes para ver si también son items numerados
                while i < len(paragraphs):
                    next_p = paragraphs[i].strip()
                    if re.match(r'^\d+\.\s+', next_p):
                        numbered_items.append(next_p)
                        i += 1
                    else:
                        break
                
                # Fusionar todos los items numerados en un solo párrafo
                merged_paragraph = '\n'.join(numbered_items)
                merged_paragraphs.append(merged_paragraph)
            else:
                merged_paragraphs.append(current)
                i += 1
        
        paragraphs = merged_paragraphs
        
        # Procesar cada párrafo del cuerpo principal
        html_paragraphs = []
        for p in paragraphs:
            processed = process_paragraph(p)
            if processed:
                html_paragraphs.append(processed)
        
        # Procesar la firma si existe (mantener saltos de línea como <br>)
        if signature_block:
            signature_lines = [line.strip() for line in signature_block.strip().split('\n') if line.strip()]
            if signature_lines:
                signature_html = '<br>'.join(signature_lines)
                html_paragraphs.append(f'<p style="margin: 16px 0 0 0; line-height: 1.6;">{signature_html}</p>')
        
        # Construir HTML completo
        html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
{''.join(html_paragraphs)}
</body>
</html>"""
        return html_body
    
    def _build_list_html(self, list_type: str, items: list) -> str:
        """Construye HTML para una lista (ul u ol), procesando sub-viñetas dentro de items."""
        import re
        tag = list_type or 'ul'
        style = 'margin: 8px 0 16px 0; padding-left: 24px; line-height: 1.6;'
        
        items_html_parts = []
        for item in items:
            # Procesar el item para detectar sub-viñetas (• o -)
            item_html = item
            
            # Si el item contiene viñetas, convertirlas a sub-lista
            if '•' in item or '\n-' in item or '\n*' in item:
                # Dividir por saltos de línea para detectar sub-items
                lines = item.split('\n')
                main_text_parts = []
                subitems = []
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    # Detectar si es una sub-viñeta
                    if re.match(r'^[•\-\*]\s+', line):
                        # Remover el marcador de viñeta
                        subitem_text = re.sub(r'^[•\-\*]\s+', '', line)
                        subitems.append(subitem_text)
                    else:
                        # Es parte del texto principal
                        main_text_parts.append(line)
                
                # Construir el HTML del item con su sub-lista
                main_text = ' '.join(main_text_parts)
                item_html = main_text
                
                if subitems:
                    # Agregar sub-lista <ul>
                    subitems_html = ''.join([f'<li style="margin-bottom: 2px; font-size: 0.95em;">{sub}</li>' for sub in subitems])
                    item_html += f'<ul style="margin: 4px 0 0 0; padding-left: 32px; line-height: 1.5;">{subitems_html}</ul>'
            
            items_html_parts.append(f'<li style="margin-bottom: 8px;">{item_html}</li>')
        
        items_html = ''.join(items_html_parts)
        return f'<{tag} style="{style}">{items_html}</{tag}>'

    def list_events(self, day: str = None):
        """Lista los eventos del calendario para un día específico (YYYY-MM-DD) o los próximos 10 eventos."""
        try:
            service = build('calendar', 'v3', credentials=self.creds)
            
            now = datetime.datetime.utcnow().isoformat() + 'Z'
            if day:
                start_of_day = datetime.datetime.strptime(day, "%Y-%m-%d").isoformat() + 'Z'
                end_of_day = (datetime.datetime.strptime(day, "%Y-%m-%d") + datetime.timedelta(days=1)).isoformat() + 'Z'
                time_min = start_of_day
                time_max = end_of_day
            else:
                time_min = now
                time_max = None

            events_result = service.events().list(
                calendarId='primary', timeMin=time_min, timeMax=time_max,
                maxResults=10, singleEvents=True,
                orderBy='startTime'
            ).execute()
            events = events_result.get('items', [])
            
            if not events:
                return "No hay eventos encontrados."
                
            event_list = []
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                event_list.append(f"{start} - {event['summary']}")
                
            return "\n".join(event_list)
        except Exception as e:
            return f"Error al listar eventos: {str(e)}"

    def create_event(self, summary: str, start_time: str, end_time: str, description: str = "", attendees: list[str] = None, delegate_email: str = None):
        """Crea un evento en el calendario. start_time y end_time en formato ISO (YYYY-MM-DDTHH:MM:SS)."""
        try:
            credentials_to_use = self.creds
            if delegate_email:
                logger.info(f"🔄 Creating event as: {delegate_email}")
                credentials_to_use = self.creds.with_subject(delegate_email)

            service = build('calendar', 'v3', credentials=credentials_to_use)
            
            event = {
                'summary': summary,
                'description': description,
                'start': {
                    'dateTime': start_time,
                    'timeZone': 'America/Santiago',
                },
                'end': {
                    'dateTime': end_time,
                    'timeZone': 'America/Santiago',
                },
            }
            
            if attendees:
                event['attendees'] = [{'email': email} for email in attendees]

            event = service.events().insert(calendarId='primary', body=event).execute()
            return f"Evento creado: {event.get('htmlLink')}"
        except Exception as e:
            error_str = str(e)
            # Fallback algorithm similar to send_email
            if delegate_email and ("unauthorized_client" in error_str or "400" in error_str or "401" in error_str):
                logger.warning(f"⚠️ Falló creación de evento como {delegate_email} ({error_str}). Reintentando con cuenta de sistema y agregando al usuario como invitado...")
                try:
                    # 1. Usar credenciales por defecto (Service Account / contacto)
                    service = build('calendar', 'v3', credentials=self.creds)
                    
                    # 2. Asegurar que el usuario original esté en los invitados
                    if delegate_email and attendees is not None:
                        if delegate_email not in attendees:
                            attendees.append(delegate_email)
                    elif delegate_email:
                        attendees = [delegate_email]
                    
                    # Reconstruir evento con lista actualizada de invitados
                    event_fallback = {
                        'summary': summary,
                        'description': description + f"\n\n(Evento creado por Asistente Virtual para {delegate_email})",
                        'start': {
                            'dateTime': start_time,
                            'timeZone': 'America/Santiago',
                        },
                        'end': {
                            'dateTime': end_time,
                            'timeZone': 'America/Santiago',
                        },
                        'attendees': [{'email': email} for email in attendees] if attendees else []
                    }
                    
                    created_event = service.events().insert(calendarId='primary', body=event_fallback).execute()
                    logger.info(f"✅ Evento creado exitosamente (Fallback) (Link: {created_event.get('htmlLink')})")
                    return f"Evento creado (vía sistema): {created_event.get('htmlLink')}"
                
                except Exception as e2:
                    return f"Error al crear evento (incluso tras fallback): {str(e2)}"

            return f"Error al crear evento: {str(e)}"

    def send_email(self, to: str, subject: str, body: str, delegate_email: str = None, cc: list[str] = None, sender_name: str = None):
        """Envía un correo desde Gmail. Intenta delegación para dominios corporativos, fallback a contacto si falla."""
        logger.info(f"📧 Iniciando envío de correo (To: {to}, CC: {cc}, Delegate?: {delegate_email}, SenderName: {sender_name})")
        
        # Lista negra de dominios públicos que sabemos que NO soportan delegación (son cuentas personales)
        public_domains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "aol.com"]
        
        should_delegate = False
        if delegate_email:
            domain = delegate_email.split('@')[-1].lower()
            if domain not in public_domains:
                should_delegate = True
            else:
                logger.info(f"ℹ️ Correo personal detectado ({domain}). Usando cuenta predeterminada.")

        # Intentar envío
        try:
            credentials_to_use = self.creds # Default
            sender_email = 'contacto@convivenciainteligente.cl'  # Email por defecto
            
            if should_delegate:
                logger.info(f"🔄 Intentando enviar como: {delegate_email}")
                # Esto crea una COPIA de las credenciales con el nuevo subject
                credentials_to_use = self.creds.with_subject(delegate_email)
                sender_email = delegate_email
            
            service = build('gmail', 'v1', credentials=credentials_to_use)
            
            # Convertir texto plano a HTML para mejor formato
            html_body = self._text_to_html(body)
            message = MIMEText(html_body, 'html')
            message['to'] = to
            if cc:
                # Handle single string or list
                if isinstance(cc, str):
                    cc = [cc]
                message['Cc'] = ", ".join(cc)
            
            # Configurar el nombre del remitente
            if sender_name:
                # Formato: "Nombre Display <email@domain.com>"
                message['From'] = f"{sender_name} <{sender_email}>"
            else:
                message['From'] = sender_email
                
            message['subject'] = subject
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            create_message = {'raw': raw}
            
            message = service.users().messages().send(userId='me', body=create_message).execute()
            logger.info(f"✅ Correo enviado exitosamente (ID: {message['id']})")
            return f"Correo enviado con ID: {message['id']}"
            
        except Exception as e:
            error_str = str(e)
            
            # Si falló la delegación (unauthorized), intentamos FALLBACK a demo1
            # "unauthorized_client" (401) indica permisos insuficientes para delegar en ese usuario/dominio
            if should_delegate and ("unauthorized_client" in error_str or "400" in error_str or "401" in error_str):
                logger.warning(f"⚠️ Falló delegación para {delegate_email} ({error_str}). Reintentando con cuenta predeterminada...")
                try:
                    # Retry with default creds
                    service = build('gmail', 'v1', credentials=self.creds)
                    fallback_email = 'contacto@convivenciainteligente.cl'
                    
                    # Usar HTML también en fallback
                    html_body = self._text_to_html(body)
                    message = MIMEText(html_body, 'html')
                    message['to'] = to
                    message['subject'] = subject
                    
                    # Usar sender_name si está disponible
                    if sender_name:
                        message['From'] = f"{sender_name} <{fallback_email}>"
                    else:
                        message['From'] = fallback_email
                    
                    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
                    create_message = {'raw': raw}
                    
                    message = service.users().messages().send(userId='me', body=create_message).execute()
                    logger.info(f"✅ Correo enviado exitosamente (Fallback) (ID: {message['id']})")
                    return f"Correo enviado con ID: {message['id']} (Enviado vía cuenta de sistema)"
                except Exception as e2:
                    return f"Error al enviar correo (incluso tras fallback): {str(e2)}"
            
            if "unauthorized_client" in error_str:
                return "Error: No autorizado. Asegúrese que el Service Account tenga Delegación de Dominio habilitada."
            
            return f"Error al enviar correo: {error_str}"


try:
    google_tools = GoogleTools()
except Exception as e:
    logger.warning(f" Could not initialize GoogleTools: {e}")
    class MockGoogleTools:
        def list_events(self, *args, **kwargs): return "Error: Calendar tool not available."
        def create_event(self, *args, **kwargs): return "Error: Calendar tool not available."
        def draft_email(self, *args, **kwargs): return "Error: Gmail tool not available."
        def send_email(self, *args, **kwargs): return "Error: Gmail tool not available."
    google_tools = MockGoogleTools()
