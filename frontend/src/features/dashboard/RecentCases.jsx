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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 max-h-[380px] flex flex-col transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="p-2 bg-orange-50 rounded-lg">
          <Clock className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h4 className="text-base font-bold text-gray-800 leading-tight">
            Casos por Vencer
          </h4>
          <span className="text-xs text-gray-500 font-medium">
            Atención prioritaria
          </span>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
        {upcomingCases.length > 0 ? (
          upcomingCases.map((caseItem) => (
            <div
              key={caseItem.id}
              onClick={() => handleCaseClick(caseItem)}
              className="group border border-gray-100 bg-gray-50/50 rounded-lg p-3 hover:bg-orange-50/50 hover:border-orange-200 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 flex-1 group-hover:text-orange-700 transition-colors">
                  {caseItem.title}
                </h3>
                {caseItem.counterCase && (
                  <span className="text-[10px] text-gray-500 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200 flex-shrink-0 shadow-sm">
                    {caseItem.counterCase}
                  </span>
                )}
              </div>
              <div
                className={`flex items-center gap-2 ${caseItem.deadlineStatus === 'red'
                  ? 'text-rose-600 bg-rose-50 border border-rose-100'
                  : 'text-amber-600 bg-amber-50 border border-amber-100'
                  } px-2 py-1.5 rounded-md w-fit`}
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
