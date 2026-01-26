import { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useInterview } from '../contexts/InterviewContext';
import {
    InterviewHeader,
    CreateInterviewModal,
    InterviewList,
    InterviewPageSkeleton
} from '../features/interviews';
import InterviewToolbar from '../features/interviews/InterviewToolbar';

function InterviewPage() {
    const { current } = useTheme();
    const { isSidebarOpen, toggleSidebar } = useOutletContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { interviews, loading: contextLoading, refetch, error: contextError } = useInterview();
    const [isLoading, setIsLoading] = useState(true);

    // Toolbar State
    const [viewMode, setViewMode] = useState('grid');
    const [filters, setFilters] = useState({
        searchTerm: '',
        status: 'all',
        grade: 'all',
        gender: 'all',
        sortBy: 'date_desc',
        year: 'all',
        month: 'all',
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Control de carga: usar loading del contexto + estado local
    useEffect(() => {
        // Si el contexto terminó de cargar y tenemos datos (o array vacío)
        if (!contextLoading && interviews !== null) {
            // Mostrar datos inmediatamente sin delay artificial
            setIsLoading(false);
        } else if (!contextLoading && interviews === null && !contextError) {
            // Si terminó pero no hay datos y no hay error, intentar refetch
            refetch();
        } else if (contextError) {
            // Si hay error, dejar de cargar (la UI mostrará estado vacío o error)
            setIsLoading(false);
        }
    }, [interviews, contextLoading, refetch, contextError]);

    // Filter Logic
    const filteredInterviews = useMemo(() => {
        if (!interviews) return [];

        return interviews.filter(interview => {
            // Search
            const matchesSearch =
                (interview.studentName || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                (interview.interviewer || '').toLowerCase().includes(filters.searchTerm.toLowerCase());

            // Status
            const matchesStatus = filters.status === 'all' || interview.status === filters.status;

            // Grade
            const matchesGrade = filters.grade === 'all' || interview.grade === filters.grade;

            // Gender
            const matchesGender = filters.gender === 'all' || interview.gender === filters.gender;

            // Date Filters
            let matchesDate = true;
            if (filters.year !== 'all' || filters.month !== 'all') {
                const [day, month, year] = (interview.date || '').split(/[-/]/);

                if (filters.year !== 'all' && year !== filters.year) matchesDate = false;
                if (filters.month !== 'all' && month !== filters.month) matchesDate = false;
            }

            return matchesSearch && matchesStatus && matchesGrade && matchesGender && matchesDate;
        }).sort((a, b) => {
            // Helper to parse date
            const parseDate = (dateStr) => {
                if (!dateStr) return 0;
                const [day, month, year] = dateStr.split(/[-/]/);
                return new Date(year, month - 1, day).getTime();
            };

            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);

            switch (filters.sortBy) {
                case 'date_desc':
                    return dateB - dateA;
                case 'date_asc':
                    return dateA - dateB;
                case 'name_asc':
                    return (a.studentName || '').localeCompare(b.studentName || '');
                case 'name_desc':
                    return (b.studentName || '').localeCompare(a.studentName || '');
                default:
                    return 0;
            }
        });
    }, [interviews, filters]);

    // Calculate available dates for filters
    const { availableYears, availableMonths } = useMemo(() => {
        const years = new Set();
        const months = new Set();

        if (interviews) {
            interviews.forEach(interview => {
                if (interview.date) {
                    const [day, month, year] = interview.date.split(/[-/]/);
                    if (year) years.add(year);
                    if (month) months.add(month);
                }
            });
        }

        const monthNames = {
            '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
            '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
            '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
            '1': 'Enero', '2': 'Febrero', '3': 'Marzo', '4': 'Abril',
            '5': 'Mayo', '6': 'Junio', '7': 'Julio', '8': 'Agosto',
            '9': 'Septiembre'
        };

        const sortedYears = Array.from(years).sort((a, b) => b - a).map(y => ({ value: y, label: y }));
        const sortedMonths = Array.from(months).sort((a, b) => a - b).map(m => ({
            value: m,
            label: monthNames[m] || m
        }));

        return { availableYears: sortedYears, availableMonths: sortedMonths };
    }, [interviews]);

    return (
        <>
            {/* Mostrar skeleton mientras carga */}
            {isLoading ? (
                <InterviewPageSkeleton />
            ) : (
                <div className={`flex-1 flex flex-col rounded-lg shadow-sm shadow-cyan-600/20 ${current.cardBg} border border-gray-300 transition-all duration-300 overflow-hidden`}>

                    {/* Header personalizado tipo MyCases */}
                    <InterviewHeader
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={toggleSidebar}
                        textPrimary={current.textPrimary}
                    />

                    {/* Toolbar */}
                    <InterviewToolbar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onOpenModal={() => setIsModalOpen(true)}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        availableYears={availableYears}
                        availableMonths={availableMonths}
                    />

                    {/* Contenido Principal */}
                    <div className="flex-1 px-6 pb-6 overflow-y-auto">
                        <InterviewList
                            interviews={filteredInterviews}
                            onOpenModal={() => setIsModalOpen(true)}
                        />
                    </div>
                </div>
            )}

            {/* Modal de Creación */}
            <CreateInterviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}

export default InterviewPage;
