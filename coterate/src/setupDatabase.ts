import { supabase } from './services/supabaseService';

// Function to set up the database tables
export const setupDatabase = async () => {
  console.log('Setting up database tables...');
  
  try {
    // Check if the pages table exists
    const { data: pagesCheck, error: pagesCheckError } = await supabase
      .from('pages')
      .select('id')
      .limit(1);
    
    if (pagesCheckError) {
      console.log('Pages table needs to be created or is not accessible');
      // We can't create tables directly with the JS client
      // This would need to be done in the Supabase dashboard
      console.log('Please create the pages table in the Supabase dashboard');
    } else {
      console.log('Pages table exists and is accessible.');
    }
    
    // Check if the components table exists
    const { data: componentsCheck, error: componentsCheckError } = await supabase
      .from('components')
      .select('id')
      .limit(1);
    
    if (componentsCheckError) {
      console.log('Components table needs to be created or is not accessible');
      // We can't create tables directly with the JS client
      console.log('Please create the components table in the Supabase dashboard');
    } else {
      console.log('Components table exists and is accessible.');
    }
    
    // Check if the user_settings table exists
    const { data: userSettingsCheck, error: userSettingsCheckError } = await supabase
      .from('user_settings')
      .select('id')
      .limit(1);
    
    if (userSettingsCheckError) {
      console.log('User_settings table needs to be created or is not accessible');
      // We can't create tables directly with the JS client
      console.log('Please create the user_settings table in the Supabase dashboard');
    } else {
      console.log('User_settings table exists and is accessible.');
    }
    
    return {
      success: true,
      tables: {
        pages: !pagesCheckError,
        components: !componentsCheckError,
        user_settings: !userSettingsCheckError
      }
    };
  } catch (error) {
    console.error('Error checking database tables:', error);
    return {
      success: false,
      error,
      tables: {
        pages: false,
        components: false,
        user_settings: false
      }
    };
  }
};

// Fallback to manual table creation - this would create minimal objects
const createTablesManually = async () => {
  try {
    console.log('Attempting to create minimal table data...');
    
    // Check current user
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      console.log('No authenticated user found, skipping manual table creation');
      return { success: false };
    }
    
    // Try to create a minimal pages entry
    const { error: pagesError } = await supabase
      .from('pages')
      .upsert([
        {
          name: 'Default Page',
          user_id: userId
        }
      ])
      .select();
    
    if (pagesError) {
      console.error('Failed to create page:', pagesError);
    } else {
      console.log('Default page created successfully');
    }
    
    // Try to create a minimal user_settings entry
    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert([
        {
          user_id: userId,
          settings: {}
        }
      ])
      .select();
    
    if (settingsError) {
      console.error('Failed to create settings:', settingsError);
    } else {
      console.log('Default settings created successfully');
    }
    
    return { success: !pagesError && !settingsError };
  } catch (error) {
    console.error('Error in manual table creation:', error);
    return { success: false, error };
  }
};

// Function to check auth state
const checkAuthState = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return {
      isAuthenticated: !!data.session,
      user: data.session?.user
    };
  } catch (error) {
    console.error('Error checking auth state:', error);
    return { isAuthenticated: false, user: null };
  }
};

// Run the setup
export const runDatabaseSetup = async () => {
  try {
    // Check if user is authenticated
    const { isAuthenticated } = await checkAuthState();
    
    if (!isAuthenticated) {
      console.log('User not authenticated, delaying database setup');
      return;
    }
    
    // Check tables
    const result = await setupDatabase();
    
    if (result.success && result.tables) {
      const { tables } = result;
      
      // If any table doesn't exist, try to create minimal data
      if (!tables.pages || !tables.components || !tables.user_settings) {
        console.log('Some tables are missing, trying to create minimal data...');
        await createTablesManually();
      }
    }
  } catch (error) {
    console.error('Database setup failed:', error);
    // Continue anyway to not block the app from loading
  }
};

// Run the setup when this file is imported, but wrap in a try/catch
try {
  runDatabaseSetup();
} catch (error) {
  console.error('Failed to run database setup, continuing app startup:', error);
}

// Export a function to retry database setup explicitly from other components if needed
export const retryDatabaseSetup = async () => {
  return await runDatabaseSetup();
}; 