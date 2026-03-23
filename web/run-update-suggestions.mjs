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

const supabase = createClient(supabaseUrl, supabaseKey);

async function runUpdates() {
  console.log('🔄 Updating suggestion templates...\n');

  const updates = [
    { old: '📋 Đánh giá mức độ ù tai (THI)', new_vi: 'Làm bài đánh giá THI để biết mức độ ù tai của mình', new_en: 'Do the THI assessment to know my tinnitus severity' },
    { old: '👂 Kiểm tra thính lực', new_vi: 'Tôi muốn kiểm tra thính lực', new_en: 'I want to take a hearing test' },
    { old: '😊 Đánh giá tâm trạng (PHQ-9)', new_vi: 'Đánh giá tâm trạng của tôi (PHQ-9)', new_en: 'Assess my mood (PHQ-9)' },
    { old: '🎧 Nghe âm thanh trị liệu white noise', new_vi: 'Bật âm thanh white noise giúp tôi', new_en: 'Play white noise to help me' },
    { old: '🌊 Nghe tiếng sóng biển thư giãn', new_vi: 'Cho tôi nghe tiếng sóng biển', new_en: 'Let me listen to ocean sounds' },
    { old: '🧘 Bài tập hít thở sâu 5 phút', new_vi: 'Hướng dẫn tôi bài tập hít thở', new_en: 'Guide me through breathing exercises' },
    { old: '🎵 Nghe nhạc 528Hz chữa lành', new_vi: 'Phát nhạc 528Hz cho tôi nghe', new_en: 'Play 528Hz healing music for me' },
    { old: '💊 Ù tai hôm nay thế nào?', new_vi: 'Hôm nay ù tai của tôi như thế này', new_en: 'Here is how my tinnitus is today' },
    { old: '😌 Tâm trạng của bạn ra sao?', new_vi: 'Tâm trạng của tôi hôm nay...', new_en: 'My mood today is...' },
    { old: '📝 Ghi nhật ký triệu chứng', new_vi: 'Ghi lại triệu chứng hôm nay', new_en: 'Log my symptoms today' },
    { old: '📊 Xem tiến triển tuần này', new_vi: 'Cho tôi xem tiến triển tuần này', new_en: 'Show me this week\'s progress' },
    { old: '🏆 Xem thành tích của bạn', new_vi: 'Tôi muốn xem thành tích của mình', new_en: 'I want to see my achievements' },
    { old: '📈 So sánh điểm THI qua các tháng', new_vi: 'So sánh điểm THI của tôi qua thời gian', new_en: 'Compare my THI scores over time' },
    { old: '📚 Tìm hiểu về ù tai', new_vi: 'Ù tai là gì và tại sao tôi bị?', new_en: 'What is tinnitus and why do I have it?' },
    { old: '💡 Mẹo giảm ù tai trong cuộc sống', new_vi: 'Có cách nào giảm ù tai không?', new_en: 'Are there ways to reduce tinnitus?' },
    { old: '🔬 Nghiên cứu mới về điều trị ù tai', new_vi: 'Có nghiên cứu mới về điều trị ù tai không?', new_en: 'Any new research on tinnitus treatment?' },
    { old: '💙 Cần hỗ trợ? Tôi luôn ở đây', new_vi: 'Tôi cần hỗ trợ về ù tai', new_en: 'I need help with my tinnitus' },
    { old: '🌟 Bạn đang làm rất tốt!', new_vi: 'Cho tôi lời khuyên động viên', new_en: 'Give me some encouragement' },
    { old: '🤝 Kết nối với cộng đồng', new_vi: 'Làm sao để kết nối với người cùng cảnh ngộ?', new_en: 'How can I connect with others like me?' },
  ];

  for (const update of updates) {
    const { error } = await supabase
      .from('suggestion_templates')
      .update({ text_vi: update.new_vi, text_en: update.new_en })
      .eq('text_vi', update.old);

    if (error) {
      console.log(`⚠️  ${update.old}: ${error.message}`);
    } else {
      console.log(`✅ Updated: ${update.old}`);
    }
  }

  console.log('\n✅ All updates completed!');
  
  // Verify
  const { data } = await supabase
    .from('suggestion_templates')
    .select('text_vi')
    .limit(3);
  
  console.log('\n📝 Sample results:');
  data?.forEach(t => console.log(`  - ${t.text_vi}`));
}

runUpdates().catch(console.error);
