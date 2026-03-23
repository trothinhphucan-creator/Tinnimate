-- Update suggestion templates to be USER QUESTIONS instead of BOT ACTIONS

UPDATE suggestion_templates SET
  text_vi = 'Làm bài đánh giá THI để biết mức độ ù tai của mình',
  text_en = 'Do the THI assessment to know my tinnitus severity'
WHERE text_vi = '📋 Đánh giá mức độ ù tai (THI)';

UPDATE suggestion_templates SET
  text_vi = 'Tôi muốn kiểm tra thính lực',
  text_en = 'I want to take a hearing test'
WHERE text_vi = '👂 Kiểm tra thính lực';

UPDATE suggestion_templates SET
  text_vi = 'Đánh giá tâm trạng của tôi (PHQ-9)',
  text_en = 'Assess my mood (PHQ-9)'
WHERE text_vi = '😊 Đánh giá tâm trạng (PHQ-9)';

UPDATE suggestion_templates SET
  text_vi = 'Bật âm thanh white noise giúp tôi',
  text_en = 'Play white noise to help me'
WHERE text_vi = '🎧 Nghe âm thanh trị liệu white noise';

UPDATE suggestion_templates SET
  text_vi = 'Cho tôi nghe tiếng sóng biển',
  text_en = 'Let me listen to ocean sounds'
WHERE text_vi = '🌊 Nghe tiếng sóng biển thư giãn';

UPDATE suggestion_templates SET
  text_vi = 'Hướng dẫn tôi bài tập hít thở',
  text_en = 'Guide me through breathing exercises'
WHERE text_vi = '🧘 Bài tập hít thở sâu 5 phút';

UPDATE suggestion_templates SET
  text_vi = 'Phát nhạc 528Hz cho tôi nghe',
  text_en = 'Play 528Hz healing music for me'
WHERE text_vi = '🎵 Nghe nhạc 528Hz chữa lành';

UPDATE suggestion_templates SET
  text_vi = 'Hôm nay ù tai của tôi như thế này',
  text_en = 'Here is how my tinnitus is today'
WHERE text_vi = '💊 Ù tai hôm nay thế nào?';

UPDATE suggestion_templates SET
  text_vi = 'Tâm trạng của tôi hôm nay...',
  text_en = 'My mood today is...'
WHERE text_vi = '😌 Tâm trạng của bạn ra sao?';

UPDATE suggestion_templates SET
  text_vi = 'Ghi lại triệu chứng hôm nay',
  text_en = 'Log my symptoms today'
WHERE text_vi = '📝 Ghi nhật ký triệu chứng';

UPDATE suggestion_templates SET
  text_vi = 'Cho tôi xem tiến triển tuần này',
  text_en = 'Show me this week''s progress'
WHERE text_vi = '📊 Xem tiến triển tuần này';

UPDATE suggestion_templates SET
  text_vi = 'Tôi muốn xem thành tích của mình',
  text_en = 'I want to see my achievements'
WHERE text_vi = '🏆 Xem thành tích của bạn';

UPDATE suggestion_templates SET
  text_vi = 'So sánh điểm THI của tôi qua thời gian',
  text_en = 'Compare my THI scores over time'
WHERE text_vi = '📈 So sánh điểm THI qua các tháng';

UPDATE suggestion_templates SET
  text_vi = 'Ù tai là gì và tại sao tôi bị?',
  text_en = 'What is tinnitus and why do I have it?'
WHERE text_vi = '📚 Tìm hiểu về ù tai';

UPDATE suggestion_templates SET
  text_vi = 'Có cách nào giảm ù tai không?',
  text_en = 'Are there ways to reduce tinnitus?'
WHERE text_vi = '💡 Mẹo giảm ù tai trong cuộc sống';

UPDATE suggestion_templates SET
  text_vi = 'Có nghiên cứu mới về điều trị ù tai không?',
  text_en = 'Any new research on tinnitus treatment?'
WHERE text_vi = '🔬 Nghiên cứu mới về điều trị ù tai';

UPDATE suggestion_templates SET
  text_vi = 'Tôi cần hỗ trợ về ù tai',
  text_en = 'I need help with my tinnitus'
WHERE text_vi = '💙 Cần hỗ trợ? Tôi luôn ở đây';

UPDATE suggestion_templates SET
  text_vi = 'Cho tôi lời khuyên động viên',
  text_en = 'Give me some encouragement'
WHERE text_vi = '🌟 Bạn đang làm rất tốt!';

UPDATE suggestion_templates SET
  text_vi = 'Làm sao để kết nối với người cùng cảnh ngộ?',
  text_en = 'How can I connect with others like me?'
WHERE text_vi = '🤝 Kết nối với cộng đồng';
