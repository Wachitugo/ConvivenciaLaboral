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
    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[#1A71B8]/20 text-[#34B6D8] border border-[#1A71B8]/40 whitespace-nowrap">
      {curso}
    </span>
  );
};

function StudentCards({ students }) {
  const navigate = useNavigate();
  const { schoolSlug } = useParams();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3">
        {students.map((student) => {
          return (
            <div
              key={student.id}
              onClick={() => {
                const basePath = schoolSlug ? `/${schoolSlug}` : '';
                navigate(`${basePath}/ficha-alumnos/${student.id}`);
              }}
              className="group bg-[#0A3866]/40 backdrop-blur-md border border-[#1A71B8]/30 px-3 py-2.5 rounded-2xl hover:bg-[#0A3866]/60 hover:border-[#34B6D8]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(26,113,184,0.3)] cursor-pointer flex items-center justify-between gap-2"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {/* Info Principal */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white group-hover:text-[#34B6D8] transition-colors truncate" title={`${student.nombres} ${student.apellidos}`}>
                  {student.nombres} {student.apellidos}
                </h3>

                {/* RUT y Curso en la misma fila */}
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {student.rut && (
                    <span className="text-[11px] text-white/50 font-mono">
                      {formatRut(student.rut)}
                    </span>
                  )}
                  {student.curso && <CourseBadge curso={student.curso} />}
                </div>
              </div>

              {/* Flecha */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <svg className="w-4 h-4 text-white/30 group-hover:text-[#34B6D8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
