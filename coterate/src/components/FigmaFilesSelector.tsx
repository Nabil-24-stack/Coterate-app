import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFigmaAccessToken, getFigmaFiles, getFigmaImages } from '../services/figmaService';
import { useAuth } from '../contexts/AuthContext';

interface FigmaFile {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
}

interface FigmaFilesSelectorProps {
  onFileSelect: (fileKey: string, fileName: string) => void;
}

const Container = styled.div`
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h2`
  margin-bottom: 1rem;
  color: #333;
  font-weight: 600;
`;

const FilesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const FileCard = styled.div`
  border: 1px solid #e3e6ea;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const FileThumb = styled.div<{ url: string }>`
  height: 120px;
  background-image: url(${props => props.url});
  background-size: cover;
  background-position: center;
  background-color: #f5f5f5;
`;

const FileInfo = styled.div`
  padding: 0.75rem;
`;

const FileName = styled.h3`
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileDate = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  padding: 1rem;
  background-color: #fef2f2;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const FigmaFilesSelector: React.FC<FigmaFilesSelectorProps> = ({ onFileSelect }) => {
  const { session } = useAuth();
  const [files, setFiles] = useState<FigmaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchFigmaFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the Figma access token
        const accessToken = session?.provider_token;
        
        if (!accessToken) {
          throw new Error('Figma access token not found. Please reconnect your Figma account.');
        }
        
        // Fetch files from Figma API
        const filesData = await getFigmaFiles(accessToken);
        
        if (filesData && filesData.projects) {
          // Transform the data to our format
          const transformedFiles = filesData.projects.map((project: any) => ({
            key: project.key,
            name: project.name,
            thumbnail_url: project.thumbnail_url || 'https://via.placeholder.com/200x120?text=No+Thumbnail',
            last_modified: new Date(project.last_modified).toLocaleDateString()
          }));
          
          setFiles(transformedFiles);
        } else {
          setFiles([]);
        }
      } catch (err: any) {
        console.error('Error fetching Figma files:', err);
        setError(err.message || 'Failed to load Figma files');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFigmaFiles();
  }, [session]);
  
  const handleFileClick = (file: FigmaFile) => {
    onFileSelect(file.key, file.name);
  };
  
  return (
    <Container>
      <Title>Select a Figma File</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {loading ? (
        <EmptyState>Loading your Figma files...</EmptyState>
      ) : files.length === 0 ? (
        <EmptyState>No Figma files found. Create a file in Figma first.</EmptyState>
      ) : (
        <FilesGrid>
          {files.map(file => (
            <FileCard key={file.key} onClick={() => handleFileClick(file)}>
              <FileThumb url={file.thumbnail_url} />
              <FileInfo>
                <FileName>{file.name}</FileName>
                <FileDate>Modified: {file.last_modified}</FileDate>
              </FileInfo>
            </FileCard>
          ))}
        </FilesGrid>
      )}
    </Container>
  );
};

export default FigmaFilesSelector; 