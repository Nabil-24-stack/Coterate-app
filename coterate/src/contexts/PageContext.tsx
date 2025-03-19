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
          const pagesData = await getPages();
          
          if (pagesData && pagesData.length > 0) {
            // Filter pages to only show those belonging to the current user
            const userPages = pagesData.filter(page => page.user_id === user.id);
            
            if (userPages.length > 0) {
              setPages(userPages);
              setCurrentPage(userPages[0]);
              return;
            }
          }
          
          // Create a default page if none exist for this user
          const defaultPage: Omit<Page, 'id' | 'created_at' | 'updated_at'> = {
            name: 'Default Page',
            baseImage: 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design',
            user_id: user.id
          };
          
          const newPage = await createPage(defaultPage);
          
          if (newPage) {
            setPages([newPage]);
            setCurrentPage(newPage);
          } else {
            console.error('Failed to create default page');
            // Fallback to local page if database operations fail
            const localDefaultPage: Page = {
              id: generateUUID(),
              name: 'Default Page (Local)',
              baseImage: 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design',
              user_id: user.id
            };
            setPages([localDefaultPage]);
            setCurrentPage(localDefaultPage);
          }
        } catch (error) {
          console.error('Error in loadPages:', error);
          // Fallback to local page if database operations fail
          const localDefaultPage: Page = {
            id: generateUUID(),
            name: 'Default Page (Local)',
            baseImage: 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design',
            user_id: user.id
          };
          setPages([localDefaultPage]);
          setCurrentPage(localDefaultPage);
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
    
    try {
      if (user) {
        console.log('Creating page for authenticated user');
        const newPageData: Omit<Page, 'id' | 'created_at' | 'updated_at'> = {
          name: name || `Page ${pages.length + 1}`,
          user_id: user.id,
          baseImage: 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design'
        };
        
        const newPage = await createPage(newPageData);
        
        if (newPage) {
          setPages(prevPages => [...prevPages, newPage]);
          setCurrentPage(newPage);
        } else {
          console.error('Failed to create page in database');
          // Fallback to local page
          const localPage: Page = {
            id: generateUUID(),
            name: name || `Page ${pages.length + 1}`,
            baseImage: 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design',
            user_id: user.id
          };
          
          setPages(prevPages => [...prevPages, localPage]);
          setCurrentPage(localPage);
        }
      } else {
        // Create a local page if no user
        const newPage: Page = {
          id: generateUUID(),
          name: name || `Page ${pages.length + 1}`,
          baseImage: 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design'
        };
        
        setPages(prevPages => [...prevPages, newPage]);
        setCurrentPage(newPage);
      }
    } catch (error) {
      console.error('Error in addPage:', error);
      // Fallback to local page
      const localPage: Page = {
        id: generateUUID(),
        name: name || `Page ${pages.length + 1}`,
        baseImage: 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design',
        user_id: user?.id
      };
      
      setPages(prevPages => [...prevPages, localPage]);
      setCurrentPage(localPage);
    }
  };
  
  // Update a page
  const updatePage = async (id: string, updates: Partial<Page>) => {
    console.log('updatePage called with id:', id, 'updates:', updates);
    
    try {
      if (user) {
        // Update in database
        const updatedPage = await updatePageInDb(id, updates);
        
        // Update local state regardless of database result
        setPages(prevPages => 
          prevPages.map(page => 
            page.id === id ? { ...page, ...updates } : page
          )
        );
        
        // Update current page if it's the one being updated
        if (currentPage && currentPage.id === id) {
          setCurrentPage(prevPage => ({
            ...prevPage!,
            ...updates
          }));
        }
      } else {
        // Update local state only
        setPages(prevPages => 
          prevPages.map(page => 
            page.id === id ? { ...page, ...updates } : page
          )
        );
        
        // Update current page if it's the one being updated
        if (currentPage && currentPage.id === id) {
          setCurrentPage(prevPage => ({
            ...prevPage!,
            ...updates
          }));
        }
      }
    } catch (error) {
      console.error('Error in updatePage:', error);
      // Still update local state to avoid UI issues
      setPages(prevPages => 
        prevPages.map(page => 
          page.id === id ? { ...page, ...updates } : page
        )
      );
      
      if (currentPage && currentPage.id === id) {
        setCurrentPage(prevPage => ({
          ...prevPage!,
          ...updates
        }));
      }
    }
  };
  
  // Delete a page
  const deletePage = async (id: string) => {
    console.log('deletePage called with id:', id);
    
    try {
      if (user) {
        // Delete from database
        const success = await deletePageInDb(id);
        
        if (!success) {
          console.warn('Database delete operation failed, but proceeding with UI update');
        }
      }
      
      // Remove from local state regardless of database result
      const newPages = pages.filter(page => page.id !== id);
      setPages(newPages);
      
      // If the deleted page was the current page, set a new current page
      if (currentPage && currentPage.id === id) {
        if (newPages.length > 0) {
          setCurrentPage(newPages[0]);
        } else {
          setCurrentPage(null);
        }
      }
    } catch (error) {
      console.error('Error in deletePage:', error);
      // Still update local state to avoid UI issues
      const newPages = pages.filter(page => page.id !== id);
      setPages(newPages);
      
      if (currentPage && currentPage.id === id) {
        if (newPages.length > 0) {
          setCurrentPage(newPages[0]);
        } else {
          setCurrentPage(null);
        }
      }
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