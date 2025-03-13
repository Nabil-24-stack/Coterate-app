import { supabase } from './services/supabaseService';

// Function to set up the database tables
export const setupDatabase = async () => {
  console.log('Setting up database tables...');
  
  try {
    // Check if the pages table exists
    const { error: pagesCheckError } = await supabase
      .from('pages')
      .select('count')
      .limit(1);
    
    if (pagesCheckError) {
      console.log('Creating pages table...');
      
      // Create the pages table
      const { error: createPagesError } = await supabase.rpc('create_pages_table');
      
      if (createPagesError) {
        console.error('Error creating pages table:', createPagesError);
      } else {
        console.log('Pages table created successfully!');
      }
    } else {
      console.log('Pages table already exists.');
    }
    
    // Check if the components table exists
    const { error: componentsCheckError } = await supabase
      .from('components')
      .select('count')
      .limit(1);
    
    if (componentsCheckError) {
      console.log('Creating components table...');
      
      // Create the components table
      const { error: createComponentsError } = await supabase.rpc('create_components_table');
      
      if (createComponentsError) {
        console.error('Error creating components table:', createComponentsError);
      } else {
        console.log('Components table created successfully!');
      }
    } else {
      console.log('Components table already exists.');
    }
    
    // Check if the user_settings table exists
    const { error: settingsCheckError } = await supabase
      .from('user_settings')
      .select('count')
      .limit(1);
    
    if (settingsCheckError) {
      console.log('Creating user_settings table...');
      
      // Create the user_settings table
      const { error: createSettingsError } = await supabase.rpc('create_user_settings_table');
      
      if (createSettingsError) {
        console.error('Error creating user_settings table:', createSettingsError);
      } else {
        console.log('User_settings table created successfully!');
      }
    } else {
      console.log('User_settings table already exists.');
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error setting up database:', error);
    return {
      success: false,
      error
    };
  }
};

// Create the SQL functions to create the tables
export const createSqlFunctions = async () => {
  console.log('Creating SQL functions...');
  
  try {
    // Create the function to create the pages table
    const createPagesTableSql = `
      CREATE OR REPLACE FUNCTION create_pages_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS pages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          base_image TEXT,
          iterated_image TEXT,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create RLS policies
        ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
        
        -- Pages policies
        CREATE POLICY "Users can view their own pages" 
          ON pages FOR SELECT 
          USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own pages" 
          ON pages FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own pages" 
          ON pages FOR UPDATE 
          USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own pages" 
          ON pages FOR DELETE 
          USING (auth.uid() = user_id);
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: createPagesTableFunctionError } = await supabase.rpc('create_pages_table_function', { sql: createPagesTableSql });
    
    if (createPagesTableFunctionError) {
      console.error('Error creating create_pages_table function:', createPagesTableFunctionError);
    } else {
      console.log('Create_pages_table function created successfully!');
    }
    
    // Create the function to create the components table
    const createComponentsTableSql = `
      CREATE OR REPLACE FUNCTION create_components_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS components (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          type TEXT NOT NULL,
          confidence FLOAT,
          bounding_box JSONB NOT NULL,
          attributes JSONB,
          page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
          z_index INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create RLS policies
        ALTER TABLE components ENABLE ROW LEVEL SECURITY;
        
        -- Components policies
        CREATE POLICY "Users can view components of their pages" 
          ON components FOR SELECT 
          USING (EXISTS (
            SELECT 1 FROM pages 
            WHERE pages.id = components.page_id 
            AND pages.user_id = auth.uid()
          ));
        
        CREATE POLICY "Users can insert components to their pages" 
          ON components FOR INSERT 
          WITH CHECK (EXISTS (
            SELECT 1 FROM pages 
            WHERE pages.id = components.page_id 
            AND pages.user_id = auth.uid()
          ));
        
        CREATE POLICY "Users can update components of their pages" 
          ON components FOR UPDATE 
          USING (EXISTS (
            SELECT 1 FROM pages 
            WHERE pages.id = components.page_id 
            AND pages.user_id = auth.uid()
          ));
        
        CREATE POLICY "Users can delete components of their pages" 
          ON components FOR DELETE 
          USING (EXISTS (
            SELECT 1 FROM pages 
            WHERE pages.id = components.page_id 
            AND pages.user_id = auth.uid()
          ));
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: createComponentsTableFunctionError } = await supabase.rpc('create_components_table_function', { sql: createComponentsTableSql });
    
    if (createComponentsTableFunctionError) {
      console.error('Error creating create_components_table function:', createComponentsTableFunctionError);
    } else {
      console.log('Create_components_table function created successfully!');
    }
    
    // Create the function to create the user_settings table
    const createUserSettingsTableSql = `
      CREATE OR REPLACE FUNCTION create_user_settings_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS user_settings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
          settings JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create RLS policies
        ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
        
        -- User settings policies
        CREATE POLICY "Users can view their own settings" 
          ON user_settings FOR SELECT 
          USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own settings" 
          ON user_settings FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own settings" 
          ON user_settings FOR UPDATE 
          USING (auth.uid() = user_id);
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: createUserSettingsTableFunctionError } = await supabase.rpc('create_user_settings_table_function', { sql: createUserSettingsTableSql });
    
    if (createUserSettingsTableFunctionError) {
      console.error('Error creating create_user_settings_table function:', createUserSettingsTableFunctionError);
    } else {
      console.log('Create_user_settings_table function created successfully!');
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error creating SQL functions:', error);
    return {
      success: false,
      error
    };
  }
};

// Run the setup
export const runDatabaseSetup = async () => {
  await createSqlFunctions();
  await setupDatabase();
};

// Run the setup when this file is imported
runDatabaseSetup(); 