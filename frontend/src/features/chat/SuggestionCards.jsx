function SuggestionCards({ onSuggestionClick }) {
  const suggestions = [
    {
      label: 'Reglamentos y normativas laborales',
      title: 'Normativa',
      desc: 'Leyes y reglamentos laborales.',
      color: 'bg-[#1A71B8]',
      tint: 'from-[#1A71B8]/5 to-transparent',
      border: 'border-[#1A71B8]/15 hover:border-[#1A71B8]/40',
      blob: 'bg-[#1A71B8]',
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      label: 'Análisis de casos de convivencia',
      title: 'Clima Laboral',
      desc: 'Evaluación de situaciones.',
      color: 'bg-[#0A3866]',
      tint: 'from-[#0A3866]/5 to-transparent',
      border: 'border-[#0A3866]/15 hover:border-[#0A3866]/40',
      blob: 'bg-[#0A3866]',
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
        </svg>
      )
    },
    {
      label: 'Análisis de documentos adjuntos',
      title: 'Protocolos',
      desc: 'Bienestar y acoso laboral.',
      color: 'bg-[#34B6D8]',
      tint: 'from-[#34B6D8]/8 to-transparent',
      border: 'border-[#34B6D8]/20 hover:border-[#34B6D8]/50',
      blob: 'bg-[#34B6D8]',
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    },
    {
      label: 'Protocolos de convivencia laboral',
      title: 'Mediación',
      desc: 'Resolución de conflictos.',
      color: 'bg-gradient-to-br from-[#1A71B8] to-[#0A3866]',
      tint: 'from-[#1A71B8]/5 to-transparent',
      border: 'border-[#1A71B8]/15 hover:border-[#1A71B8]/40',
      blob: 'bg-[#1A71B8]',
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion.label)}
          className={`flex items-center gap-3 p-4 text-left bg-white/10 backdrop-blur-sm border border-white/15 hover:border-white/30 hover:bg-white/15 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all group relative overflow-hidden`}
        >
          {/* Ícono */}
          <div className={`w-10 h-10 shrink-0 ${suggestion.color} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
            {suggestion.icon}
          </div>

          {/* Texto */}
          <div className="min-w-0">
            <p className="text-sm font-black text-white leading-tight truncate">{suggestion.title}</p>
            <p className="text-[10px] text-gray-300 leading-tight font-medium truncate mt-0.5">{suggestion.desc}</p>
          </div>

          {/* Flecha indicadora */}
          <svg className="w-3.5 h-3.5 text-white/30 group-hover:text-[#34B6D8] group-hover:translate-x-0.5 transition-all shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>

          {/* Blob decorativo esquina */}
          <div className={`absolute -bottom-3 -right-3 w-12 h-12 ${suggestion.blob} opacity-[0.12] rounded-full group-hover:scale-[2.5] group-hover:opacity-[0.08] transition-all duration-700`} />
        </button>
      ))}
    </div>
  );
}

export default SuggestionCards;
