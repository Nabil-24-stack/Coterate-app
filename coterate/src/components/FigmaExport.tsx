import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { usePageContext } from '../contexts/PageContext';
import { aiService } from '../services/aiService';
import { DesignIteration, DetectedComponent } from '../types';
import { useAuth } from '../contexts/AuthContext';
import FigmaFilesSelector from './FigmaFilesSelector';
import { getFigmaFile, getFigmaImages, getFigmaAccessToken } from '../services/figmaService';

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

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 10px 15px;
  background-color: ${props => props.active ? '#0066ff' : '#f0f0f0'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  
  &:hover {
    background-color: ${props => props.active ? '#0052cc' : '#e0e0e0'};
  }
`;

const FigmaConnectButton = styled(ExportButton)`
  background-color: #1e1e1e;
  
  &:hover {
    background-color: #000000;
  }
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
  const { session, isFigmaConnected } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [figmaCode, setFigmaCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'json' | 'figma'>('json');
  const [showFilesSelector, setShowFilesSelector] = useState(false);
  const [selectedFigmaFile, setSelectedFigmaFile] = useState<{ key: string, name: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Fetch the Figma access token when the component mounts
  useEffect(() => {
    const fetchAccessToken = async () => {
      if (isFigmaConnected) {
        try {
          const token = await getFigmaAccessToken();
          setAccessToken(token);
        } catch (err) {
          console.error('Error fetching Figma access token:', err);
        }
      }
    };
    
    fetchAccessToken();
  }, [isFigmaConnected]);
  
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

  const handleFigmaFileSelect = (fileKey: string, fileName: string) => {
    setSelectedFigmaFile({ key: fileKey, name: fileName });
    setShowFilesSelector(false);
  };

  const handleExportToFigma = async () => {
    if (!selectedFigmaFile) {
      setError('Please select a Figma file first.');
      return;
    }
    
    if (!accessToken) {
      setError('Figma access token not found. Please reconnect your Figma account.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Here you would implement the logic to export the design to Figma
      // This would involve using the Figma API to create nodes in the selected file
      // For now, we'll just show a success message
      
      alert(`Design would be exported to Figma file: ${selectedFigmaFile.name}`);
      
      // In a real implementation, you would:
      // 1. Convert the components to Figma nodes
      // 2. Use the Figma API to create these nodes in the selected file
      // 3. Show a success message with a link to the file
      
    } catch (err: any) {
      console.error('Error exporting to Figma:', err);
      setError(err.message || 'Failed to export to Figma');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <FigmaExportContainer>
      <Title>Export Design</Title>
      
      <TabContainer>
        <Tab 
          active={activeTab === 'json'} 
          onClick={() => setActiveTab('json')}
        >
          JSON Export
        </Tab>
        <Tab 
          active={activeTab === 'figma'} 
          onClick={() => setActiveTab('figma')}
        >
          Figma Export
        </Tab>
      </TabContainer>
      
      {activeTab === 'json' ? (
        <>
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
        </>
      ) : (
        <>
          <p>Export your design to a Figma file.</p>
          
          {error && (
            <div style={{ 
              color: '#ef4444', 
              padding: '10px', 
              backgroundColor: '#fef2f2', 
              borderRadius: '4px', 
              marginBottom: '15px' 
            }}>
              {error}
            </div>
          )}
          
          {!isFigmaConnected ? (
            <div style={{ marginTop: '15px' }}>
              <p>You need to connect your Figma account to export designs to Figma.</p>
              <p>Please log out and sign in with Figma to enable this feature.</p>
            </div>
          ) : showFilesSelector ? (
            <FigmaFilesSelector onFileSelect={handleFigmaFileSelect} />
          ) : (
            <div style={{ marginTop: '15px' }}>
              {selectedFigmaFile ? (
                <div style={{ marginBottom: '15px' }}>
                  <p>Selected Figma file: <strong>{selectedFigmaFile.name}</strong></p>
                  <ExportButton 
                    onClick={() => setShowFilesSelector(true)}
                    style={{ marginRight: '10px', marginTop: '10px' }}
                  >
                    Change File
                  </ExportButton>
                  <ExportButton 
                    onClick={handleExportToFigma}
                    disabled={isLoading}
                    style={{ marginTop: '10px' }}
                  >
                    {isLoading ? 'Exporting...' : 'Export to Figma'}
                  </ExportButton>
                </div>
              ) : (
                <ExportButton 
                  onClick={() => setShowFilesSelector(true)}
                  style={{ marginTop: '10px' }}
                >
                  Select Figma File
                </ExportButton>
              )}
            </div>
          )}
        </>
      )}
    </FigmaExportContainer>
  );
}; 