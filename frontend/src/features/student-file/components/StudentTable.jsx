import { useNavigate, useParams } from 'react-router-dom';

function StudentTable({ students, totalCount, isFiltered }) {
  const navigate = useNavigate();
  const { schoolSlug } = useParams();

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md border-2 border-gray-300 overflow-hidden backdrop-blur-sm relative">
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="min-w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-gray-50 via-gray-100/80 to-gray-50 border-b border-gray-200">

              {/* Nombre Completo */}
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/5">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Nombre Completo
                </div>
              </th>

              {/* RUT */}
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  RUT
                </div>
              </th>

              {/* Curso */}
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Área de trabajo
                </div>
              </th>

              {/* Email */}
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </div>
              </th>

            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {students.map((student) => (
              <tr
                key={student.id}
                onClick={() => {
                  const basePath = schoolSlug ? `/${schoolSlug}` : '';
                  navigate(`${basePath}/ficha-alumnos/${student.id}`);
                }}
                className="hover:bg-gray-50/80 transition-colors cursor-pointer"
              >
                {/* Nombre */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                    {student.nombres} {student.apellidos}
                  </div>
                </td>

                {/* RUT */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{student.rut}</div>
                </td>

                {/* Curso */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {student.curso || <span className="text-gray-400">-</span>}
                  </div>
                </td>

                {/* Email */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{student.email || 'N/A'}</div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con contador */}
      <div className="bg-gradient-to-r from-gray-50 via-gray-100/80 to-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          {isFiltered ? (
            <>
              Mostrando <span className="font-medium">{students.length}</span> de <span className="font-medium">{totalCount}</span> trabajador{totalCount !== 1 ? 'es' : ''}
            </>
          ) : (
            <>
              Total: <span className="font-medium">{students.length}</span> trabajador{students.length !== 1 ? 'es' : ''}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentTable;
