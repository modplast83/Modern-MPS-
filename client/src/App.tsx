import { Route, Switch, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Orders from "./pages/orders";
import Production from "./pages/production";
import Quality from "./pages/quality";
import Warehouse from "./pages/warehouse";
import Maintenance from "./pages/maintenance";
import HR from "./pages/hr";
import Reports from "./pages/reports";
import Settings from "./pages/settings";
import Definitions from "./pages/definitions";
import UserDashboard from "./pages/user-dashboard";
import NotFound from "./pages/not-found";
import Notifications from "./pages/notifications";
import AlertsCenter from "./pages/AlertsCenter";
import SystemHealth from "./pages/SystemHealth";
import MLAnalytics from "./pages/ml-analytics";
import ProductionMonitoring from "./pages/production-monitoring";
import MetaWhatsAppSetup from "./pages/meta-whatsapp-setup";
import WhatsAppSetup from "./pages/whatsapp-setup";
import WhatsAppTest from "./pages/whatsapp-test";
import WhatsAppTroubleshoot from "./pages/whatsapp-troubleshoot";
import WhatsAppProductionSetup from "./pages/whatsapp-production-setup";
import WhatsAppFinalSetup from "./pages/whatsapp-final-setup";
import TwilioContentTemplate from "./pages/twilio-content-template";
import WhatsAppTemplateTest from "./pages/whatsapp-template-test";
import WhatsAppWebhooks from "./pages/whatsapp-webhooks";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>

      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>

      <Route path="/orders">
        <ProtectedRoute component={Orders} />
      </Route>

      <Route path="/production">
        <ProtectedRoute component={Production} />
      </Route>

      <Route path="/quality">
        <ProtectedRoute component={Quality} />
      </Route>

      <Route path="/warehouse">
        <ProtectedRoute component={Warehouse} />
      </Route>

      <Route path="/maintenance">
        <ProtectedRoute component={Maintenance} />
      </Route>

      <Route path="/hr">
        <ProtectedRoute component={HR} />
      </Route>

      <Route path="/reports">
        <ProtectedRoute component={Reports} />
      </Route>

      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>

      <Route path="/definitions">
        <ProtectedRoute component={Definitions} />
      </Route>

      <Route path="/user-dashboard">
        <ProtectedRoute component={UserDashboard} />
      </Route>

      <Route path="/notifications">
        <ProtectedRoute component={Notifications} />
      </Route>

      <Route path="/alerts">
        <ProtectedRoute component={AlertsCenter} />
      </Route>

      <Route path="/system-health">
        <ProtectedRoute component={SystemHealth} />
      </Route>

      <Route path="/ml-analytics">
        <ProtectedRoute component={MLAnalytics} />
      </Route>

      <Route path="/production-monitoring">
        <ProtectedRoute component={ProductionMonitoring} />
      </Route>

      <Route path="/meta-whatsapp-setup">
        <ProtectedRoute component={MetaWhatsAppSetup} />
      </Route>

      <Route path="/whatsapp-setup">
        <ProtectedRoute component={WhatsAppSetup} />
      </Route>

      <Route path="/whatsapp-test">
        <ProtectedRoute component={WhatsAppTest} />
      </Route>

      <Route path="/whatsapp-troubleshoot">
        <ProtectedRoute component={WhatsAppTroubleshoot} />
      </Route>

      <Route path="/whatsapp-production-setup">
        <ProtectedRoute component={WhatsAppProductionSetup} />
      </Route>

      <Route path="/whatsapp-final-setup">
        <ProtectedRoute component={WhatsAppFinalSetup} />
      </Route>

      <Route path="/twilio-content">
        <ProtectedRoute component={TwilioContentTemplate} />
      </Route>

      <Route path="/whatsapp-template-test">
        <ProtectedRoute component={WhatsAppTemplateTest} />
      </Route>

      <Route path="/whatsapp-webhooks">
        <ProtectedRoute component={WhatsAppWebhooks} />
      </Route>

      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
