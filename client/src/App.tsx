import { Route, Switch, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Orders from "./pages/orders";
import Production from "./pages/production";
import ProductionOrdersManagement from "./pages/ProductionOrdersManagement";
import ProductionQueues from "./pages/ProductionQueues";
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
import ProtectedRoute from "./components/ProtectedRoute";
import ToolsPage from "./pages/tools_page";

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
<Route path="/tools">
  <ProtectedRoute path="/tools">
    <ToolsPage />
  </ProtectedRoute>
</Route>
     
      <Route path="/">
        <ProtectedRoute path="/">
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/orders">
        <ProtectedRoute path="/orders">
          <Orders />
        </ProtectedRoute>
      </Route>

      <Route path="/production">
        <ProtectedRoute path="/production">
          <Production />
        </ProtectedRoute>
      </Route>

      <Route path="/production-orders-management">
        <ProtectedRoute path="/production-orders-management">
          <ProductionOrdersManagement />
        </ProtectedRoute>
      </Route>

      <Route path="/production-queues">
        <ProtectedRoute path="/production-queues">
          <ProductionQueues />
        </ProtectedRoute>
      </Route>

      <Route path="/quality">
        <ProtectedRoute path="/quality">
          <Quality />
        </ProtectedRoute>
      </Route>

      <Route path="/warehouse">
        <ProtectedRoute path="/warehouse">
          <Warehouse />
        </ProtectedRoute>
      </Route>

      <Route path="/maintenance">
        <ProtectedRoute path="/maintenance">
          <Maintenance />
        </ProtectedRoute>
      </Route>

      <Route path="/hr">
        <ProtectedRoute path="/hr">
          <HR />
        </ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute path="/reports">
          <Reports />
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute path="/settings">
          <Settings />
        </ProtectedRoute>
      </Route>

      <Route path="/definitions">
        <ProtectedRoute path="/definitions">
          <Definitions />
        </ProtectedRoute>
      </Route>

      <Route path="/user-dashboard">
        <ProtectedRoute path="/user-dashboard">
          <UserDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/notifications">
        <ProtectedRoute path="/notifications">
          <Notifications />
        </ProtectedRoute>
      </Route>

      <Route path="/alerts">
        <ProtectedRoute path="/alerts">
          <AlertsCenter />
        </ProtectedRoute>
      </Route>

      <Route path="/system-health">
        <ProtectedRoute path="/system-health">
          <SystemHealth />
        </ProtectedRoute>
      </Route>

      <Route path="/ml-analytics">
        <ProtectedRoute path="/ml-analytics">
          <MLAnalytics />
        </ProtectedRoute>
      </Route>

      <Route path="/production-monitoring">
        <ProtectedRoute path="/production-monitoring">
          <ProductionMonitoring />
        </ProtectedRoute>
      </Route>

      <Route path="/meta-whatsapp-setup">
        <ProtectedRoute path="/meta-whatsapp-setup">
          <MetaWhatsAppSetup />
        </ProtectedRoute>
      </Route>

      <Route path="/whatsapp-setup">
        <ProtectedRoute path="/whatsapp-setup">
          <WhatsAppSetup />
        </ProtectedRoute>
      </Route>

      <Route path="/whatsapp-test">
        <ProtectedRoute path="/whatsapp-test">
          <WhatsAppTest />
        </ProtectedRoute>
      </Route>

      <Route path="/whatsapp-troubleshoot">
        <ProtectedRoute path="/whatsapp-troubleshoot">
          <WhatsAppTroubleshoot />
        </ProtectedRoute>
      </Route>

      <Route path="/whatsapp-production-setup">
        <ProtectedRoute path="/whatsapp-production-setup">
          <WhatsAppProductionSetup />
        </ProtectedRoute>
      </Route>

      <Route path="/whatsapp-final-setup">
        <ProtectedRoute path="/whatsapp-final-setup">
          <WhatsAppFinalSetup />
        </ProtectedRoute>
      </Route>

      <Route path="/twilio-content">
        <ProtectedRoute path="/twilio-content">
          <TwilioContentTemplate />
        </ProtectedRoute>
      </Route>

      <Route path="/whatsapp-template-test">
        <ProtectedRoute path="/whatsapp-template-test">
          <WhatsAppTemplateTest />
        </ProtectedRoute>
      </Route>

      <Route path="/whatsapp-webhooks">
        <ProtectedRoute path="/whatsapp-webhooks">
          <WhatsAppWebhooks />
        </ProtectedRoute>
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
