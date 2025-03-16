import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseService';
import { useNavigate } from 'react-router-dom';

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

const ErrorDetails = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fef2f2;
  border-radius: 4px;
  color: #ef4444;
  font-size: 0.875rem;
  max-width: 100%;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const AuthCallback: React.FC = () => {
  const [message, setMessage] = useState('Processing your login...');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the URL parameters
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        // Log debug information
        console.log('Auth callback URL:', window.location.href);
        console.log('Auth callback params:', {
          code: code ? 'present' : 'missing',
          error,
          errorDescription
        });
        
        // Check for errors in the URL
        if (error) {
          throw new Error(`${error}: ${errorDescription || 'Unknown error'}`);
        }
        
        // For Supabase OAuth, we don't need to do anything special
        // Supabase will handle the code exchange and session creation
        // We just need to check if we have a session
        
        // Check if we have a session
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (data.session) {
          console.log('Session found:', data.session);
          setMessage('Login successful! Redirecting...');
          
          // Redirect to the main app after a short delay
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } else {
          console.log('No session found, waiting for Supabase to process the callback...');
          
          // Wait a bit and try again
          setTimeout(async () => {
            const { data: retryData, error: retryError } = await supabase.auth.getSession();
            
            if (retryError) {
              throw retryError;
            }
            
            if (retryData.session) {
              console.log('Session found after retry:', retryData.session);
              setMessage('Login successful! Redirecting...');
              
              // Redirect to the main app
              setTimeout(() => {
                navigate('/');
              }, 1500);
            } else {
              // If we still don't have a session, something went wrong
              throw new Error('Failed to get a session after OAuth callback. Please try again.');
            }
          }, 3000); // Wait 3 seconds before retrying
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(`Authentication failed: ${err.message || 'Unknown error'}`);
        
        // Add debug info
        setDebugInfo(JSON.stringify({
          url: window.location.href,
          params: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
          error: err.message || 'Unknown error'
        }, null, 2));
      }
    };
    
    handleAuthCallback();
  }, [navigate]);
  
  return (
    <CallbackContainer>
      <LoadingMessage>
        <h2>Figma Authentication</h2>
        {error ? (
          <>
            <p style={{ color: '#ef4444' }}>{error}</p>
            {debugInfo && (
              <ErrorDetails>
                <strong>Debug Information:</strong>
                <pre>{debugInfo}</pre>
              </ErrorDetails>
            )}
          </>
        ) : (
          <p>{message}</p>
        )}
      </LoadingMessage>
    </CallbackContainer>
  );
};

export default AuthCallback; 