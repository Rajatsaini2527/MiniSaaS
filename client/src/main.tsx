import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './store';
import { queryClient } from './lib/queryClient';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { registerServiceWorker } from './utils/pwa';
import './index.css';

// Register PWA service worker
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
        <OfflineIndicator />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#363636', color: '#fff' },
            success: { duration: 3000 },
            error: { duration: 5000 },
          }}
        />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
