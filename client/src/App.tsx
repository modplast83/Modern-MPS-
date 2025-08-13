import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Dashboard from "@/pages/dashboard";
import UserDashboard from "@/pages/user-dashboard";
import Production from "@/pages/production";
import Quality from "@/pages/quality";
import Maintenance from "@/pages/maintenance";
import HR from "@/pages/hr";
import Warehouse from "@/pages/warehouse";
import Definitions from "@/pages/definitions";
import Settings from "@/pages/settings";
import Reports from "@/pages/reports";
import MLAnalytics from "@/pages/ml-analytics";
import ERPIntegration from "@/pages/erp-integration";
import Orders from "@/pages/orders";
import Notifications from "@/pages/notifications";
import WhatsAppSetup from "@/pages/whatsapp-setup";
import WhatsAppConfig from "@/pages/whatsapp-config";
import WhatsAppTest from "@/pages/whatsapp-test";
import WhatsAppTroubleshoot from "@/pages/whatsapp-troubleshoot";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/production">
        <ProtectedRoute>
          <Production />
        </ProtectedRoute>
      </Route>
      <Route path="/quality">
        <ProtectedRoute>
          <Quality />
        </ProtectedRoute>
      </Route>
      <Route path="/maintenance">
        <ProtectedRoute>
          <Maintenance />
        </ProtectedRoute>
      </Route>
      <Route path="/hr">
        <ProtectedRoute>
          <HR />
        </ProtectedRoute>
      </Route>
      <Route path="/warehouse">
        <ProtectedRoute>
          <Warehouse />
        </ProtectedRoute>
      </Route>
      <Route path="/definitions">
        <ProtectedRoute>
          <Definitions />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/ml-analytics">
        <ProtectedRoute>
          <MLAnalytics />
        </ProtectedRoute>
      </Route>
      <Route path="/erp-integration">
        <ProtectedRoute>
          <ERPIntegration />
        </ProtectedRoute>
      </Route>
      <Route path="/orders">
        <ProtectedRoute>
          <Orders />
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      </Route>
      <Route path="/whatsapp-setup">
        <ProtectedRoute>
          <WhatsAppSetup />
        </ProtectedRoute>
      </Route>
      <Route path="/whatsapp-config">
        <ProtectedRoute>
          <WhatsAppConfig />
        </ProtectedRoute>
      </Route>
      <Route path="/whatsapp-test">
        <ProtectedRoute>
          <WhatsAppTest />
        </ProtectedRoute>
      </Route>
      <Route path="/whatsapp-troubleshoot">
        <ProtectedRoute>
          <WhatsAppTroubleshoot />
        </ProtectedRoute>
      </Route>
      <Route path="/user-dashboard">
        <ProtectedRoute>
          <UserDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
