import {
  PublicLayout,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  SUPPORT_WHATSAPP_URL,
} from '../components/layout/PublicLayout';

function Section({ number, title, children }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
      <h2 className="text-lg font-bold">
        {number}. {title}
      </h2>
      <div className="text-sm text-muted leading-relaxed mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function List({ items }) {
  return (
    <ul className="list-disc pl-5 flex flex-col gap-2">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

const Strong = ({ children }) => <strong className="font-semibold text-navy">{children}</strong>;

export function PrivacyPage() {
  return (
    <PublicLayout title="Politique de confidentialité — Koumi Pay">
      <section>
        <p className="text-xs font-semibold tracking-widest uppercase text-emerald">Confidentialité</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">Politique de confidentialité — Koumi Pay</h1>
        <p className="text-sm text-muted mt-3">Dernière mise à jour : 14 octobre 2026</p>
      </section>

      <Section number={1} title="Qui sommes-nous">
        <p>
          Koumi Pay est une application de gestion destinée aux commerçants partenaires de KOUMI en Guinée : caisse,
          reçus et factures, stock, boutique en ligne KOUMI, livraison et wallet des ventes en ligne. Elle est éditée
          par <Strong>Safe Haven Solving</Strong>.
        </p>
        <p>
          Cette politique explique quelles données nous collectons lorsque vous utilisez l'application Koumi Pay et
          l'espace vendeur web, pourquoi, avec qui elles sont partagées et comment exercer vos droits.
        </p>
      </Section>

      <Section number={2} title="Données collectées">
        <List
          items={[
            <>
              <Strong>Identité et contact</Strong> : nom, numéro de téléphone, adresse e-mail (facultative), nom et
              adresse de l'entreprise.
            </>,
            <>
              <Strong>Localisation précise</Strong> de la boutique et des points de retrait / livraison, uniquement
              lorsque vous utilisez l'application et que vous l'autorisez — jamais en arrière-plan.
            </>,
            <>
              <Strong>Contenus publiés</Strong> : photos et vidéos de produits, de plats ou de biens, logo de
              l'entreprise.
            </>,
            <>
              <Strong>Données commerciales que vous saisissez</Strong> : produits, stock, ventes, factures, dépenses et
              clients du commerçant (noms et numéros saisis par le commerçant lui-même).
            </>,
            <>
              <Strong>Données financières</Strong> : historique des paiements, wallet des ventes en ligne, numéro de
              mobile money utilisé pour les retraits, achats de crédits SMS.
            </>,
            <>
              <Strong>Identifiants techniques</Strong> : identifiant de compte et jeton de notification push de
              l'appareil.
            </>,
          ]}
        />
        <p>
          Koumi Pay n'affiche <Strong>aucune publicité</Strong>, n'utilise <Strong>aucun traceur publicitaire</Strong>,
          ne <Strong>revend aucune donnée</Strong> et ne vous suit pas entre les applications ou les sites d'autres
          entreprises.
        </p>
      </Section>

      <Section number={3} title="Utilisation des données">
        <List
          items={[
            <>
              <Strong>Fonctionnement du service</Strong> : caisse, factures et reçus, impression, boutique en ligne
              KOUMI, livraison, notifications.
            </>,
            <>
              <Strong>Sécurité du compte</Strong> : vérification par code envoyé par SMS.
            </>,
            <>
              <Strong>Assistance</Strong> : répondre à vos demandes et résoudre les problèmes signalés.
            </>,
          ]}
        />
      </Section>

      <Section number={4} title="Partage des données">
        <p>Nous ne partageons que ce qui est nécessaire au service :</p>
        <List
          items={[
            <>
              <Strong>Acheteurs KOUMI</Strong> : ils voient les produits que vous publiez et les informations de votre
              boutique.
            </>,
            <>
              <Strong>Livreurs KOUMI</Strong> : ils reçoivent les adresses de retrait et de livraison des courses.
            </>,
            <>
              <Strong>Prestataires techniques</Strong> : hébergement, envoi de SMS, notifications push (Expo, Apple,
              Google), cartes (Google Maps), opérateurs de paiement mobile money.
            </>,
          ]}
        />
        <p>
          Vos données ne sont <Strong>jamais vendues</Strong>.
        </p>
      </Section>

      <Section number={5} title="Conservation et sécurité">
        <List
          items={[
            'Les échanges entre l’application et nos serveurs sont chiffrés (HTTPS).',
            'Le numéro de téléphone et l’adresse e-mail sont chiffrés sur nos serveurs.',
            'Les données sont conservées tant que votre compte est actif.',
            'Les documents comptables (factures) peuvent être conservés au-delà pour respecter nos obligations légales.',
          ]}
        />
      </Section>

      <Section number={6} title="Vos droits">
        <List
          items={[
            <>
              <Strong>Accès et rectification</Strong> : consultez et modifiez vos informations dans Compte › Mettre à
              jour le profil.
            </>,
            <>
              <Strong>Suppression</Strong> : supprimez votre compte depuis l'application (Compte › Supprimer le
              compte) ou demandez-le par e-mail à{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald font-medium break-all">
                {SUPPORT_EMAIL}
              </a>
              .
            </>,
          ]}
        />
        <p>
          Les autorisations de l'appareil sont demandées uniquement pour la fonction qui en a besoin et peuvent être
          retirées à tout moment dans les Réglages de votre appareil :
        </p>
        <List
          items={[
            <>
              <Strong>Appareil photo</Strong> : photographier vos produits et scanner les codes-barres, QR codes de
              commande et cartes de livreur.
            </>,
            <>
              <Strong>Photos</Strong> : choisir des images ou vidéos existantes pour vos produits, plats, biens ou
              votre logo.
            </>,
            <>
              <Strong>Position</Strong> : placer votre boutique sur la carte et indiquer les points de livraison,
              uniquement pendant l'utilisation de l'application.
            </>,
            <>
              <Strong>Bluetooth</Strong> : se connecter à vos imprimantes thermiques pour imprimer reçus et bons de
              cuisine.
            </>,
            <>
              <Strong>Notifications</Strong> : vous prévenir des nouvelles commandes, livraisons et autres
              événements de votre compte.
            </>,
          ]}
        />
      </Section>

      <Section number={7} title="Enfants">
        <p>
          Koumi Pay est un service destiné aux professionnels. Il ne s'adresse pas aux personnes de moins de 18 ans.
        </p>
      </Section>

      <Section number={8} title="Contact">
        <p>Pour toute question sur cette politique ou sur vos données, contactez Safe Haven Solving :</p>
        <List
          items={[
            <>
              E-mail :{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald font-medium break-all">
                {SUPPORT_EMAIL}
              </a>
            </>,
            <>
              Téléphone :{' '}
              <a href={`tel:${SUPPORT_PHONE_TEL}`} className="text-emerald font-medium">
                {SUPPORT_PHONE_DISPLAY}
              </a>{' '}
              (également sur{' '}
              <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-emerald font-medium">
                WhatsApp
              </a>
              )
            </>,
          ]}
        />
        <p>
          Voir aussi la page{' '}
          <a href="/assistance/" className="text-emerald font-medium">
            Assistance
          </a>
          .
        </p>
      </Section>
    </PublicLayout>
  );
}
