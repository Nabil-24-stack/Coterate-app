import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseService';

const CallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f5f5;
`;

const LoadingMessage = styled.div`
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  
  h2 {
    margin-bottom: 1rem;
    color: #333;
  }
  
  p {
    color: #6b7280;
  }
`;

const AuthCallback: React.FC = () => {
  const [message, setMessage] = useState('Processing your login...');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // The hash contains the token information
    const handleAuthCallback = async () => {
      try {
        // Supabase handles the OAuth callback automatically
        // We just need to check if the user is authenticated
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          setMessage('Login successful! Redirecting...');
          // Redirect to the main app after a short delay
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          setError('No session found. Authentication may have failed.');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(`Authentication failed: ${err.message || 'Unknown error'}`);
      }
    };
    
    handleAuthCallback();
  }, []);
  
  return (
    <CallbackContainer>
      <LoadingMessage>
        <h2>Figma Authentication</h2>
        {error ? (
          <p style={{ color: '#ef4444' }}>{error}</p>
        ) : (
          <p>{message}</p>
        )}
      </LoadingMessage>
    </CallbackContainer>
  );
};

export default AuthCallback; 