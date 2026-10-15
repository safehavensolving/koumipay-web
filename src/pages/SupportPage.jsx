import {
  PublicLayout,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  SUPPORT_WHATSAPP_URL,
} from '../components/layout/PublicLayout';

const FAQ = [
  {
    q: 'Comment créer un compte Koumi Pay ?',
    a: "Téléchargez l'application Koumi Pay, choisissez « Créer un compte » puis saisissez votre numéro de téléphone et un mot de passe. Un code de vérification peut vous être envoyé par SMS. Complétez ensuite les informations de votre entreprise (nom, activité) pour accéder à votre tableau de bord.",
  },
  {
    q: 'Comment connecter une imprimante Bluetooth ?',
    a: "Allumez votre imprimante thermique (58 mm ou 80 mm) et activez le Bluetooth de votre téléphone. Dans l'application, ouvrez Paramètres › Imprimantes, lancez la recherche puis sélectionnez votre imprimante. Choisissez la largeur de papier correspondante et imprimez un ticket de test pour vérifier.",
  },
  {
    q: 'Comment imprimer ou partager un reçu ou une facture PDF ?',
    a: "Après une vente, le reçu peut s'imprimer automatiquement si l'impression automatique est activée dans Paramètres › Imprimantes. Depuis le détail d'une vente ou d'une facture, vous pouvez réimprimer le reçu, ouvrir l'aperçu de la facture A4 et la partager en PDF (WhatsApp, e-mail…).",
  },
  {
    q: 'Comment gérer mon stock et scanner les codes-barres ?',
    a: "Le module Stock liste vos produits, leurs quantités et les alertes de rupture ou de stock bas. L'action « Scanner produit » de l'accueil permet soit de faire une vente en scannant les articles, soit de réaliser un inventaire : scannez le produit, saisissez le stock réel et validez.",
  },
  {
    q: 'Comment publier mes produits dans la boutique KOUMI et suivre mes commandes ?',
    a: "Depuis l'onglet Boutique, ajoutez un produit (photos, catégorie, prix…) puis publiez-le : il devient visible des acheteurs sur KOUMI. Les commandes reçues apparaissent dans Commandes, où vous les confirmez et les marquez prêtes ; vous recevez une notification à chaque nouvelle commande.",
  },
  {
    q: 'Comment fonctionne le wallet et comment demander un retrait ?',
    a: "Le wallet regroupe l'argent encaissé par KOUMI pour vos ventes en ligne ; les ventes passées à votre caisse n'y transitent pas. Pour retirer, ouvrez Mon Wallet puis « Demander un retrait » : le montant demandé, les frais de retrait et le montant que vous recevrez sont affichés avant la validation.",
  },
  {
    q: 'Comment demander une livraison ?',
    a: "Depuis l'action « Livraison » de l'accueil, indiquez le point de départ, la destination et les informations du destinataire. Le prix est affiché avant la confirmation, et vous pouvez ensuite suivre la course dans l'application.",
  },
  {
    q: 'Comment supprimer mon compte ?',
    a: (
      <>
        Dans l'application, ouvrez Compte › Supprimer le compte et suivez les étapes de confirmation. Si vous ne
        pouvez plus accéder à l'application, contactez-nous par e-mail ou WhatsApp depuis le numéro associé à votre
        compte. Le sort de vos données est décrit dans notre{' '}
        <a href="/confidentialite/" className="text-emerald font-medium">
          politique de confidentialité
        </a>
        .
      </>
    ),
  },
];

function ContactRow({ icon, label, value, href, external }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 hover:border-emerald transition min-w-0"
    >
      <span className="text-xl" aria-hidden="true">
        {icon}
      </span>
      <span className="flex flex-col min-w-0">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-sm font-semibold text-navy break-all">{value}</span>
      </span>
    </a>
  );
}

export function SupportPage() {
  return (
    <PublicLayout title="Assistance Koumi Pay">
      <section>
        <p className="text-xs font-semibold tracking-widest uppercase text-emerald">Support</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">Assistance Koumi Pay</h1>
        <p className="text-muted mt-3 leading-relaxed">
          Une question sur l'application Koumi Pay — caisse, reçus, factures, stock, boutique KOUMI, livraison ou
          wallet ? Consultez les réponses ci-dessous ou contactez directement notre équipe.
        </p>
      </section>

      <section className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-bold">Nous contacter</h2>
        <p className="text-sm text-muted mt-1">
          Indiquez le numéro de téléphone de votre compte et décrivez votre problème.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <ContactRow icon="✉️" label="E-mail" value={SUPPORT_EMAIL} href={`mailto:${SUPPORT_EMAIL}`} />
          <ContactRow icon="📞" label="Téléphone" value={SUPPORT_PHONE_DISPLAY} href={`tel:${SUPPORT_PHONE_TEL}`} />
          <ContactRow
            icon="💬"
            label="WhatsApp"
            value={SUPPORT_PHONE_DISPLAY}
            href={SUPPORT_WHATSAPP_URL}
            external
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">Questions fréquentes</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group bg-white rounded-2xl border border-border px-5 py-4">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-sm sm:text-base">
                {item.q}
                <span className="text-muted transition group-open:rotate-90" aria-hidden="true">
                  ›
                </span>
              </summary>
              <p className="text-sm text-muted leading-relaxed mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
