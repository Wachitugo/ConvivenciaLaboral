import { CheckCircle2, Clock, AlertCircle, XCircle, Activity } from 'lucide-react';
import EmptyChartState from './EmptyChartState';

export default function CaseStatusChart({ data }) {
  // Configuración de estados con iconos
  const statusConfig = {
    'Abiertos': {
      icon: AlertCircle,
      color: '#06b6d4', // neon cyan
      bgColor: 'bg-[#06b6d4]/20',
      textColor: 'text-[#06b6d4]',
      shadow: 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
    },
    'Pendientes': {
      icon: Clock,
      color: '#f59e0b', // neon amber
      bgColor: 'bg-[#f59e0b]/20',
      textColor: 'text-[#f59e0b]',
      shadow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
    },
    'Resueltos': {
      icon: CheckCircle2,
      color: '#10b981', // neon emerald
      bgColor: 'bg-[#10b981]/20',
      textColor: 'text-[#10b981]',
      shadow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
    },
    'No Resueltos': {
      icon: XCircle,
      color: '#ef4444', // neon red
      bgColor: 'bg-[#ef4444]/20',
      textColor: 'text-[#ef4444]',
      shadow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
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
    <div className="bg-[#0A3866]/40 backdrop-blur-xl border border-[#1A71B8]/30 p-6 rounded-3xl h-full flex flex-col transition-all duration-500 hover:shadow-[0_0_40px_rgba(52,182,216,0.2)] hover:bg-[#0A3866]/60 hover:border-[#34B6D8]/60 group relative overflow-hidden">
      <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#06b6d4]/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-[#06b6d4]/20 transition-all duration-700"></div>

      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="p-2 bg-blue-500/20 rounded-xl backdrop-blur-sm">
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h4 className="text-base font-bold text-white leading-tight">
            Estado de Casos
          </h4>
          <span className="text-xs text-white/60 font-medium">
            Resumen de gestión
          </span>
        </div>
      </div>

      {hasData ? (
        <div className="flex-1 flex flex-col justify-center space-y-5">
          {enhancedData.map((item, index) => {
            const Icon = item.config.icon;
            return (
              <div key={index} className="group/item">
                {/* Header con nombre y valor */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {Icon && (
                      <div className={`p-1 rounded-md ${item.config.bgColor} backdrop-blur-sm`}>
                        <Icon className={`w-3.5 h-3.5 ${item.config.textColor}`} />
                      </div>
                    )}
                    <span className="text-sm font-semibold text-white/80 group-hover/item:text-white transition-colors">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tabular-nums">
                      {item.value}
                    </span>
                    <span className="text-xs text-white/50 font-medium tabular-nums ml-1">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-[#1A71B8]/20 rounded-full h-3 overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-100 opacity-90 relative"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.config.color || '#cbd5e1',
                      boxShadow: `0 0 10px ${item.config.color || '#cbd5e1'}`
                    }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent to-white/30 mix-blend-overlay"></div>
                  </div>
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
