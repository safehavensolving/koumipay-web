import { Link } from 'react-router-dom';

export function AuthLayout({ heroTitle, heroSubtitle, heroTag, children, backTo }) {
  return (
    <div className="min-h-screen bg-light-gray flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl grid sm:grid-cols-2 rounded-3xl overflow-hidden shadow-xl bg-white sm:min-h-[560px]">
        <div className="bg-navy text-white p-8 sm:p-12 flex flex-col justify-center">
          {backTo && (
            <Link to={backTo} className="text-white/70 text-sm mb-6 hover:text-white">
              ← Retour
            </Link>
          )}
          <p className="text-xs font-semibold tracking-widest uppercase text-white/80">
            {heroTag || 'Koumi Pay'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2 leading-snug">{heroTitle}</h1>
          {heroSubtitle && <p className="text-sm text-white/70 mt-3 leading-relaxed">{heroSubtitle}</p>}
        </div>
        <div className="p-8 sm:p-12 flex flex-col justify-center">{children}</div>
      </div>
    </div>
  );
}
