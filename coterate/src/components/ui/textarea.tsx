import React from 'react';
import styled from 'styled-components';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #0070f3;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f5f5f5;
  }
`;

export function Textarea({ className, ...props }: TextareaProps) {
  return <StyledTextarea className={className} {...props} />;
} 