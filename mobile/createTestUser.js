const { createClient } = require('@supabase/supabase-js');

// Using Service Role Key to bypass email confirmation
const supabase = createClient(
  'https://usujonswoxboxlysakcm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzdWpvbnN3b3hib3hseXNha2NtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA2MTgwMSwiZXhwIjoyMDg4NjM3ODAxfQ.fUWkx7D8OTVarffm2SOeNCkGeiznPGvNxk9C-wwvl_E'
);

async function createTestUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@tinnimate.com',
    password: 'password123',
    email_confirm: true // Auto-confirm email
  });
  
  if (error) {
    if (error.message.includes("already registered")) {
        console.log("Tài khoản đã tồn tại: test@tinnimate.com");
    } else {
        console.error('Lỗi tạo tài khoản:', error.message);
    }
  } else {
    console.log('Tạo thành công:', data.user.email);
  }
}

createTestUser();
