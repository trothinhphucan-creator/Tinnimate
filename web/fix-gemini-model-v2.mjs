#!/usr/bin/env node
// Fix Gemini model - Update to gemini-1.5-flash (stable, widely supported)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://usujonswoxboxlysakcm.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzdWpvbnN3b3hib3hseXNha2NtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA2MTgwMSwiZXhwIjoyMDg4NjM3ODAxfQ.fUWkx7D8OTVarffm2SOeNCkGeiznPGvNxk9C-wwvl_E'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  console.log('🔧 Fixing Gemini model configuration (v2)...\n')

  // Update to gemini-1.5-flash (stable, cheap, fast, widely supported)
  const newModel = 'gemini-1.5-flash'

  // 1. Update admin_config
  const { data: config } = await supabase
    .from('admin_config')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  console.log('📋 Current model:', config.ai_model)

  const { error: updateError } = await supabase
    .from('admin_config')
    .update({
      ai_model: newModel,
      updated_at: new Date().toISOString()
    })
    .eq('id', config.id)

  if (updateError) {
    console.error('❌ Error:', updateError.message)
    process.exit(1)
  }

  console.log('✅ Updated ai_model to:', newModel)

  // 2. Ensure llm_models table has the model
  const { data: modelRow } = await supabase
    .from('llm_models')
    .select('*')
    .eq('model_id', newModel)
    .maybeSingle()

  if (!modelRow) {
    console.log('\n📝 Adding model to llm_models table...')

    await supabase.from('llm_models').insert({
      model_id: newModel,
      name: 'Gemini 1.5 Flash',
      provider: 'gemini',
      api_key_env: 'GEMINI_API_KEY',
      context_window: 1048576,
      max_output_tokens: 8192,
      input_cost_per_1m: 0.075,
      output_cost_per_1m: 0.30,
      is_active: true,
      sort_order: 0
    })

    console.log('✅ Added model')
  } else {
    // Update to ensure is_active
    await supabase.from('llm_models')
      .update({ is_active: true })
      .eq('model_id', newModel)
    console.log('✅ Model already exists (ensured active)')
  }

  console.log('\n🎉 Done! Restart PM2: pm2 restart tinnimate')
}

main().catch(console.error)
