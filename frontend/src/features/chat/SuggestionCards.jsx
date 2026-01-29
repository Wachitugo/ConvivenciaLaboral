function SuggestionCards({ onSuggestionClick }) {
  const suggestions = [
    'Reglamentos y normativas laborales',
    'Análisis de casos y situaciones de convivencia laboral',
    'Análisis de documentos',
    'Aplicación de protocolos de convivencia laboral'
  ];

  return (
    <div className="mb-3 flex flex-wrap gap-2 justify-center">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all cursor-default"
        >
          {suggestion}
        </div>
      ))}
    </div>
  );
}

export default SuggestionCards;
