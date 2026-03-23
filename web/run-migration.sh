#!/bin/bash

# Script to run the is_admin migration on Supabase
# This fixes the CRM user list not displaying

set -e

echo "🔧 Running migration: 20260321_fix_is_admin.sql"
echo ""

# Check if .env.production exists
if [ ! -f "../.env.production" ]; then
    echo "❌ Error: .env.production not found in project root"
    exit 1
fi

# Extract Supabase URL and service role key
source ../.env.production

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not set"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not set"
    exit 1
fi

# Extract project ID from URL (e.g., usujonswoxboxlysakcm from https://usujonswoxboxlysakcm.supabase.co)
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')

echo "📊 Project: $PROJECT_ID"
echo "🔗 URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Option 1: Run via Supabase CLI (if linked)
echo "Option 1: Run via Supabase CLI"
echo "-----------------------------"
echo "cd /home/haichu/tinnimate/web"
echo "supabase db push"
echo ""

# Option 2: Manual SQL via Dashboard
echo "Option 2: Run manually via Dashboard"
echo "------------------------------------"
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_ID/sql/new"
echo "2. Copy and paste the content of: supabase/migrations/20260321_fix_is_admin.sql"
echo "3. Click 'Run'"
echo ""

# Option 3: Direct SQL execution via psql
echo "Option 3: Run via psql (if you have postgres connection string)"
echo "----------------------------------------------------------------"
echo "psql 'postgresql://postgres:[YOUR-PASSWORD]@db.${PROJECT_ID}.supabase.co:5432/postgres' -f supabase/migrations/20260321_fix_is_admin.sql"
echo ""

echo "✅ After running migration, restart your Next.js dev server:"
echo "   npm run dev"
echo ""

# Ask user which option
read -p "Which option do you want? (1/2/3 or 'q' to quit): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Running supabase db push..."
        supabase db push
        echo "✅ Migration complete!"
        ;;
    2)
        echo ""
        echo "📋 Opening migration file..."
        cat supabase/migrations/20260321_fix_is_admin.sql
        echo ""
        echo "👉 Now go to: https://supabase.com/dashboard/project/$PROJECT_ID/sql/new"
        echo "   and paste the SQL above."
        ;;
    3)
        echo ""
        echo "⚠️  You need to provide the database password."
        echo "   Get it from: https://supabase.com/dashboard/project/$PROJECT_ID/settings/database"
        ;;
    q|Q)
        echo "Cancelled."
        exit 0
        ;;
    *)
        echo "Invalid option."
        exit 1
        ;;
esac
