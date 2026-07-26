import { AppShell } from '../components/layout/AppShell';
import { AppCard } from '../components/ui';
import { PinProtectedScreen } from '../components/security/PinProtectedScreen';

function Content({ title }) {
  return (
    <AppCard className="p-10 text-center">
      <p className="text-lg font-semibold text-navy">{title}</p>
      <p className="text-sm text-muted mt-2">Ce module arrive bientôt sur koumipay-web.</p>
    </AppCard>
  );
}

export function ComingSoonPage({ title, moduleKey }) {
  return (
    <AppShell>
      {moduleKey ? (
        <PinProtectedScreen
          title={title}
          subtitle="Saisissez votre code PIN pour ouvrir cet écran sensible."
          moduleKey={moduleKey}
        >
          <Content title={title} />
        </PinProtectedScreen>
      ) : (
        <Content title={title} />
      )}
    </AppShell>
  );
}
