#!/usr/bin/env node
// Fix Gemini model - Update from deprecated gemini-2.0-flash-lite to gemini-2.0-flash-exp

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://usujonswoxboxlysakcm.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzdWpvbnN3b3hib3hseXNha2NtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA2MTgwMSwiZXhwIjoyMDg4NjM3ODAxfQ.fUWkx7D8OTVarffm2SOeNCkGeiznPGvNxk9C-wwvl_E'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  console.log('🔧 Fixing Gemini model configuration...\n')

  // 1. Check current admin_config
  const { data: config, error: configError } = await supabase
    .from('admin_config')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (configError) {
    console.error('❌ Error reading admin_config:', configError.message)
    process.exit(1)
  }

  console.log('📋 Current model:', config.ai_model)

  // 2. Update to gemini-2.0-flash-exp (experimental, free, stable)
  const newModel = 'gemini-2.0-flash-exp'

  const { error: updateError } = await supabase
    .from('admin_config')
    .update({
      ai_model: newModel,
      updated_at: new Date().toISOString()
    })
    .eq('id', config.id)

  if (updateError) {
    console.error('❌ Error updating admin_config:', updateError.message)
    process.exit(1)
  }

  console.log('✅ Updated ai_model to:', newModel)

  // 3. Check if llm_models table has the new model
  const { data: modelRow } = await supabase
    .from('llm_models')
    .select('*')
    .eq('model_id', newModel)
    .maybeSingle()

  if (!modelRow) {
    console.log('\n📝 Adding new model to llm_models table...')

    const { error: insertError } = await supabase
      .from('llm_models')
      .insert({
        model_id: newModel,
        name: 'Gemini 2.0 Flash Experimental',
        provider: 'gemini',
        api_key_env: 'GEMINI_API_KEY',
        context_window: 1048576,
        max_output_tokens: 8192,
        input_cost_per_1m: 0, // Free during experimental
        output_cost_per_1m: 0,
        is_active: true,
        sort_order: 0
      })

    if (insertError) {
      console.error('❌ Error inserting model:', insertError.message)
    } else {
      console.log('✅ Added model to llm_models table')
    }
  } else {
    console.log('✅ Model already exists in llm_models table')
  }

  console.log('\n🎉 Done! Chat should work now.')
  console.log('💡 Remember to restart PM2: pm2 restart tinnimate')
}

main().catch(console.error)
