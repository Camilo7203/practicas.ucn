import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './AppRouter';
import './index.css';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import './i18n';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container not found');
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <ChakraProvider value={defaultSystem}>
      <AppRouter />
    </ChakraProvider>
  </React.StrictMode>,
);