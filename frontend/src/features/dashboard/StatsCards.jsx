import { TrendingUp, TrendingDown, Minus, FileText, Users, FileCheck, AlertCircle } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      label: 'Total Casos',
      value: stats.total || 0,
      trend: stats.totalTrend || 0,
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400'
    },
    {
      label: 'Protocolos Vencidos',
      value: stats.expiredProtocols || 0,
      trend: 0,
      icon: AlertCircle,
      color: 'rose',
      bgColor: 'bg-rose-500/20',
      textColor: 'text-rose-400'
    },
    {
      label: 'Total Entrevistas',
      value: stats.totalInterviews || 0,
      trend: 0,
      icon: Users,
      color: 'indigo',
      bgColor: 'bg-indigo-500/20',
      textColor: 'text-indigo-400'
    },
    {
      label: 'Entrevistas Autorizadas',
      value: stats.authorizedInterviews || 0,
      trend: 0,
      icon: FileCheck,
      color: 'violet',
      bgColor: 'bg-violet-500/20',
      textColor: 'text-violet-400'
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
            className="relative bg-[#0A3866]/40 backdrop-blur-xl border border-[#1A71B8]/30 p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-[#0A3866]/60 hover:border-[#34B6D8]/80 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(52,182,216,0.3)] group overflow-hidden"
          >
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#34B6D8]/20 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <div className="flex items-start justify-between relative z-10">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 transition-colors group-hover:text-[#34B6D8]/80">
                  {card.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 tabular-nums leading-none tracking-tight transition-all duration-500 group-hover:from-white group-hover:to-[#34B6D8] drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
                    {card.value}
                  </h3>
                  {/* Placeholder for trend if needed provided visual balance */}
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${card.bgColor} backdrop-blur-md border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_20px_var(--tw-shadow-color)]`} style={{ '--tw-shadow-color': card.textColor === 'text-blue-400' ? 'rgba(96,165,250,0.4)' : card.textColor === 'text-rose-400' ? 'rgba(251,113,133,0.4)' : card.textColor === 'text-indigo-400' ? 'rgba(129,140,248,0.4)' : 'rgba(192,132,252,0.4)' }}>
                <Icon className={`w-6 h-6 ${card.textColor} group-hover:brightness-125 transition-all`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
