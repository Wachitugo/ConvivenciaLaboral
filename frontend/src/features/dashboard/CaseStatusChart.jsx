import { CheckCircle2, Clock, AlertCircle, XCircle, Activity } from 'lucide-react';
import EmptyChartState from './EmptyChartState';

export default function CaseStatusChart({ data }) {
  // Configuración de estados con iconos
  const statusConfig = {
    'Abiertos': {
      icon: AlertCircle,
      color: '#3b82f6', // blue-500
      bgColor: 'bg-blue-100', // Slightly darker for icon bg
      textColor: 'text-blue-600'
    },
    'Pendientes': {
      icon: Clock,
      color: '#f59e0b', // amber-500
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-600'
    },
    'Resueltos': {
      icon: CheckCircle2,
      color: '#10b981', // emerald-500
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600'
    },
    'No Resueltos': {
      icon: XCircle,
      color: '#ef4444', // red-500
      bgColor: 'bg-red-100',
      textColor: 'text-red-600'
    }
  };

  // Calcular total y porcentajes
  const total = data?.reduce((sum, item) => sum + item.value, 0) || 0;
  const enhancedData = (data || []).map(item => ({
    ...item,
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
    config: statusConfig[item.name] || {}
  }));

  const hasData = total > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Activity className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 className="text-base font-bold text-gray-800 leading-tight">
            Estado de Casos
          </h4>
          <span className="text-xs text-gray-500 font-medium">
            Resumen de gestión
          </span>
        </div>
      </div>

      {hasData ? (
        <div className="flex-1 flex flex-col justify-center space-y-5">
          {enhancedData.map((item, index) => {
            const Icon = item.config.icon;
            return (
              <div key={index} className="group">
                {/* Header con nombre y valor */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {Icon && (
                      <div className={`p-1 rounded-md ${item.config.bgColor.replace('50', '50')} bg-opacity-50`}>
                        <Icon className={`w-3.5 h-3.5 ${item.config.textColor}`} />
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800 tabular-nums">
                      {item.value}
                    </span>
                    <span className="text-xs text-gray-400 font-medium tabular-nums ml-1">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-90"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.config.color || '#cbd5e1'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyChartState
            title="Estado de Casos"
            message="No hay casos registrados"
          />
        </div>
      )}
    </div>
  );
}
