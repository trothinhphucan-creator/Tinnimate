#!/usr/bin/env node
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function runMigration() {
  console.log('🚀 Running chat suggestions migration...\n');

  try {
    // Read SQL file
    const sql = readFileSync('./supabase/migrations/20260323_chat_suggestions.sql', 'utf-8');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Skip comments
      if (stmt.startsWith('--') || !stmt) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });

      if (error) {
        // Some errors are OK (table already exists, etc)
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Warning: ${error.message}`);
        } else {
          console.error(`❌ Error: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\n📊 Verifying tables...');

    // Verify tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('chat_suggestions')
      .select('*')
      .limit(1);

    if (tablesError) {
      console.log('⚠️  chat_suggestions table may not exist yet');
    } else {
      console.log('✅ chat_suggestions table exists');
    }

    const { data: templates, error: templatesError } = await supabase
      .from('suggestion_templates')
      .select('count')
      .single();

    if (templatesError) {
      console.log('⚠️  suggestion_templates table may not exist yet');
    } else {
      console.log('✅ suggestion_templates table exists');
    }

  } catch (err) {
    console.error('💥 Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
