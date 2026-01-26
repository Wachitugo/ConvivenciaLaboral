import { useNavigate, useParams } from 'react-router-dom';

// Función para formatear RUT
const formatRut = (rut) => {
  if (!rut) return '';
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
  if (cleanRut.length < 2) return rut;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
};

// Badge de Curso
const CourseBadge = ({ curso }) => {
  if (!curso) return null;
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
      {curso}
    </span>
  );
};

function StudentCards({ students }) {
  const navigate = useNavigate();
  const { schoolSlug } = useParams();

  return (
    <div className="flex-1 overflow-auto custom-scrollbar bg-white rounded-lg">
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-4 gap-2">
        {students.map((student) => {
          const hasPrograms = student.es_pie || student.es_tea || student.es_paec;

          return (
            <div
              key={student.id}
              onClick={() => {
                const basePath = schoolSlug ? `/${schoolSlug}` : '';
                navigate(`${basePath}/ficha-alumnos/${student.id}`);
              }}
              className="group bg-white rounded-lg  border-2 border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-all duration-200 hover:shadow-md cursor-pointer px-3 py-2.5 flex items-center justify-between gap-2"
            >
              {/* Info Principal */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors truncate" title={`${student.nombres} ${student.apellidos}`}>
                  {student.nombres} {student.apellidos}
                </h3>

                {/* RUT y Curso en la misma fila */}
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {student.rut && (
                    <span className="text-[11px] text-gray-400 font-mono">
                      {formatRut(student.rut)}
                    </span>
                  )}
                  {student.curso && <CourseBadge curso={student.curso} />}
                </div>
              </div>

              {/* Indicadores y flecha */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {hasPrograms && (
                  <div className="flex -space-x-1">
                    {student.es_pie && <div className="w-2 h-2 rounded-full bg-blue-400 ring-1 ring-white" title="PIE"></div>}
                    {student.es_tea && <div className="w-2 h-2 rounded-full bg-purple-400 ring-1 ring-white" title="TEA"></div>}
                    {student.es_paec && <div className="w-2 h-2 rounded-full bg-amber-400 ring-1 ring-white" title="PAEC"></div>}
                  </div>
                )}
                <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StudentCards;
