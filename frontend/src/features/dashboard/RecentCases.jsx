import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EmptyChartState from './EmptyChartState';
import { AlertCircle, Clock } from 'lucide-react';

export default function RecentCases({ cases = [] }) {
  const navigate = useNavigate();
  const { schoolSlug } = useParams();

  // Filtrar y ordenar casos próximos a vencer
  const upcomingCases = useMemo(() => {
    return cases
      .filter(c => c.deadlineStatus === 'red' || c.deadlineStatus === 'yellow')
      .sort((a, b) => {
        // Ordenar por fecha de vencimiento: el más próximo primero
        if (a.nextDeadlineDate && b.nextDeadlineDate) {
          return a.nextDeadlineDate - b.nextDeadlineDate;
        }
        return 0;
      });
  }, [cases]);

  const handleCaseClick = (caseItem) => {
    const basePath = schoolSlug ? `/${schoolSlug}` : '';
    navigate(`${basePath}/mis-casos/${caseItem.id}`, { state: { caseData: caseItem } });
  };

  return (
    <div className="bg-[#0A3866]/40 backdrop-blur-xl border border-[#1A71B8]/30 p-6 rounded-3xl max-h-[380px] flex flex-col transition-all duration-500 hover:shadow-[0_0_40px_rgba(52,182,216,0.2)] hover:bg-[#0A3866]/60 hover:border-[#34B6D8]/60 group relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-red-500/20 transition-all duration-700"></div>

      <div className="flex items-center gap-3 mb-6 flex-shrink-0 relative z-10">
        <div className="p-2 bg-orange-500/20 rounded-xl backdrop-blur-sm">
          <Clock className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h4 className="text-base font-bold text-white leading-tight">
            Casos por Vencer
          </h4>
          <span className="text-xs text-white/60 font-medium">
            Atención prioritaria
          </span>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar relative z-10">
        {upcomingCases.length > 0 ? (
          upcomingCases.map((caseItem) => (
            <div
              key={caseItem.id}
              onClick={() => handleCaseClick(caseItem)}
              className="group/card border border-[#1A71B8]/30 bg-[#0A3866]/50 rounded-xl p-3 hover:bg-[#1A71B8]/20 hover:border-[#34B6D8]/50 transition-all cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-white/90 text-sm line-clamp-2 flex-1 group-hover/card:text-[#34B6D8] transition-colors">
                  {caseItem.title}
                </h3>
                {caseItem.counterCase && (
                  <span className="text-[10px] text-white/80 font-mono bg-[#1A71B8]/20 px-1.5 py-0.5 rounded border border-[#1A71B8]/40 flex-shrink-0 shadow-sm">
                    {caseItem.counterCase}
                  </span>
                )}
              </div>
              <div
                className={`flex items-center gap-2 ${caseItem.deadlineStatus === 'red'
                  ? 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
                  : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                  } px-2 py-1.5 rounded-md w-fit backdrop-blur-sm`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${caseItem.deadlineStatus === 'red'
                  ? 'bg-rose-500 animate-pulse'
                  : 'bg-amber-500'
                  }`} />

                {caseItem.deadlineText && (
                  <span className="text-xs font-semibold whitespace-nowrap">
                    {caseItem.deadlineText}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyChartState
              title="Sin Vencimientos"
              message="No hay casos próximos a vencer."
              icon={AlertCircle}
            />
          </div>
        )}
      </div>
    </div>
  );
}
