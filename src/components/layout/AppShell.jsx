import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_ITEMS = [
  { key: 'home', label: 'Accueil', icon: '▦', to: '/' },
  { key: 'wallet', label: 'Wallet', icon: '👛', to: '/wallet' },
  { key: 'finance', label: 'Finance', icon: '📈', to: '/finance' },
  { key: 'expenses', label: 'Dépenses', icon: '💸', to: '/expenses' },
  { key: 'stock', label: 'Stock', icon: '📦', to: '/stock' },
  { key: 'clients', label: 'Clients', icon: '👥', to: '/customers' },
  { key: 'beneficiaries', label: 'Bénéficiaires', icon: '🤝', to: '/beneficiaries' },
  { key: 'historique', label: 'Ventes', icon: '🧾', to: '/historique' },
  { key: 'facturation', label: 'Facturation', icon: '📄', to: '/facturation' },
  { key: 'planning', label: 'Planning', icon: '🗓️', to: '/planning' },
  { key: 'settings', label: 'Paramètres', icon: '⚙️', to: '/account' },
];

function buildDisplayName(user, sellerProfile) {
  const businessName = sellerProfile?.business_name?.trim();
  if (businessName) return businessName;
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  return user?.phone || 'Compte vendeur';
}

function buildContactLine(user, sellerProfile) {
  return user?.email || sellerProfile?.phone || user?.phone || 'Profil Koumi Pay';
}

function buildInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return 'KP';
  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

function SidebarContent({ user, sellerProfile, logout, onNavigate }) {
  const location = useLocation();
  const displayName = useMemo(() => buildDisplayName(user, sellerProfile), [user, sellerProfile]);
  const contactLine = useMemo(() => buildContactLine(user, sellerProfile), [user, sellerProfile]);
  const initials = useMemo(() => buildInitials(displayName), [displayName]);

  return (
    <>
      <div className="flex flex-col items-center text-center px-4 pt-6 pb-5 -mx-5 -mt-5 mb-2 bg-gradient-to-b from-[#10223A] to-navy rounded-t-2xl">
        <div className="size-16 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold">
          {initials}
        </div>
        <p className="text-base font-bold mt-3">{displayName}</p>
        <p className="text-xs text-white/60 mt-1">{contactLine}</p>
        <div className="flex items-center gap-1.5 mt-3 bg-white/10 rounded-full px-3 py-1">
          <span className="size-1.5 rounded-full bg-success-bright" />
          <span className="text-xs font-medium">Connecté</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {DRAWER_ITEMS.map((item) => {
          const active = location.pathname === item.to;
          return (
            <NavLink
              key={item.key}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active ? 'bg-white/10 text-emerald' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              <span className="text-white/30">›</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 pt-3 mt-3">
        <a
          href="/assistance/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          <span>🛟</span>
          Assistance
        </a>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-danger hover:bg-white/5 w-full cursor-pointer"
        >
          <span>↪️</span>
          Déconnexion
        </button>
      </div>
    </>
  );
}

export function AppShell({ children }) {
  const { user, sellerProfile, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-light-gray flex">
      <aside className="w-64 bg-navy text-white flex-shrink-0 hidden md:flex flex-col p-5">
        <SidebarContent user={user} sellerProfile={sellerProfile} logout={logout} />
      </aside>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 max-w-[80vw] bg-navy text-white flex flex-col p-5 h-full shadow-xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute top-3 right-3 z-10 text-white/70 hover:text-white text-xl cursor-pointer"
              aria-label="Fermer le menu"
            >
              ✕
            </button>
            <SidebarContent
              user={user}
              sellerProfile={sellerProfile}
              logout={logout}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-navy text-white">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="text-xl cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>
          <p className="text-base font-bold">Koumi Pay</p>
        </header>
        <main className="flex-1 min-w-0 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
