import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AdAccountProvider } from "./components/providers/AdAccountProvider";

// --- 1. Import the new components ---
import { ReportsView } from "./components/reports/ReportsView";
import { ReportDetailsPage } from "./pages/ReportDetailsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdAccountProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* --- 2. Add the new routes here --- */}
            
            {/* This route is for the list of all reports */}
            <Route path="/reports" element={<ReportsView />} />

            {/* This route is for the details of a single report */}
            <Route path="/reports/:reportId" element={<ReportDetailsPage />} />

            {/* All other custom routes should go above this catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AdAccountProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;