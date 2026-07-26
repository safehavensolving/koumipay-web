import { AuthLayout } from '../../components/auth/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';

export function SellerSetupPage() {
  const { logout } = useAuth();

  return (
    <AuthLayout heroTag="Boutique" heroTitle="Création de boutique" heroSubtitle="Cette étape arrive bientôt sur le web.">
      <p className="text-sm text-navy">
        La création de boutique détaillée n'est pas encore disponible sur koumipay-web. Utilisez l'application
        mobile Koumi Pay pour terminer cette étape, puis reconnectez-vous ici.
      </p>
      <button type="button" onClick={logout} className="text-sm text-emerald font-medium mt-4 cursor-pointer">
        Se déconnecter
      </button>
    </AuthLayout>
  );
}
