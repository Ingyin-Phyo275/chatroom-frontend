import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import router from './router/routes.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/Common/Themes/theme-provider.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <StrictMode>
      {/* Wrap your entire app in ThemeProvider */}
      <ThemeProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" theme='dark'/>
      </ThemeProvider>
    </StrictMode>
  </QueryClientProvider>
);
