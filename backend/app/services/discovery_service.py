import logging
import mimetypes
from google.cloud import discoveryengine
from google.api_core.client_options import ClientOptions
from google.api_core import operations_v1
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class DiscoveryService:
    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self.location = settings.LOCATION or "global" # Discovery Engine location (e.g., global, us, eu)
        self.collection_id = "default_collection" # Fixed for now

    def _get_client_options(self, location: str = None):
        target_location = location or self.location
        if target_location != "global":
            return ClientOptions(api_endpoint=f"{target_location}-discoveryengine.googleapis.com")
        return None

    def create_data_store(self, school_id: str, school_name: str) -> str:
        """
        Creates a new Data Store for a school.
        
        Args:
            school_id: The UUID of the school.
            school_name: The name of the school (used for display).
            
        Returns:
            The ID of the created Data Store.
        """
        try:
            # Generate a unique Data Store ID
            # Constraints: 4-63 chars, lowercase, numbers, hyphens. Start with letter.
            short_id = school_id[:8].lower()
            data_store_id = f"colegio-{short_id}"
            
            logger.info(f"Creating Data Store '{data_store_id}' for school '{school_name}'")

            client = discoveryengine.DataStoreServiceClient(
                client_options=self._get_client_options()
            )

            parent = f"projects/{self.project_id}/locations/{self.location}/collections/{self.collection_id}"
            
            data_store = discoveryengine.DataStore(
                display_name=f"Data Store - {school_name}",
                industry_vertical=discoveryengine.IndustryVertical.GENERIC,
                solution_types=[discoveryengine.SolutionType.SOLUTION_TYPE_SEARCH],
                content_config=discoveryengine.DataStore.ContentConfig.CONTENT_REQUIRED, 
            )

            operation = client.create_data_store(
                parent=parent,
                data_store=data_store,
                data_store_id=data_store_id
            )

            logger.info(f"Waiting for Data Store creation operation: {operation.operation.name}")
            response = operation.result(timeout=300) # Wait for completion
            
            logger.info(f"Data Store created successfully: {response.name}")
            return data_store_id

        except Exception as e:
            logger.error(f"Error creating Data Store: {e}")
            raise

    def create_engine(self, school_id: str, data_store_id: str) -> str:
        """
        Creates a Search App (Engine) linked to the Data Store.
        
        Args:
            school_id: The UUID of the school.
            data_store_id: The ID of the Data Store to link.
            
        Returns:
            The ID of the created Engine (App).
        """
        try:
            # Use same ID pattern for Engine to keep it simple
            engine_id = f"app-{data_store_id}"
            
            logger.info(f"Creating Engine '{engine_id}' linked to Data Store '{data_store_id}'")

            client = discoveryengine.EngineServiceClient(
                client_options=self._get_client_options()
            )

            parent = f"projects/{self.project_id}/locations/{self.location}/collections/{self.collection_id}"

            engine = discoveryengine.Engine(
                display_name=f"App - {engine_id}",
                solution_type=discoveryengine.SolutionType.SOLUTION_TYPE_SEARCH,
                data_store_ids=[data_store_id],
                search_engine_config=discoveryengine.Engine.SearchEngineConfig(
                    search_tier=discoveryengine.SearchTier.SEARCH_TIER_STANDARD,
                    search_add_ons=[discoveryengine.SearchAddOn.SEARCH_ADD_ON_LLM] # Enable Gen AI features
                )
            )

            operation = client.create_engine(
                parent=parent,
                engine=engine,
                engine_id=engine_id
            )

            logger.info(f"Waiting for Engine creation operation: {operation.operation.name}")
            response = operation.result(timeout=300)
            
            logger.info(f"Engine created successfully: {response.name}")
            return engine_id

        except Exception as e:
            logger.error(f"Error creating Engine: {e}")
            raise

    def index_document(self, gcs_uri: str, school_id: str, data_store_id: str) -> bool:
        """
        Indexes a document in Discovery Engine.
        """
        try:
            logger.info(f"Indexing document {gcs_uri} in Data Store {data_store_id} (School {school_id})")
            
            client = discoveryengine.DocumentServiceClient(
                client_options=self._get_client_options()
            )
            
            parent = client.branch_path(
                project=self.project_id,
                location=self.location,
                data_store=data_store_id,
                branch="default_branch",
            )
            
            # Detect mime_type
            mime_type, _ = mimetypes.guess_type(gcs_uri)
            if not mime_type:
                logger.warning(f"Could not detect mime_type for {gcs_uri}, defaulting to application/pdf")
                mime_type = "application/pdf"

            document = {
                "content": {
                    "uri": gcs_uri,
                    "mime_type": mime_type
                },
                "struct_data": {
                    "school_id": school_id,
                    "gcs_uri": gcs_uri,
                },
            }
            
            # Generate stable ID from filename to allow deletion by filename
            filename = gcs_uri.split('/')[-1]
            # ID rules: 4-63 chars, [a-z0-9_-]. 
            # We'll use a sanitized version. 
            # Note: Filenames might have uppercase, spaces, etc.
            # Let's simple use a hash to be safe and consistent, OR sanitize.
            # Sanitizing gives better readability in console.
            import re
            safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', filename)
            # Ensure it fits length constraints (max 60 to be safe)
            document_id = safe_name[:60]
            
            # If document already exists, this might fail or we should use import_documents (upsert).
            # create_document fails if exists.
            # Let's try create, and if it exists, maybe we don't care (it's indexed).
            # Or use import which handles upsert, but is async LRO.
            # For simplicity in this agent: create. If fails, log warning.
            
            try:
                response = client.create_document(
                    parent=parent, 
                    document=document, 
                    document_id=document_id
                )
                logger.info(f"Document {gcs_uri} indexed successfully: {response.name}")
            except Exception as e:
                if "409" in str(e): # Already exists
                    logger.info(f"Document {document_id} already exists, skipping creation.")
                else:
                    raise e
                    
            return True
        except Exception as e:
            logger.error(f"Error indexing document {gcs_uri} in Data Store {data_store_id}: {e}")
            return False

    def delete_document(self, filename: str, data_store_id: str) -> bool:
        """
        Deletes a document from Discovery Engine using the sanitized filename as ID.
        """
        try:
            logger.info(f"Deleting document {filename} from Data Store {data_store_id}")
            
            client = discoveryengine.DocumentServiceClient(
                client_options=self._get_client_options()
            )
            
            # Reconstruct ID using same logic as index_document
            import re
            safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', filename)
            document_id = safe_name[:60]

            document_name = client.document_path(
                project=self.project_id,
                location=self.location,
                data_store=data_store_id,
                branch="default_branch",
                document=document_id,
            )
            
            client.delete_document(name=document_name)
            logger.info(f"Document {filename} (ID: {document_id}) deleted successfully from Data Store {data_store_id}.")
            return True
        except Exception as e:
            logger.error(f"Error deleting document {filename} from Data Store {data_store_id}: {e}")
            return False

    def list_documents(self, data_store_id: str) -> list:
        """
        Lists documents in a Data Store.
        """
        try:
            logger.info(f"Listing documents in Data Store {data_store_id}")
            
            client = discoveryengine.DocumentServiceClient(
                client_options=self._get_client_options()
            )
            
            parent = client.branch_path(
                project=self.project_id,
                location=self.location,
                data_store=data_store_id,
                branch="default_branch",
            )
            
            request = discoveryengine.ListDocumentsRequest(
                parent=parent,
                page_size=100
            )
            
            response = client.list_documents(request=request)
            
            documents = []
            for doc in response:
                documents.append({
                    "name": doc.name,
                    "uri": doc.content.uri if doc.content else None,
                    "id": doc.name.split("/")[-1]
                })
            
            return documents
            return documents
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            return []

    def delete_data_store(self, data_store_id: str) -> bool:
        """
        Deletes a Data Store.
        """
        try:
            logger.info(f"Deleting Data Store '{data_store_id}'")
            
            client = discoveryengine.DataStoreServiceClient(
                client_options=self._get_client_options()
            )
            
            # Manual path construction to avoid client library argument issues
            name = f"projects/{self.project_id}/locations/{self.location}/collections/{self.collection_id}/dataStores/{data_store_id}"
            
            operation = client.delete_data_store(name=name)
            logger.info(f"Waiting for Data Store deletion operation: {operation.operation.name}")
            try:
                operation.result(timeout=300)
            except Exception as e:
                # Ignore "Unexpected state" errors if the operation was void/empty
                if "Unexpected state" not in str(e):
                    raise e
            
            logger.info(f"Data Store '{data_store_id}' deleted successfully.")
            return True
        except Exception as e:
            logger.error(f"Error deleting Data Store '{data_store_id}': {e}")
            return False

    def delete_engine(self, engine_id: str) -> bool:
        """
        Deletes an Engine (App).
        """
        try:
            if not engine_id:
                return True

            logger.info(f"Deleting Engine '{engine_id}'")
            
            client = discoveryengine.EngineServiceClient(
                client_options=self._get_client_options()
            )
            
            # Manual path construction
            name = f"projects/{self.project_id}/locations/{self.location}/collections/{self.collection_id}/engines/{engine_id}"
            
            operation = client.delete_engine(name=name)
            logger.info(f"Waiting for Engine deletion operation: {operation.operation.name}")
            try:
                operation.result(timeout=300)
            except Exception as e:
                 # Ignore "Unexpected state" errors if the operation was void/empty
                if "Unexpected state" not in str(e):
                    raise e
            
            logger.info(f"Engine '{engine_id}' deleted successfully.")
            return True
        except Exception as e:
            logger.error(f"Error deleting Engine '{engine_id}': {e}")
            return False

# Singleton instance
discovery_service = DiscoveryService()
