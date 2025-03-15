import React from 'react';
import styled from 'styled-components';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary';
  children: React.ReactNode;
}

const StyledButton = styled.button<{ variant?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: 500;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'default' || !props.variant ? `
    background-color: #0070f3;
    color: white;
    border: 1px solid #0070f3;
    
    &:hover {
      background-color: #0060df;
      border-color: #0060df;
    }
  ` : ''}
  
  ${props => props.variant === 'outline' ? `
    background-color: transparent;
    color: #0070f3;
    border: 1px solid #0070f3;
    
    &:hover {
      background-color: rgba(0, 112, 243, 0.1);
    }
  ` : ''}
  
  ${props => props.variant === 'secondary' ? `
    background-color: #f5f5f5;
    color: #333;
    border: 1px solid #e0e0e0;
    
    &:hover {
      background-color: #e0e0e0;
    }
  ` : ''}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export function Button({ variant = 'default', children, ...props }: ButtonProps) {
  return (
    <StyledButton variant={variant} {...props}>
      {children}
    </StyledButton>
  );
} 