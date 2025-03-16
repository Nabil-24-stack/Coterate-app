import React from 'react';
import styled from 'styled-components';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { PageProvider } from './contexts/PageContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { Login, AuthCallback } from './components/Auth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: relative;
`;

const AuthenticatedApp = () => {
  return (
    <PageProvider>
      <AppContainer>
        <Sidebar />
        <Canvas />
      </AppContainer>
    </PageProvider>
  );
};

const UnauthenticatedApp = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <Login />
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <p>Loading...</p>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login" element={<UnauthenticatedApp />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AuthenticatedApp />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 