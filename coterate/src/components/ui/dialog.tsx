import React from 'react';
import styled from 'styled-components';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const DialogContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  
  return (
    <DialogOverlay onClick={() => onOpenChange(false)}>
      <DialogContainer onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogContainer>
    </DialogOverlay>
  );
}

export function DialogContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: '16px' }}>{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{children}</h2>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>{children}</div>;
} 