import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  DashboardHeader,
  DailyActivityChart,
  RecentCases,
  DashboardSkeleton,
  StatsCards,
  SharedCasesChart,
  CaseStatusChart,
  RecentActivityTimeline,
  MonthlyCasesChart,
  InterviewCountChart,
  InterviewAssignmentChart,
  InterviewDemographicsChart
} from '../features/dashboard';
import { useDashboardData } from '../features/dashboard/hooks/useDashboardData';
import Breadcrumb from '../components/Breadcrumb';

function DashboardPage() {
  const { current } = useTheme();
  const context = useOutletContext();
  const { isSidebarOpen, toggleSidebar } = context || { isSidebarOpen: true, toggleSidebar: () => { } };
  const { dashboardData, isLoading, setSelectedMonth, selectedMonth, setSelectedYear, selectedYear } = useDashboardData();

  return (
    <>
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className={`flex-1 flex flex-col bg-white rounded-lg shadow-md border border-gray-300 transition-all duration-300 overflow-hidden`}>
          {/* Header */}
          <DashboardHeader
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            cases={dashboardData.allCases || []}
          />

          {/* Breadcrumb y Filtros */}
          <div className="px-4 mt-4 flex items-center justify-between">
            <Breadcrumb />

            <div className="flex items-center gap-3">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${current.textPrimary}`}
              >
                <option value="all">Todos los años</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${current.textPrimary}`}
              >
                <option value="all">Todos los meses</option>
                <option value="0">Enero</option>
                <option value="1">Febrero</option>
                <option value="2">Marzo</option>
                <option value="3">Abril</option>
                <option value="4">Mayo</option>
                <option value="5">Junio</option>
                <option value="6">Julio</option>
                <option value="7">Agosto</option>
                <option value="8">Septiembre</option>
                <option value="9">Octubre</option>
                <option value="10">Noviembre</option>
                <option value="11">Diciembre</option>
              </select>
            </div>
          </div>

          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto p-4 py-4  custom-scrollbar">
            {/* KPI Cards - Arriba del todo */}
            <StatsCards stats={dashboardData.stats} />

            {/* Fila 1: Casos próximos a vencer y gráficos */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <RecentCases
                cases={dashboardData.allCases}
              />
              <CaseStatusChart data={dashboardData.statusDistribution} />

              <InterviewDemographicsChart
                genderData={dashboardData.interviewsGender}
                gradeData={dashboardData.interviewsGrade}
              />
            </div>
            {/* Fila 3: Estadísticas de Entrevistas */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <InterviewCountChart data={dashboardData.interviewsGrade} />
              <InterviewAssignmentChart data={dashboardData.interviewsAssignment} />

            </div>
            {/* Fila 2: Evolución mensual y Actividad diaria */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <DailyActivityChart
                data={dashboardData.dailyActivity}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
              <MonthlyCasesChart
                data={dashboardData.monthlyEvolution}
                rollingData={dashboardData.monthlyRolling}
                selectedYear={selectedYear}
              />
              <SharedCasesChart data={dashboardData.sharedCases} />
            </div>



          </div>
        </div>
      )}
    </>
  );
}

export default DashboardPage;
