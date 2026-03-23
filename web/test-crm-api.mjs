#!/usr/bin/env node

/**
 * Test CRM API endpoint to debug why users list is empty
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.production
config({ path: join(__dirname, '../.env.production') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

console.log('🔍 Testing CRM API Query')
console.log('📊 Project:', supabaseUrl)
console.log('')

async function testQuery() {
  try {
    // Test 1: Check if profiles table exists and has data
    console.log('1️⃣  Checking profiles table...')
    const { data: profiles, error: error1, count } = await supabase
      .from('profiles')
      .select('id, email, is_admin', { count: 'exact' })
      .limit(5)

    if (error1) {
      console.error('   ❌ Error:', error1.message)
      return
    }

    console.log(`   ✅ Found ${count} total profiles`)
    console.log('   First 5 profiles:')
    console.table(profiles)
    console.log('')

    // Test 2: Test exact query from API route
    console.log('2️⃣  Testing API route query (same as /api/admin/users)...')
    const { data: users, error: error2 } = await supabase
      .from('profiles')
      .select('id, name, email, subscription_tier, is_admin, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error2) {
      console.error('   ❌ Error:', error2.message)
      return
    }

    console.log(`   ✅ Found ${users.length} users`)
    console.log('   Users:')
    console.table(users?.map(u => ({
      email: u.email,
      is_admin: u.is_admin,
      tier: u.subscription_tier,
      created: u.created_at?.slice(0, 10)
    })))
    console.log('')

    // Test 3: Count by tier
    console.log('3️⃣  Counting by tier...')
    const [
      { count: total },
      { count: free },
      { count: premium },
      { count: pro },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'free'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'premium'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'pro'),
    ])

    console.log('   Stats:')
    console.log(`   - Total: ${total}`)
    console.log(`   - Free: ${free}`)
    console.log(`   - Premium: ${premium}`)
    console.log(`   - Pro: ${pro}`)
    console.log('')

    // Test 4: Check if columns exist
    console.log('4️⃣  Checking columns...')
    const { data: sample } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single()

    if (sample) {
      const columns = Object.keys(sample)
      console.log('   Available columns:')
      console.log('   ', columns.join(', '))
      console.log('')
      console.log('   Required columns check:')
      console.log('   - is_admin:', columns.includes('is_admin') ? '✅' : '❌ MISSING')
      console.log('   - admin_notes:', columns.includes('admin_notes') ? '✅' : '❌ MISSING')
      console.log('   - streak_count:', columns.includes('streak_count') ? '✅' : '❌ MISSING')
      console.log('   - last_checkin_date:', columns.includes('last_checkin_date') ? '✅' : '❌ MISSING')
    }
    console.log('')

    console.log('✅ Test complete!')
    console.log('')
    console.log('📋 Summary:')
    console.log(`   - Total profiles in DB: ${count}`)
    console.log(`   - Profiles with is_admin: ${profiles?.filter(p => p.is_admin).length}`)
    console.log(`   - API query returned: ${users?.length} users`)

  } catch (err) {
    console.error('❌ Test failed:', err.message)
    console.error(err)
  }
}

testQuery()
