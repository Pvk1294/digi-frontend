import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AdAccountProvider } from "./components/providers/AdAccountProvider";
import { AuthProvider } from './components/auth/AuthProvider';

// --- 1. Import your components ---
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage"; // Assuming you have a main dashboard page
import AdminSecurityPage from "./components/admin/AdminSecurityPage"; // The new security page

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
              {/* Public route for login */}
              <Route path="/" element={<Index />} />

              {/* --- 2. Create a Protected Route for the Dashboard --- */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'crm_manager']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* --- 3. Create a Protected Route for the Admin Security Page --- */}
              <Route
                path="/admin/security"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminSecurityPage />
                  </ProtectedRoute>
                }
              />

              {/* You can keep other specific routes if needed */}
              {/* <Route path="/reports" element={<ReportsView />} /> */}
              {/* <Route path="/reports/:reportId" element={<ReportDetailsPage />} /> */}

              {/* Catch-all route for 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AdAccountProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;