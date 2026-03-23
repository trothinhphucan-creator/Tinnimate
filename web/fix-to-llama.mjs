#!/usr/bin/env node
// Fix: Use llama3.2 via LiteLLM (local, free, always available)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://usujonswoxboxlysakcm.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzdWpvbnN3b3hib3hseXNha2NtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA2MTgwMSwiZXhwIjoyMDg4NjM3ODAxfQ.fUWkx7D8OTVarffm2SOeNCkGeiznPGvNxk9C-wwvl_E'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  console.log('🔧 Switching to Llama 3.2 (local via LiteLLM)...\n')

  const newModel = 'llama3.2'

  // 1. Update admin_config
  const { data: config } = await supabase
    .from('admin_config')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  console.log('📋 Current model:', config.ai_model)

  await supabase
    .from('admin_config')
    .update({
      ai_model: newModel,
      updated_at: new Date().toISOString()
    })
    .eq('id', config.id)

  console.log('✅ Updated to:', newModel)

  // 2. Ensure llm_models has it
  const { data: modelRow } = await supabase
    .from('llm_models')
    .select('*')
    .eq('model_id', newModel)
    .maybeSingle()

  if (!modelRow) {
    await supabase.from('llm_models').insert({
      model_id: newModel,
      name: 'Llama 3.2 (Local via Ollama)',
      provider: 'litellm',
      api_key_env: 'LITELLM_API_KEY',
      context_window: 128000,
      max_output_tokens: 4096,
      input_cost_per_1m: 0,
      output_cost_per_1m: 0,
      is_active: true,
      sort_order: 0
    })
    console.log('✅ Added model to database')
  } else {
    console.log('✅ Model exists')
  }

  console.log('\n🎉 Done! Restart: pm2 restart tinnimate --update-env')
}

main().catch(console.error)
