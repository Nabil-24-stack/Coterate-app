import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// Import the Supabase test to run it when the application starts
import './supabaseTest';
// Import the setupDatabase script to create the necessary tables
import './setupDatabase';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 