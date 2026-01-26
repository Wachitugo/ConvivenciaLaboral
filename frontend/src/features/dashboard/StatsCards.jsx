import { TrendingUp, TrendingDown, Minus, FileText, Users, FileCheck, AlertCircle } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      label: 'Total Casos',
      value: stats.total || 0,
      trend: stats.totalTrend || 0,
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'Protocolos Vencidos',
      value: stats.expiredProtocols || 0,
      trend: 0,
      icon: AlertCircle,
      color: 'rose',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600'
    },
    {
      label: 'Total Entrevistas',
      value: stats.totalInterviews || 0,
      trend: 0,
      icon: Users,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      label: 'Entrevistas Autorizadas',
      value: stats.authorizedInterviews || 0,
      trend: 0,
      icon: FileCheck,
      color: 'violet',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600'
    }
  ];

  /* const getTrendIcon = (trend) => { ... } - Keeping logic if needed later, but simplified for now */

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate mb-1">
                  {card.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-gray-800 tabular-nums leading-none">
                    {card.value}
                  </h3>
                  {/* Placeholder for trend if needed provided visual balance */}
                </div>
              </div>
              <div className={`p-2.5 rounded-lg ${card.bgColor} transition-colors group-hover:bg-opacity-80`}>
                <Icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
