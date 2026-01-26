import { useState } from 'react';
import AdminSidebar from '../features/crud-admin/AdminSidebar';

export default function AdminLayout({ children, activeTab, setActiveTab }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* Main Content Area Wrapper */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden p-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-gray-900">
                            {activeTab === 'usuarios' ? 'Gestión de Usuarios' : activeTab === 'colegios' ? 'Gestión de Colegios' : 'Admin Panel'}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {activeTab === 'usuarios' ? 'Administración de usuarios' : activeTab === 'colegios' ? 'Instituciones registradas' : 'Gestión del sistema'}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Inner Content Container */}
                <div className="flex-1 p-0 lg:p-2 overflow-hidden flex flex-col">
                    <div className="flex-1 bg-white rounded-none lg:rounded-2xl shadow-sm border-0 lg:border border-gray-200 overflow-hidden relative flex flex-col">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
