import { Clock, TrendingUp, FileText, Users } from 'lucide-react';
import EmptyChartState from './EmptyChartState';

export default function RecentActivityTimeline({ activities }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'created':
        return <FileText className="w-3.5 h-3.5" />;
      case 'updated':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'shared':
        return <Users className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'created':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500'
        };
      case 'updated':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          dot: 'bg-purple-500'
        };
      case 'shared':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          dot: 'bg-emerald-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          dot: 'bg-gray-400'
        };
    }
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Hace unos minutos';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInHours < 48) return 'Ayer';
    const days = Math.floor(diffInHours / 24);
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const hasData = activities && activities.length > 0;

  return (
    <div className="bg-gray-50 rounded-lg shadow-sm border border-stone-200 p-3">
      <h2 className="text-base font-semibold text-gray-800 mb-3">Actividad Reciente</h2>

      {hasData ? (
        <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
          {activities.slice(0, 8).map((activity, index) => {
            const colors = getActivityColor(activity.type);
            const isLast = index === Math.min(activities.length, 8) - 1;

            return (
              <div key={index} className="relative flex gap-3 group">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-[11px] top-7 w-[2px] h-full bg-gray-200" />
                )}

                {/* Icon circle */}
                <div className={`relative flex-shrink-0 w-6 h-6 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center z-10`}>
                  <div className={colors.text}>
                    {getActivityIcon(activity.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-3 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>

                  {/* Tags opcionales */}
                  {activity.tag && (
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                      {activity.tag}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center">
          <EmptyChartState message="No hay actividad reciente" />
        </div>
      )}

      {/* Footer */}
      {hasData && activities.length > 8 && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-center">
          <button className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Ver todas las actividades ({activities.length})
          </button>
        </div>
      )}
    </div>
  );
}
