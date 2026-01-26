import { Link, useLocation } from 'react-router-dom';

function Breadcrumb({ caseName = null }) {
  const location = useLocation();

  // Mapeo de rutas a nombres legibles
  const routeNames = {
    'dashboard': 'Reportes',
    'mis-casos': 'Mis Casos',
    'ficha-alumnos': 'Ficha Alumnos',
    'chat': 'Chat',
    'calendario': 'Calendario',
    'reportes': 'Reportes',
    'configuracion': 'Configuración',
    'ayuda': 'Ayuda'
  };

  // Generar breadcrumbs desde la ruta actual
  const generateBreadcrumbs = () => {
    // filter out empty strings
    let paths = location.pathname.split('/').filter(path => path);

    // If the first path segment is the school slug (we can verify if it's not in routeNames roughly),
    // we want to skip showing it in the breadcrumb effectively.
    // However, simply removing it might break relative path generation if we rebuild paths.
    // Better to just not include it in the `breadcrumbs` array but keep `currentPath` correct.

    // Naive check: if we have a schoolSlug in params (we need `useParams`), compare.
    // Let's import useParams.

    // Actually, simpler logic:
    // With tenants, the URL is /:schoolSlug/route...
    // The user sees "Colegio-demo > Ficha Alumnos" which means the slug is being treated as a breadcrumb item.
    // We ideally want to show the School Name instead of Slug, OR just hide it if it's the root context.
    // Given the user said "sale colegio demo pero no deberia salir" (it shows colegio demo but shouldn't),
    // I will hide the first element if it serves as the tenant root.

    // Let's assume the first segment is ALWAYS the tenant slug in this new architecture.
    // We can just skip the first element when mapping to breadcrumbs, BUT we must accumulate the path.

    const breadcrumbs = [];
    let currentPath = '';

    paths.forEach((path, index) => {
      currentPath += `/${path}`;

      // Skip the first segment (school slug) from appearing in the visual breadcrumb
      // This satisfies "no deberia salir".
      if (index === 0) return;

      // Si tenemos un caseName y es el último elemento, usarlo
      if (caseName && index === paths.length - 1) {
        breadcrumbs.push({
          name: caseName,
          path: currentPath,
          icon: false,
          isLast: true
        });
        return;
      }

      // Si es un ID numérico (para otros casos)
      if (!isNaN(path) || path.length > 20) { // simple heuristic for UUIDs too
        return;
      }

      const name = routeNames[path] || path.charAt(0).toUpperCase() + path.slice(1);
      breadcrumbs.push({
        name,
        path: currentPath,
        icon: breadcrumbs.length === 0, // Icon for the *visible* first element
        isLast: index === paths.length - 1 && !caseName
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="flex items-center gap-1 min-w-0 flex-1" aria-label="Breadcrumb">
      {breadcrumbs.map((crumb, index) => (
        <div key={`${crumb.path}-${index}`} className="flex items-center gap-2 min-w-0">
          {index > 0 && (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}

          {crumb.isLast ? (
            // Último elemento (actual) - no es link
            <div className="flex items-center gap-2 text-gray-700 min-w-0 max-w-[400px]" title={crumb.name}>
              {crumb.icon && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              )}
              <span className="text-sm font-medium text-gray-700 truncate">
                {crumb.name}
              </span>
            </div>
          ) : (
            // Elementos anteriores - son links
            <Link
              to={crumb.path}
              className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors group"
            >
              {crumb.icon && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              )}
              <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
                {crumb.name}
              </span>
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

export default Breadcrumb;
