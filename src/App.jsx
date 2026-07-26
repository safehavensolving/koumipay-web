import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth, RequireToken, RedirectIfAuthed } from './routes/RequireAuth';
import { ScrollToTop } from './routes/ScrollToTop';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OtpVerifyPage } from './pages/auth/OtpVerifyPage';
import { SetPasswordPage } from './pages/auth/SetPasswordPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { SellerSetupPage } from './pages/auth/SellerSetupPage';
import { PartnerOnboardingPage } from './pages/auth/PartnerOnboardingPage';
import { HomePage } from './pages/HomePage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { AccountPage } from './pages/AccountPage';
import { DeleteAccountPage } from './pages/DeleteAccountPage';
import { GeolocationPage } from './pages/GeolocationPage';
import { SecurityPage } from './pages/SecurityPage';

const SOON_ROUTES = [
  { path: '/boutique', title: 'Boutique' },
  { path: '/wallet', title: 'Portefeuille' },
  { path: '/finance', title: 'Finance', moduleKey: 'finance' },
  { path: '/expenses', title: 'Dépenses', moduleKey: 'expenses' },
  { path: '/stock', title: 'Stock', moduleKey: 'stock' },
  { path: '/customers', title: 'Clients' },
  { path: '/beneficiaries', title: 'Bénéficiaires' },
  { path: '/historique', title: 'Historique des ventes' },
  { path: '/facturation', title: 'Facturation' },
  { path: '/planning', title: 'Planning' },
  { path: '/account/documents', title: 'Personnaliser les documents' },
  { path: '/venterapide', title: 'Nouvelle vente' },
];

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfAuthed>
                <RegisterPage />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <RedirectIfAuthed>
                <ForgotPasswordPage />
              </RedirectIfAuthed>
            }
          />
          <Route path="/otp" element={<OtpVerifyPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />

          <Route element={<RequireToken />}>
            <Route path="/seller-setup" element={<SellerSetupPage />} />
            <Route path="/onboarding/partner" element={<PartnerOnboardingPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/delete" element={<DeleteAccountPage />} />
            <Route path="/account/geolocation" element={<GeolocationPage />} />
            <Route path="/account/security" element={<SecurityPage />} />
            {SOON_ROUTES.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<ComingSoonPage title={route.title} moduleKey={route.moduleKey} />}
              />
            ))}
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
