import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** React Router ne réinitialise pas le scroll entre les pages (contrairement à une navigation classique) — on le force ici. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
