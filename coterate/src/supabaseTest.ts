import { supabase } from './services/supabaseService';

// Function to test the Supabase connection
export const testSupabaseConnection = async () => {
  try {
    // Test the connection by getting the current user
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error };
    }
    
    console.log('Supabase connection successful!');
    console.log('Session data:', data);
    
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error testing Supabase connection:', error);
    return { success: false, error };
  }
};

// Function to check if the required tables exist
export const checkDatabaseSchema = async () => {
  try {
    console.log('Checking database schema...');
    
    // Check if the pages table exists
    const { data: pagesData, error: pagesError } = await supabase
      .from('pages')
      .select('count')
      .limit(1);
    
    if (pagesError) {
      console.error('Error checking pages table:', pagesError);
      console.log('The pages table might not exist or you might not have permission to access it.');
    } else {
      console.log('Pages table exists and is accessible.');
    }
    
    // Check if the components table exists
    const { data: componentsData, error: componentsError } = await supabase
      .from('components')
      .select('count')
      .limit(1);
    
    if (componentsError) {
      console.error('Error checking components table:', componentsError);
      console.log('The components table might not exist or you might not have permission to access it.');
    } else {
      console.log('Components table exists and is accessible.');
    }
    
    // Check if the user_settings table exists
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('count')
      .limit(1);
    
    if (settingsError) {
      console.error('Error checking user_settings table:', settingsError);
      console.log('The user_settings table might not exist or you might not have permission to access it.');
    } else {
      console.log('User_settings table exists and is accessible.');
    }
    
    return {
      pagesTableExists: !pagesError,
      componentsTableExists: !componentsError,
      userSettingsTableExists: !settingsError
    };
  } catch (error) {
    console.error('Unexpected error checking database schema:', error);
    return {
      pagesTableExists: false,
      componentsTableExists: false,
      userSettingsTableExists: false,
      error
    };
  }
};

// Run the tests when this file is imported
testSupabaseConnection();
checkDatabaseSchema(); 