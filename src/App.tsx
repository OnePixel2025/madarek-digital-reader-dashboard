
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoutes } from "./components/ProtectedRoutes";
import { Dashboard } from "./pages/Dashboard";
import { ReadBook } from "./pages/ReadBook";
import { Library } from "./pages/Library";
import { Collections } from "./pages/Collections";
import { Podcasts } from "./pages/Podcasts";
import { Uploads } from "./pages/Uploads";
import { AIChat } from "./pages/AIChat";
import { Settings } from "./pages/Settings";

import { SignInPage } from "./pages/SignIn";
import { SignUpPage } from "./pages/SignUp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/" element={<ProtectedRoutes />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route index element={<Dashboard />} />
            <Route path="read-book/:bookId" element={<ReadBook />} />
            <Route path="library" element={<Library />} />
            <Route path="collections" element={<Collections />} />
            <Route path="podcasts" element={<Podcasts />} />
            <Route path="uploads" element={<Uploads />} />
            <Route path="ai-chat" element={<AIChat />} />
            
            <Route path="settings" element={<Settings />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
