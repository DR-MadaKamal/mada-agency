
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
if (clientId) {
  import('./lib/googleAuth').then(({ initGoogleAuth }) => initGoogleAuth(clientId));
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
