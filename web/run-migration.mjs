#!/usr/bin/env node
/**
 * Run SQL migration to upgrade all users to Ultra tier
 * Usage: node run-migration.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read .env.local
const envContent = readFileSync(join(__dirname, '.env.local'), 'utf-8')
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.+)`))
  return match ? match[1].trim() : null
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function runMigration() {
  console.log('🚀 Starting migration: Upgrade all users to Ultra tier...\n')

  try {
    // 1. Get current user count by tier
    console.log('📊 Current user distribution:')
    const { data: beforeStats, error: statsError } = await supabase
      .from('profiles')
      .select('subscription_tier')

    if (statsError) throw statsError

    const tierCounts = beforeStats.reduce((acc, user) => {
      acc[user.subscription_tier] = (acc[user.subscription_tier] || 0) + 1
      return acc
    }, {})

    console.table(tierCounts)
    console.log('')

    // 2. Update all users to Ultra
    console.log('⚡ Upgrading all users to Ultra tier...')
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_tier: 'ultra' })
      .in('subscription_tier', ['free', 'premium', 'pro'])
      .select('id, email, subscription_tier')

    if (updateError) throw updateError

    console.log(`✅ Successfully upgraded ${updated.length} users to Ultra!\n`)

    // 3. Verify the update
    console.log('🔍 Verifying upgrade...')
    const { data: afterStats, error: verifyError } = await supabase
      .from('profiles')
      .select('subscription_tier')

    if (verifyError) throw verifyError

    const afterCounts = afterStats.reduce((acc, user) => {
      acc[user.subscription_tier] = (acc[user.subscription_tier] || 0) + 1
      return acc
    }, {})

    console.table(afterCounts)
    console.log('')

    // 4. Show sample of upgraded users
    console.log('📋 Sample of Ultra users:')
    const { data: sampleUsers, error: sampleError } = await supabase
      .from('profiles')
      .select('id, email, name, subscription_tier, created_at')
      .eq('subscription_tier', 'ultra')
      .order('created_at', { ascending: false })
      .limit(10)

    if (sampleError) throw sampleError

    console.table(sampleUsers.map(u => ({
      email: u.email,
      name: u.name || '(no name)',
      tier: u.subscription_tier,
      created: new Date(u.created_at).toLocaleDateString()
    })))

    console.log('\n🎉 Migration completed successfully!')
    console.log('✨ All users can now access Zentones!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()
