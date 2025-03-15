import React, { useState } from 'react';
import styled from 'styled-components';
import * as figmaService from '../services/figmaService';

const Container = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const Title = styled.h1`
  margin-bottom: 20px;
`;

const Form = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  width: 100%;
`;

const Button = styled.button`
  padding: 10px 15px;
  background-color: #0066ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  
  &:hover {
    background-color: #0052cc;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ResultContainer = styled.div`
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  padding: 10px;
  margin-top: 10px;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  background-color: #ffebee;
`;

const ImagePreview = styled.img`
  max-width: 100%;
  margin-top: 20px;
  border: 1px solid #ddd;
`;

const CodeBlock = styled.pre`
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
  font-size: 14px;
`;

const FigmaDebug: React.FC = () => {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTestFigmaApi = async () => {
    setError(null);
    setResult(null);
    setIsLoading(true);
    
    try {
      // Step 1: Validate the Figma URL
      const validation = figmaService.validateFigmaUrl(figmaUrl);
      if (!validation.isValid) {
        throw new Error(validation.message || 'Invalid Figma URL');
      }
      
      // Step 2: Extract file key and node ID
      const { fileKey, nodeId } = figmaService.extractFigmaInfo(figmaUrl);
      
      if (!fileKey) {
        throw new Error('Could not extract file key from URL');
      }
      
      if (!nodeId) {
        throw new Error('Could not extract node ID from URL');
      }
      
      // Step 3: Fetch file data
      const fileData = await figmaService.getFigmaFileData(fileKey, nodeId);
      
      // Step 4: Fetch images
      const imagesResponse = await figmaService.getFigmaImages(fileKey, [nodeId]);
      
      // Combine results
      setResult({
        fileKey,
        nodeId,
        fileData,
        imagesResponse
      });
    } catch (err) {
      console.error('Error testing Figma API:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container>
      <Title>Figma API Debug Tool</Title>
      
      <Form>
        <label htmlFor="figma-url">Figma URL:</label>
        <Input
          id="figma-url"
          type="text"
          value={figmaUrl}
          onChange={(e) => setFigmaUrl(e.target.value)}
          placeholder="Paste a Figma frame URL here (e.g., https://www.figma.com/file/abcdef/Design?node-id=123%3A456)"
        />
        <Button 
          onClick={handleTestFigmaApi} 
          disabled={isLoading || !figmaUrl}
        >
          {isLoading ? 'Testing...' : 'Test Figma API'}
        </Button>
      </Form>
      
      {error && (
        <ErrorMessage>
          <strong>Error:</strong> {error}
        </ErrorMessage>
      )}
      
      {result && (
        <ResultContainer>
          <h3>Results:</h3>
          
          <h4>Extracted Info:</h4>
          <CodeBlock>
            {JSON.stringify({ fileKey: result.fileKey, nodeId: result.nodeId }, null, 2)}
          </CodeBlock>
          
          {result.imagesResponse && result.imagesResponse.images && result.imagesResponse.images[result.nodeId] && (
            <>
              <h4>Image URL:</h4>
              <CodeBlock>
                {result.imagesResponse.images[result.nodeId]}
              </CodeBlock>
              
              <h4>Image Preview:</h4>
              <ImagePreview 
                src={result.imagesResponse.images[result.nodeId]} 
                alt="Figma design" 
              />
            </>
          )}
          
          <h4>Raw API Response:</h4>
          <CodeBlock>
            {JSON.stringify(result, null, 2)}
          </CodeBlock>
        </ResultContainer>
      )}
    </Container>
  );
};

export default FigmaDebug; 