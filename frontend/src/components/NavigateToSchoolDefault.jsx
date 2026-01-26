import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function NavigateToSchoolDefault({ dest = 'dashboard' }) {
    const navigate = useNavigate();

    useEffect(() => {
        try {
            const storedColegios = localStorage.getItem('colegios');
            if (storedColegios) {
                const colegios = JSON.parse(storedColegios);
                if (colegios && colegios.length > 0) {
                    // Find valid slug, prioritize first one
                    // Note: Since we just added slugs on backend, user might need to relogin to get them in localStorage
                    // Or we fetch them. 
                    // If the user hasn't relogged in, colegios[0].slug might be undefined.
                    // If so, we might need a fallback or force reload user profile.

                    const slug = colegios[0].slug;

                    if (slug) {
                        navigate(`/${slug}/${dest}`, { replace: true });
                        return;
                    }
                }
            }
            // If no info or no slug, stay here or redirect to login?
            // Maybe we can try to fetch profile if missing?
            // For now, let's assume relogin happens or we handle it gracefully.
            console.warn("No school slug found for redirect.");
        } catch (e) {
            console.error("Error in NavigateToSchoolDefault", e);
        }
    }, [navigate, dest]);

    return <div className="flex items-center justify-center h-screen">Redirigiendo...</div>;
}

export default NavigateToSchoolDefault;
