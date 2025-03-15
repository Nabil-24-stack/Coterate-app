import React from 'react';
import styled from 'styled-components';

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
}

const ProgressContainer = styled.div`
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ value: number; max: number }>`
  height: 100%;
  width: ${props => (props.value / props.max) * 100}%;
  background-color: #0070f3;
  transition: width 0.3s ease;
`;

export function Progress({ value = 0, max = 100, className }: ProgressProps) {
  const clampedValue = Math.max(0, Math.min(value, max));
  
  return (
    <ProgressContainer className={className}>
      <ProgressBar value={clampedValue} max={max} />
    </ProgressContainer>
  );
} 