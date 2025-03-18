import React, { useState } from 'react';
import styled from 'styled-components';
import { usePageContext } from '../contexts/PageContext';
import { aiService } from '../services/aiService';
import { DesignIteration, DetectedComponent } from '../types';

const FigmaExportContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const Title = styled.h3`
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const ExportButton = styled.button`
  padding: 10px 15px;
  background-color: #0066ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  font-family: 'Plus Jakarta Sans', sans-serif;
  
  &:hover {
    background-color: #0052cc;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const InfoText = styled.p`
  font-size: 14px;
  color: #666;
  margin: 5px 0 15px 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const CodeBlock = styled.pre`
  background-color: #f0f0f0;
  padding: 15px;
  border-radius: 4px;
  overflow: auto;
  font-family: monospace;
  font-size: 12px;
  margin-top: 15px;
`;

const CopyButton = styled.button`
  padding: 5px 10px;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const SuccessMessage = styled.div`
  color: #4caf50;
  font-size: 14px;
  margin-top: 10px;
`;

interface FigmaExportProps {
  selectedIteration: DesignIteration;
  onClose: () => void;
}

export const FigmaExport: React.FC<FigmaExportProps> = ({ 
  selectedIteration, 
  onClose 
}) => {
  const { currentPage } = usePageContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [figmaCode, setFigmaCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Simple function to convert components to JSON format
  const convertToExportFormat = (components: DetectedComponent[] | undefined) => {
    return JSON.stringify(components || [], null, 2);
  };
  
  const handleDownload = () => {
    try {
      // Create a JSON file for download
      const jsonData = convertToExportFormat(selectedIteration.components);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a download link
      const a = document.createElement('a');
      a.href = url;
      // Use a default name if currentPage is null
      const fileName = currentPage 
        ? `${currentPage.name.replace(/\s+/g, '-').toLowerCase()}-export.json`
        : `design-export-${new Date().getTime()}.json`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading export:', error);
    }
  };
  
  const handleCopy = () => {
    try {
      const jsonData = convertToExportFormat(selectedIteration.components);
      navigator.clipboard.writeText(jsonData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };
  
  return (
    <FigmaExportContainer>
      <Title>Export Design</Title>
      <p>Export your design as JSON data that can be used in other applications.</p>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <ExportButton onClick={handleDownload}>
          Download JSON
        </ExportButton>
        <ExportButton onClick={handleCopy} style={{ backgroundColor: copied ? '#4caf50' : '' }}>
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </ExportButton>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>Preview:</h4>
        <pre style={{ 
          maxHeight: '200px', 
          overflow: 'auto', 
          backgroundColor: '#f0f0f0', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {convertToExportFormat(selectedIteration.components).substring(0, 500)}
          {convertToExportFormat(selectedIteration.components).length > 500 ? '...' : ''}
        </pre>
      </div>
    </FigmaExportContainer>
  );
}; 