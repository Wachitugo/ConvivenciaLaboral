function SidebarSkeleton({ isOpen }) {
  return (
    <aside
      className={`transition-all ${isOpen ? 'duration-300' : 'duration-500'} ease-in-out flex flex-col 
        ${isOpen ? 'w-64' : 'w-16'} 
        hidden lg:flex
        overflow-hidden`}
    >
      {/* Header Skeleton */}
      <div className="px-3">
        <div className={`flex items-center ${!isOpen ? 'justify-center' : 'gap-3'} pt-6`}>
          {isOpen ? (
            <>
              <div className="h-10 w-10 bg-gray-200 rounded-lg flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-3 w-24 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
                <div className="h-3 w-20 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-8 w-8 bg-gray-200 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Skeleton */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
        {/* Botón 1 - Dashboard */}
        <div
          className={`w-full px-2 py-2.5 rounded-lg flex items-center mb-1 ${!isOpen ? 'justify-center' : 'gap-3'}`}
        >
          <div className="w-5 h-5 bg-gray-200 rounded flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          </div>
          {isOpen && (
            <div className="h-4 w-20 bg-gray-200 rounded relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>
          )}
        </div>

        {/* Botón 2 - Nueva Consulta */}
        <div
          className={`w-full px-2 py-2.5 rounded-lg flex items-center mb-1 ${!isOpen ? 'justify-center' : 'gap-3'}`}
        >
          <div className="w-5 h-5 bg-gray-200 rounded flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          </div>
          {isOpen && (
            <div className="h-4 w-28 bg-gray-200 rounded relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>
          )}
        </div>

        {/* Botón 3 - Mis Casos */}
        <div
          className={`w-full px-2 py-2.5 rounded-lg flex items-center ${!isOpen ? 'justify-center' : 'gap-3'}`}
        >
          <div className="w-5 h-5 bg-gray-200 rounded flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          </div>
          {isOpen && (
            <div className="h-4 w-20 bg-gray-200 rounded relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="my-4 h-px bg-gray-200"></div>

        {/* Sección Recientes - solo cuando está abierto */}
        {isOpen && (
          <div className="transition-opacity duration-200">
            <div className="px-2 mb-3">
              <div className="h-3 w-16 bg-gray-200 rounded relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              </div>
            </div>

            {/* Lista de conversaciones skeleton - barras apiladas */}
            <div className="space-y-2">
              {/* Barra 1 - larga */}
              <div className="w-full px-2 py-1.5">
                <div className="h-4 w-full bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
              </div>

              {/* Barra 2 - media */}
              <div className="w-full px-2 py-1.5">
                <div className="h-4 w-4/5 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
              </div>

              {/* Barra 3 - corta */}
              <div className="w-full px-2 py-1.5">
                <div className="h-4 w-3/5 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
              </div>

              {/* Barra 4 - larga */}
              <div className="w-full px-2 py-1.5">
                <div className="h-4 w-full bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
              </div>

              {/* Barra 5 - media-corta */}
              <div className="w-full px-2 py-1.5">
                <div className="h-4 w-2/3 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Footer Skeleton */}
      <div className="p-3 bg-gray-50/50">
        {isOpen ? (
          <>
            {/* Perfil completo skeleton */}
            <div className="mb-3 flex items-center gap-3 p-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
                <div className="h-2 w-16 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
              </div>
            </div>

            {/* Información del Colegio skeleton */}
            <div className="px-3 py-3 rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start gap-2.5">

                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                  <div className="h-2 w-28 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                  <div className="h-2 w-20 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Avatar skeleton cuando está cerrado */
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default SidebarSkeleton;
