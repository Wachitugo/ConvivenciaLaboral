import { useState } from 'react';
import icon3 from '../../assets/icon3.png';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, BarChart3, School, Users, FileText } from 'lucide-react';

function AdminSidebar({ activeTab, setActiveTab, isOpen, onToggle }) {
    const navigate = useNavigate();
    const [expandedItems, setExpandedItems] = useState(['tokens']); // Tokens expanded by default

    const toggleExpand = (itemId) => {
        setExpandedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const navItems = [
        {
            id: 'usuarios',
            label: 'Usuarios',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            )
        },
        {
            id: 'colegios',
            label: 'Organizaciones',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.258 50.558 50.558 0 00-2.658.813m-15.482 0A50.553 50.553 0 0112 13.489a50.553 50.553 0 0112-2.122M2.25 21h19.5" />
                </svg>
            )
        },
        {
            id: 'tokens',
            label: 'Tokens',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
            ),
            children: [
                { id: 'tokens-dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'tokens-schools', label: 'Organizaciones', icon: School },
                { id: 'tokens-users', label: 'Usuarios', icon: Users },
                { id: 'tokens-logs', label: 'Historial', icon: FileText },
            ]
        }
    ];

    const isActiveParent = (item) => {
        if (item.children) {
            return item.children.some(child => activeTab === child.id);
        }
        return activeTab === item.id;
    };

    const handleItemClick = (item) => {
        if (item.children) {
            // Toggle expand/collapse
            toggleExpand(item.id);
            // If not expanded and has children, select first child
            if (!expandedItems.includes(item.id)) {
                setActiveTab(item.children[0].id);
            }
        } else {
            setActiveTab(item.id);
            if (window.innerWidth < 1024) onToggle();
        }
    };

    const handleChildClick = (childId) => {
        setActiveTab(childId);
        if (window.innerWidth < 1024) onToggle();
    };

    return (
        <aside
            className={`
                bg-white
                fixed inset-y-0 left-0 z-40 h-full
                transition-all duration-300 ease-in-out transform
                lg:static lg:h-screen lg:sticky lg:top-0
                ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}
            `}
            style={{ fontFamily: "'Poppins', sans-serif" }}
        >
            {/* Header del Sidebar */}
            <div className="px-4 py-6 flex items-center justify-between">
                <div className={`flex items-center ${!isOpen ? 'justify-center w-full' : 'gap-3'}`}>
                    <img src={icon3} alt="Admin" className="h-8 w-8 object-contain" />
                    {isOpen && (
                        <div className="flex flex-col overflow-hidden">
                            <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">Admin Panel</h2>
                            <p className="text-xs text-gray-500 whitespace-nowrap">Gestión del sistema</p>
                        </div>
                    )}
                </div>
                {/* Mobile Close Button */}
                <button
                    onClick={onToggle}
                    className="lg:hidden text-gray-400 hover:text-gray-600 p-1"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Toggle Button when closed - Centered (Desktop Only) */}
            {!isOpen && (
                <div className="hidden lg:flex justify-center mb-4">
                    <button
                        onClick={onToggle}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Navegación */}
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <div key={item.id}>
                        <button
                            onClick={() => handleItemClick(item)}
                            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200
                                ${isActiveParent(item)
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
                                ${!isOpen ? 'lg:justify-center' : ''}
                            `}
                            title={!isOpen ? item.label : ''}
                        >
                            <span className={`${isActiveParent(item) ? 'text-blue-600' : 'text-gray-500'}`}>
                                {item.icon}
                            </span>

                            <span className={`ml-3 whitespace-nowrap transition-opacity duration-300 flex-1 text-left ${!isOpen ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'}`}>
                                {item.label}
                            </span>

                            {/* Chevron for expandable items */}
                            {item.children && isOpen && (
                                <span className="text-gray-400">
                                    {expandedItems.includes(item.id) ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </span>
                            )}
                        </button>

                        {/* Children submenu */}
                        {item.children && expandedItems.includes(item.id) && isOpen && (
                            <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                                {item.children.map((child) => {
                                    const ChildIcon = child.icon;
                                    return (
                                        <button
                                            key={child.id}
                                            onClick={() => handleChildClick(child.id)}
                                            className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors duration-200
                                                ${activeTab === child.id
                                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                                }
                                            `}
                                        >
                                            <ChildIcon className="w-4 h-4 mr-2" />
                                            {child.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </nav>


            {/* Footer Navigation */}
            <div className="p-3 border-t border-gray-100 mt-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors duration-200 ${!isOpen ? 'lg:justify-center' : ''}`}
                    title={!isOpen ? "Volver al Dashboard" : ''}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>

                    <span className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${!isOpen ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'}`}>Ir al Sistema</span>
                </button>
            </div>
        </aside>
    );
}

export default AdminSidebar;
