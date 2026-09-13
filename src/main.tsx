import React from 'react';
import ReactDOM from 'react-dom/client';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import App from './App';
import './index.css';

// Initialize global Midnight Network ID before any wallet or contract operations
setNetworkId('preprod');
console.log('[PrivEstate] Initializing PrivEstate Level 6 Supermoon on Midnight Network Preprod');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
