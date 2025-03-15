import React from 'react';

export const DebugEnv: React.FC = () => {
  return (
    <div style={{ 
      padding: '10px', 
      margin: '10px', 
      border: '1px solid #ccc', 
      borderRadius: '4px',
      backgroundColor: '#f5f5f5'
    }}>
      <h3>Environment Variables Debug</h3>
      <p>REACT_APP_FIGMA_ACCESS_TOKEN exists: {process.env.REACT_APP_FIGMA_ACCESS_TOKEN ? 'Yes' : 'No'}</p>
      <p>REACT_APP_FIGMA_ACCESS_TOKEN length: {process.env.REACT_APP_FIGMA_ACCESS_TOKEN?.length || 0}</p>
      <p>REACT_APP_FIGMA_ACCESS_TOKEN prefix: {process.env.REACT_APP_FIGMA_ACCESS_TOKEN?.substring(0, 5)}...</p>
      <p>NODE_ENV: {process.env.NODE_ENV}</p>
    </div>
  );
}; 