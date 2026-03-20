import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
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
import DashboardTour from '../features/dashboard/DashboardTour';
import { useState } from 'react';

function DashboardPage() {
  const { current } = useTheme();
  const context = useOutletContext();
  const { isSidebarOpen, toggleSidebar } = context || { isSidebarOpen: true, toggleSidebar: () => { } };
  const { dashboardData, isLoading, setSelectedMonth, selectedMonth, setSelectedYear, selectedYear } = useDashboardData();
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [selectedStatus, setSelectedStatus] = useState('all');

  return (
    <>
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
          <div className={`flex-1 flex flex-col bg-[#0A3866]/20 backdrop-blur-3xl border border-[#1A71B8]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] rounded-[32px] overflow-hidden transition-all duration-300 relative`}>
          {/* Futuristic Header */}
          <div className="relative px-8 py-8 overflow-hidden rounded-t-[32px] border-b border-[#1A71B8]/30 flex-shrink-0">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#34B6D8]/20 rounded-full blur-[100px] -z-10 mix-blend-screen opacity-50"></div>
            <div className="absolute -top-10 -right-10 w-80 h-80 bg-[#1A71B8]/30 rounded-full blur-[80px] -z-10 mix-blend-screen opacity-60"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
          
                <div>
                  <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E2F1FD] to-[#34B6D8] tracking-tight uppercase" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                    Tablero de Control
                  </h1>
                  <p className="text-sm font-medium text-[#34B6D8] tracking-widest uppercase mt-1 opacity-80 backdrop-blur-sm">
                    Sistema de Convivencia Laboral
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3" data-tour="dashboard-filters">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border border-[#1A71B8]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#34B6D8] bg-[#0A3866]/40 text-white backdrop-blur-md transition-all`}
                >
                  <option value="all">Todos los años</option>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border border-[#1A71B8]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#34B6D8] bg-[#0A3866]/40 text-white backdrop-blur-md transition-all`}
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
          </div>

          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 py-2 custom-scrollbar relative">
            {/* Grid Glows para fondo de contenido */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1A71B8]/5 via-[#0A3866]/0 to-transparent pointer-events-none blur-[120px] -z-10"></div>
            
            {/* KPI Cards - Arriba del todo */}
            <div data-tour="dashboard-stats">
              <StatsCards stats={dashboardData.stats} />
            </div>

            {/* Fila 1: Casos próximos a vencer y gráficos */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div data-tour="dashboard-recent-cases">
                <RecentCases cases={dashboardData.allCases} />
              </div>
              <div data-tour="dashboard-status-chart">
                <CaseStatusChart data={dashboardData.statusDistribution} />
              </div>
              <div data-tour="dashboard-demographics">
                <InterviewDemographicsChart
                  genderData={dashboardData.interviewsGender}
                  gradeData={dashboardData.interviewsGrade}
                />
              </div>
            </div>
            {/* Fila 3: Estadísticas de Entrevistas */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div data-tour="dashboard-interview-count">
                <InterviewCountChart data={dashboardData.interviewsGrade} />
              </div>
              <div data-tour="dashboard-interview-assignment">
                <InterviewAssignmentChart data={dashboardData.interviewsAssignment} />
              </div>
            </div>
            {/* Fila 2: Evolución mensual y Actividad diaria */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div data-tour="dashboard-daily-activity">
                <DailyActivityChart
                  data={dashboardData.dailyActivity}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                />
              </div>
              <div data-tour="dashboard-monthly-cases">
                <MonthlyCasesChart
                  data={dashboardData.monthlyEvolution}
                  rollingData={dashboardData.monthlyRolling}
                  selectedYear={selectedYear}
                />
              </div>
              <div data-tour="dashboard-shared-cases">
                <SharedCasesChart data={dashboardData.sharedCases} />
              </div>
            </div>



          </div>
        </div>
      )}
      <DashboardTour />
    </>
  );
}

export default DashboardPage;
