import { useState, useEffect } from 'react';
import { tokensService } from '../../../services/api';

export function useTokensSection(initialTab = 'dashboard') {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [globalStats, setGlobalStats] = useState(null);
    const [schools, setSchools] = useState([]);
    const [users, setUsers] = useState([]);
    const [history, setHistory] = useState([]);
    const [logs, setLogs] = useState([]);
    // Default to last 7 days
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);

        const toLocalDateString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        return {
            start: toLocalDateString(start),
            end: toLocalDateString(end)
        };
    });
    const [selectedSchoolId, setSelectedSchoolId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTarget, setModalTarget] = useState(null);
    const [modalType, setModalType] = useState('user'); // 'user' or 'school'
    const [sortConfig, setSortConfig] = useState({ key: 'total_tokens', direction: 'desc' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, schoolsRes, usersRes] = await Promise.all([
                tokensService.getGlobalStats(),
                tokensService.getSchoolsStats(),
                tokensService.getUsersStats(),
            ]);
            setGlobalStats(statsRes);
            setSchools(schoolsRes);
            setUsers(usersRes);
        } catch (error) {
            console.error("Error loading token data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const filters = {
                startDate: dateRange.start,
                endDate: dateRange.end
            };
            if (selectedUserId) filters.userId = selectedUserId;
            else if (selectedSchoolId) filters.schoolId = selectedSchoolId;

            const historyRes = await tokensService.getHistory(null, filters);
            setHistory(historyRes);

            const logsRes = await tokensService.getLogs({ ...filters, limit: 50 });
            setLogs(logsRes);
        } catch (error) {
            console.error("Error fetching history/logs", error);
        }
    };

    useEffect(() => {
        if (activeTab === 'dashboard' || activeTab === 'logs') {
            fetchHistory();
        }
    }, [dateRange, selectedSchoolId, selectedUserId, activeTab]);

    // Reset user selection when school changes
    useEffect(() => {
        if (selectedSchoolId && selectedUserId) {
            const user = users.find(u => u.id === selectedUserId || u.uid === selectedUserId);
            if (user && !user.colegios?.includes(selectedSchoolId)) {
                setSelectedUserId('');
            }
        }
    }, [selectedSchoolId]);

    const filteredUsersForDropdown = selectedSchoolId
        ? users.filter(u => u.colegios?.includes(selectedSchoolId))
        : users;

    const handleEditLimit = (target, type) => {
        setModalTarget(target);
        setModalType(type);
        setModalOpen(true);
    };

    const handleSaveLimit = async (id, type, limits, thresholds) => {
        try {
            await tokensService.updateLimit(id, type, limits, thresholds);
            setModalOpen(false);
            fetchData(); // Refresh data
        } catch (error) {
            console.error("Error saving limit", error);
            alert("Error al guardar la configuración");
        }
    };

    const filteredSchools = schools.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = users.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.correo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const getSortedData = (data) => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            let aValue, bValue;

            if (sortConfig.key === 'total_tokens') {
                aValue = a.token_usage?.total_tokens || 0;
                bValue = b.token_usage?.total_tokens || 0;
            } else if (sortConfig.key === 'input_tokens') {
                aValue = a.token_usage?.input_tokens || 0;
                bValue = b.token_usage?.input_tokens || 0;
            } else if (sortConfig.key === 'output_tokens') {
                aValue = a.token_usage?.output_tokens || 0;
                bValue = b.token_usage?.output_tokens || 0;
            } else {
                return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const sortedSchools = getSortedData(filteredSchools);
    const sortedUsers = getSortedData(filteredUsers);

    const getSchoolName = (schoolId) => {
        const school = schools.find(s => s.id === schoolId);
        return school ? school.nombre : null;
    };

    return {
        // State
        activeTab,
        setActiveTab,
        globalStats,
        schools,
        users,
        history,
        logs,
        dateRange,
        setDateRange,
        selectedSchoolId,
        setSelectedSchoolId,
        selectedUserId,
        setSelectedUserId,
        loading,
        searchTerm,
        setSearchTerm,
        modalOpen,
        setModalOpen,
        modalTarget,
        modalType,
        sortConfig,

        // Computed
        filteredUsersForDropdown,
        sortedSchools,
        sortedUsers,

        // Actions
        fetchData,
        handleEditLimit,
        handleSaveLimit,
        handleSort,
        getSchoolName,
    };
}
