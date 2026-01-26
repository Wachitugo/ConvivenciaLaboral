function InterviewTableSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md border-2 border-gray-300 overflow-hidden">
      <div className="overflow-auto flex-1">
        <table className="min-w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-gray-50 via-gray-100/80 to-gray-50 border-b border-gray-200">
              {/* Checkbox */}
              <th scope="col" className="px-3 py-4 w-10">
                <div className="w-4 h-4 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
              </th>
              {/* Estudiante */}
              <th scope="col" className="px-6 py-4 text-left w-1/4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                  <div className="h-3 w-20 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </div>
              </th>
              {/* Género */}
              <th scope="col" className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                  <div className="h-3 w-16 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </div>
              </th>
              {/* Curso */}
              <th scope="col" className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                  <div className="h-3 w-12 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </div>
              </th>
              {/* Fecha */}
              <th scope="col" className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                  <div className="h-3 w-12 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </div>
              </th>
              {/* Entrevistador */}
              <th scope="col" className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                  <div className="h-3 w-24 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </div>
              </th>
              {/* Estado */}
              <th scope="col" className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                  <div className="h-3 w-14 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </div>
              </th>
              {/* Acciones */}
              <th scope="col" className="relative px-6 py-4">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <tr key={item} className="hover:bg-gray-50 transition-colors">
                {/* Checkbox */}
                <td className="px-3 py-4">
                  <div className="w-4 h-4 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </td>
                {/* Estudiante */}
                <td className="px-6 py-4">
                  <div className="h-4 w-36 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </td>
                {/* Género */}
                <td className="px-6 py-4">
                  <div className="h-4 w-20 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </td>
                {/* Curso */}
                <td className="px-6 py-4">
                  <div className="h-4 w-16 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </td>
                {/* Fecha */}
                <td className="px-6 py-4">
                  <div className="h-4 w-24 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </td>
                {/* Entrevistador */}
                <td className="px-6 py-4">
                  <div className="h-4 w-28 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </td>
                {/* Estado */}
                <td className="px-6 py-4">
                  <div className="h-6 w-20 bg-gray-200 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </td>
                {/* Acciones */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InterviewTableSkeleton;
