import iconLogin from '../../assets/iconchat.svg';
import iconSpinner from '../../assets/icon3.png';

function GeneratingCaseModal({ isOpen, progress = 0 }) {
  if (!isOpen) return null;

  const progressPercentage = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-50 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-slideUp">
        <div className="flex flex-col items-center gap-">
          {/* Imagen de carga */}
          <img src={iconLogin} alt="Generando caso..." className="w-52 h-52 object-contain" />
          <span className="text-s mt-4 font-bold tracking-wider text-gray-700 uppercase">
            Crea tu nuevo caso
          </span>
          {/* Barra de progreso estilo imagen */}
          <div className="w-full ">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Creando...
              </span>
              <span className="text-sm font-semibold text-gray-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="flex items-center gap-2 border border-stone-200 rounded-lg p-2">
              <div className="flex-1  bg-gray-200 rounded-md h-4 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r py-2 from-sky-400 to-sky-500 h-full rounded-md transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              {/* Icono de carga giratorio */}
              <img src={iconSpinner} alt="Cargando" className="w-5 h-5 object-contain animate-spin" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneratingCaseModal;