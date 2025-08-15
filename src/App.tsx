import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AdAccountProvider } from "./components/providers/AdAccountProvider";
import { AuthProvider } from './components/auth/AuthProvider';
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import AdminSecurityPage from "./components/admin/AdminSecurityPage";
import { ReportsView } from "./components/reports/ReportsView";
import { ReportDetailsPage } from "./pages/ReportDetailsPage"; // 1. IMPORT THE NEW PAGE

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AdAccountProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'crm_manager']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/security"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminSecurityPage />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'crm_manager']}>
                    <ReportsView />
                  </ProtectedRoute>
                }
              />

              {/* --- 2. ADD THIS NEW ROUTE FOR A SINGLE REPORT --- */}
              <Route
                path="/reports/:reportId"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'crm_manager']}>
                    <ReportDetailsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AdAccountProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
