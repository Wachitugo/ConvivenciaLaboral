// crud-admin feature - solo para módulos de administración general
export { default as AdminPage } from './TestAPIPage';
export { default as AlertMessages } from './AlertMessages';
export { default as UsersSection } from './UsersSection';
export { default as BulkUploadModal } from './BulkUploadModal';
export { default as BulkUploadSection } from './BulkUploadSection';
export { default as AdminSidebar } from './AdminSidebar';
export { TokensSection } from '../tokens';
export { default as ColegioSearchInput } from './ColegioSearchInput';

// Re-export from schools feature for backward compatibility
export { SchoolsSection } from '../schools';
