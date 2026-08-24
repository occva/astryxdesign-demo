import React from 'react';
import ReactDOM from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './styles.css';
import './i18n';
import {Toasty} from '@cloudflare/kumo/components/toast';
import {QueryClientProvider} from '@tanstack/react-query';
import {App} from './App';
import {queryClient} from './queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toasty>
        <App />
      </Toasty>
    </QueryClientProvider>
  </React.StrictMode>,
);
