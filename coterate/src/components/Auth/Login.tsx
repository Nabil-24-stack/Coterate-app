import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
  color: #333;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e3e6ea;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
  }
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #4338ca;
  }
  
  &:disabled {
    background-color: #a5a5a5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const SwitchMode = styled.p`
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  
  button {
    background: none;
    border: none;
    color: #4f46e5;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    margin-left: 0.25rem;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 1rem 0;
  width: 100%;
  
  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e3e6ea;
  }
  
  span {
    padding: 0 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

const SocialButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: white;
  color: #333;
  border: 1px solid #e3e6ea;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
  
  img {
    width: 20px;
    height: 20px;
    margin-right: 0.75rem;
  }
`;

const Login: React.FC = () => {
  const { signIn, signUp, signInWithFigma } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleFigmaLogin = async () => {
    setError(null);
    try {
      const { data, error } = await signInWithFigma();
      if (error) throw error;
      
      // If we get here without a redirect, something went wrong
      console.log('Figma OAuth response:', data);
      if (!data.url) {
        throw new Error('No redirect URL received from Figma OAuth provider');
      }
      
      // Log the URL we're redirecting to for debugging
      console.log('Redirecting to Figma OAuth URL:', data.url);
      
      // Redirect to the Figma OAuth URL
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Figma login error:', err);
      setError(err.message || 'An error occurred during Figma authentication');
    }
  };

  return (
    <LoginContainer>
      <Title>{isSignUp ? 'Create an Account' : 'Sign In'}</Title>
      
      <SocialButton type="button" onClick={handleFigmaLogin}>
        <img src="https://static.figma.com/app/icon/1/favicon.svg" alt="Figma logo" />
        Continue with Figma
      </SocialButton>
      
      <Divider>
        <span>OR</span>
      </Divider>
      
      <Form onSubmit={handleSubmit}>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>
      </Form>
      <SwitchMode>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </SwitchMode>
    </LoginContainer>
  );
};

export default Login; 