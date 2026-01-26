import React, { useEffect } from 'react';
import { Coins, TrendingUp, RefreshCw } from 'lucide-react';
import { useTokensSection } from '../hooks/useTokensSection';

// Components
import StatCard from './StatCard';
import LimitModal from './LimitModal';
import TokenHistoryChart from './TokenHistoryChart';
import TokenActivityTimeline from './TokenActivityTimeline';
import TokensFilters from './TokensFilters';
import TokensTable from './TokensTable';
import SchoolsRanking from './SchoolsRanking';
import TokenLogsTable from './TokenLogsTable';
import SearchBar from './SearchBar';
import WarningsList from './WarningsList';

export default function TokensSection({ initialTab = 'dashboard' }) {
    const {
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
        filteredUsersForDropdown,
        sortedSchools,
        sortedUsers,
        fetchData,
        handleEditLimit,
        handleSaveLimit,
        handleSort,
        getSchoolName,
        sortConfig
    } = useTokensSection(initialTab);

    // Sync with parent's initialTab when it changes
    useEffect(() => {
        if (initialTab !== activeTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">
                Cargando dashboard de tokens...
            </div>
        );
    }

    // Render content based on active tab
    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <>
                        {/* Filters */}
                        <TokensFilters
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            selectedSchoolId={selectedSchoolId}
                            setSelectedSchoolId={setSelectedSchoolId}
                            selectedUserId={selectedUserId}
                            setSelectedUserId={setSelectedUserId}
                            schools={schools}
                            filteredUsersForDropdown={filteredUsersForDropdown}
                        />

                        {/* Schools Ranking */}
                        <SchoolsRanking schools={schools} />

                        {/* Warnings List */}
                        <WarningsList schools={schools} users={users} />

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 h-96">
                                <TokenHistoryChart
                                    data={history}
                                    period={`${dateRange.start} - ${dateRange.end}`}
                                />
                            </div>
                            <div className="h-96">
                                <TokenActivityTimeline data={history} />
                            </div>
                        </div>
                    </>
                );

            case 'schools':
                return (
                    <>
                        <SearchBar
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            activeTab={activeTab}
                        />
                        <TokensTable
                            activeTab={activeTab}
                            sortedSchools={sortedSchools}
                            sortedUsers={sortedUsers}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                            onEditLimit={handleEditLimit}
                            getSchoolName={getSchoolName}
                        />
                    </>
                );

            case 'users':
                return (
                    <>
                        <SearchBar
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            activeTab={activeTab}
                        />
                        <TokensTable
                            activeTab={activeTab}
                            sortedSchools={sortedSchools}
                            sortedUsers={sortedUsers}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                            onEditLimit={handleEditLimit}
                            getSchoolName={getSchoolName}
                        />
                    </>
                );

            case 'logs':
                return (
                    <>
                        {/* Filters for logs */}
                        <TokensFilters
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            selectedSchoolId={selectedSchoolId}
                            setSelectedSchoolId={setSelectedSchoolId}
                            selectedUserId={selectedUserId}
                            setSelectedUserId={setSelectedUserId}
                            schools={schools}
                            filteredUsersForDropdown={filteredUsersForDropdown}
                        />
                        <TokenLogsTable logs={logs} schools={schools} />
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <div className="flex flex-col h-full">
                {/* Stats Cards with refresh button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                        <StatCard
                            label="Consumo Total"
                            value={globalStats?.total_tokens}
                            icon={Coins}
                            color="blue"
                            subValue="Tokens totales procesados"
                        />
                        <StatCard
                            label="Input Tokens"
                            value={globalStats?.total_input_tokens}
                            icon={TrendingUp}
                            color="indigo"
                            subValue="Entrada al modelo"
                        />
                        <StatCard
                            label="Output Tokens"
                            value={globalStats?.total_output_tokens}
                            icon={TrendingUp}
                            color="violet"
                            subValue="Generados por modelo"
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
                        title="Actualizar datos"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                </div>

                {/* Main Content Card - No internal tabs, controlled by sidebar */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
                    <div className="p-4 md:p-6">
                        {renderTabContent()}
                    </div>
                </div>
            </div>

            {/* Limit Configuration Modal */}
            <LimitModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                target={modalTarget}
                type={modalType}
                onSave={handleSaveLimit}
            />
        </>
    );
}
