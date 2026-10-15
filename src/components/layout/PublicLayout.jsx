import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const SUPPORT_EMAIL = 'gerometounkara@safehavensolving.com';
export const SUPPORT_PHONE_DISPLAY = '+224 620 75 57 65';
export const SUPPORT_PHONE_TEL = '+224620755765';
export const SUPPORT_WHATSAPP_URL = 'https://wa.me/224620755765';

/** Mise en page des pages publiques (assistance, confidentialité) — accessibles sans connexion. */
export function PublicLayout({ title, children }) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  return (
    <div className="min-h-screen bg-light-gray flex flex-col">
      <header className="bg-navy text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 font-bold">
            <img src="/logo.png" alt="" className="size-8 rounded-lg" />
            Koumi Pay
          </a>
          <Link to="/login" className="text-sm text-white/70 hover:text-white">
            Espace vendeur
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-8">
        {children}
      </main>

      <footer className="border-t border-border bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted">
          <p>© {new Date().getFullYear()} Koumi Pay</p>
          <nav className="flex flex-wrap gap-4">
            <a href="/assistance/" className="hover:text-navy">
              Assistance
            </a>
            <a href="/confidentialite/" className="hover:text-navy">
              Confidentialité
            </a>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-navy">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
