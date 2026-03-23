#!/usr/bin/env node
// Fix: Use gemini-2.0-flash via LiteLLM (has fallback)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://usujonswoxboxlysakcm.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzdWpvbnN3b3hib3hseXNha2NtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA2MTgwMSwiZXhwIjoyMDg4NjM3ODAxfQ.fUWkx7D8OTVarffm2SOeNCkGeiznPGvNxk9C-wwvl_E'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  console.log('🔧 Switching to gemini-2.0-flash via LiteLLM...\n')

  const newModel = 'gemini-2.0-flash'

  const { data: config } = await supabase
    .from('admin_config')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  console.log('📋 Current:', config.ai_model)

  await supabase
    .from('admin_config')
    .update({
      ai_model: newModel,
      updated_at: new Date().toISOString()
    })
    .eq('id', config.id)

  console.log('✅ Updated to:', newModel)

  // Check model exists
  const { data: modelRow } = await supabase
    .from('llm_models')
    .select('*')
    .eq('model_id', newModel)
    .eq('provider', 'litellm')
    .maybeSingle()

  if (!modelRow) {
    await supabase.from('llm_models').insert({
      model_id: newModel,
      name: 'Gemini 2.0 Flash (via LiteLLM)',
      provider: 'litellm',
      api_key_env: 'LITELLM_API_KEY',
      context_window: 1048576,
      max_output_tokens: 8192,
      input_cost_per_1m: 0.10,
      output_cost_per_1m: 0.40,
      is_active: true,
      sort_order: 0
    })
    console.log('✅ Added to database')
  } else {
    await supabase.from('llm_models')
      .update({ is_active: true, provider: 'litellm' })
      .eq('model_id', newModel)
    console.log('✅ Ensured active')
  }

  console.log('\n🎉 Restart: pm2 restart tinnimate --update-env')
}

main().catch(console.error)
