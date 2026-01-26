function CaseRow({ student: caseItem, onSelect, onEdit, onShare, getStatusColor, getStatusText }) {
  // Configuración de colores y labels para cada estado
  const getStatusConfig = (status) => {
    const configs = {
      'pendiente': {
        label: 'Pendiente',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        dotColor: 'bg-yellow-500'
      },
      'abierto': {
        label: 'Abierto',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        dotColor: 'bg-blue-500'
      },
      'resuelto': {
        label: 'Resuelto',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        dotColor: 'bg-green-500'
      },
      'no_resuelto': {
        label: 'No Resuelto',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        dotColor: 'bg-red-500'
      }
    };
    return configs[status] || configs['pendiente'];
  };

  const statusConfig = getStatusConfig(caseItem.status);

  return (
    <tr className="hover:bg-gray-50/50 transition-colors duration-150 group">
      <td onClick={() => onSelect(caseItem)} className="px-6 py-3 whitespace-nowrap cursor-pointer">
        <div className="flex items-center">
          <div>
            {caseItem.counterCase && (
              <div className="text-xs text-gray-500 font-mono mb-0.5">{caseItem.counterCase}</div>
            )}
            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">{caseItem.title}</div>
          </div>
        </div>
      </td>

      <td onClick={() => onSelect(caseItem)} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 cursor-pointer">
        {caseItem.lastUpdate}
      </td>

      <td onClick={() => onSelect(caseItem)} className="px-6 py-3 whitespace-nowrap cursor-pointer">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
          <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
          {statusConfig.label}
        </span>
      </td>

      <td onClick={() => onSelect(caseItem)} className="px-6 py-3 whitespace-nowrap cursor-pointer">
        {caseItem.isSharedByMe ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Compartido por ti
          </span>
        ) : caseItem.isSharedWithMe ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
            title={`Compartido por ${caseItem.ownerName || 'otro usuario'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Compartido contigo
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
            No compartido
          </span>
        )}
      </td>

      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(caseItem);
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Compartir caso"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(caseItem);
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Editar caso"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default CaseRow;