import React, { createContext, useContext, useState, useEffect } from 'react';
import { Page, PageContextType } from '../types';
import { useAuth } from './AuthContext';
import { getPages, createPage, updatePage as updatePageInDb, deletePage as deletePageInDb } from '../services/databaseService';

// Simple function to generate a UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Create the context with a default value
const PageContext = createContext<PageContextType>({
  pages: [],
  currentPage: null,
  addPage: () => {},
  updatePage: () => {},
  deletePage: () => {},
  setCurrentPage: () => {},
  renamePage: () => {}
});

// Custom hook to use the context
export const usePageContext = () => useContext(PageContext);

// Provider component
export const PageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // State for pages
  const [pages, setPages] = useState<Page[]>([]);
  
  // State for current page
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  
  // Load pages from database when user changes
  useEffect(() => {
    const loadPages = async () => {
      if (user) {
        try {
          const { data, error } = await getPages(user.id);
          
          if (error) {
            console.error('Error loading pages:', error);
            return;
          }
          
          if (data && data.length > 0) {
            setPages(data);
            setCurrentPage(data[0]);
          } else {
            // Create a default page if none exist
            const defaultPage: Omit<Page, 'id'> = {
              name: 'Default Page',
              baseImage: 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design',
              user_id: user.id
            };
            
            const { data: newPage, error: createError } = await createPage(defaultPage);
            
            if (createError) {
              console.error('Error creating default page:', createError);
              return;
            }
            
            if (newPage) {
              setPages(newPage);
              setCurrentPage(newPage[0]);
            }
          }
        } catch (error) {
          console.error('Error in loadPages:', error);
        }
      } else {
        // If no user, use a local default page
        const defaultPage: Page = {
          id: generateUUID(),
          name: 'Default Page',
          baseImage: 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design'
        };
        
        setPages([defaultPage]);
        setCurrentPage(defaultPage);
      }
    };
    
    loadPages();
  }, [user]);
  
  // Add a new page
  const addPage = async (name: string) => {
    console.log('addPage called with name:', name);
    console.log('Current user:', user);
    
    try {
      if (user) {
        console.log('Creating page for authenticated user');
        const newPageData: Omit<Page, 'id'> = {
          name: name || `Page ${pages.length + 1}`,
          baseImage: 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design',
          user_id: user.id
        };
        
        console.log('New page data:', newPageData);
        const { data, error } = await createPage(newPageData);
        console.log('Create page response:', { data, error });
        
        if (error) {
          console.error('Error creating page:', error);
          return;
        }
        
        if (data && data[0]) {
          console.log('Setting pages with new page:', [...pages, data[0]]);
          setPages([...pages, data[0]]);
          setCurrentPage(data[0]);
        } else {
          console.error('No data returned from createPage');
        }
      } else {
        console.log('Creating local page (no authenticated user)');
        // If no user, create a local page
        const newPage: Page = {
          id: generateUUID(),
          name: name || `Page ${pages.length + 1}`,
          baseImage: 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design'
        };
        
        console.log('New local page:', newPage);
        setPages([...pages, newPage]);
        setCurrentPage(newPage);
      }
    } catch (error) {
      console.error('Error in addPage:', error);
    }
  };
  
  // Update a page
  const updatePage = async (id: string, updates: Partial<Page>) => {
    try {
      if (user) {
        const { data, error } = await updatePageInDb(id, updates);
        
        if (error) {
          console.error('Error updating page:', error);
          return;
        }
        
        if (data) {
          setPages(pages.map(page => page.id === id ? { ...page, ...updates } : page));
          
          if (currentPage && currentPage.id === id) {
            setCurrentPage({ ...currentPage, ...updates });
          }
        }
      } else {
        // If no user, update local page
        setPages(pages.map(page => page.id === id ? { ...page, ...updates } : page));
        
        if (currentPage && currentPage.id === id) {
          setCurrentPage({ ...currentPage, ...updates });
        }
      }
    } catch (error) {
      console.error('Error in updatePage:', error);
    }
  };
  
  // Delete a page
  const deletePage = async (id: string) => {
    try {
      if (user) {
        const { error } = await deletePageInDb(id);
        
        if (error) {
          console.error('Error deleting page:', error);
          return;
        }
      }
      
      // Update local state regardless of user status
      const updatedPages = pages.filter(page => page.id !== id);
      setPages(updatedPages);
      
      if (currentPage && currentPage.id === id) {
        setCurrentPage(updatedPages.length > 0 ? updatedPages[0] : null);
      }
    } catch (error) {
      console.error('Error in deletePage:', error);
    }
  };
  
  // Rename a page
  const renamePage = async (id: string, newName: string) => {
    await updatePage(id, { name: newName });
  };
  
  return (
    <PageContext.Provider
      value={{
        pages,
        currentPage,
        addPage,
        updatePage,
        deletePage,
        setCurrentPage,
        renamePage
      }}
    >
      {children}
    </PageContext.Provider>
  );
}; 