export default function CasesByType({ data }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-3">
      <h2 className="text-base font-semibold text-gray-800 mb-3">Casos por Protocolo</h2>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-600 font-medium tracking-wide">{item.type}</span>
              <span className="text-xs font-semibold text-gray-700 tabular-nums">{item.count}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-sm h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-sm transition-all duration-500 ease-out"
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
