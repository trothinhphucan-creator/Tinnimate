export interface BlogPost {
  slug: string
  title: string
  titleVi: string
  excerpt: string
  excerptVi: string
  content: string
  contentVi: string
  category: 'basics' | 'therapy' | 'wellness' | 'science'
  emoji: string
  readTime: number
  date: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'what-is-tinnitus',
    title: 'What Is Tinnitus? A Complete Guide',
    titleVi: 'Ù Tai Là Gì? Hướng Dẫn Toàn Diện',
    excerpt: 'Understanding the phantom sounds in your ears and what causes them.',
    excerptVi: 'Tìm hiểu về âm thanh ảo trong tai bạn và nguyên nhân gây ra chúng.',
    emoji: '🔔',
    category: 'basics',
    readTime: 5,
    date: '2025-03-01',
    content: `## What Is Tinnitus?

Tinnitus is the perception of sound when no external sound is present. It's often described as ringing, buzzing, hissing, or clicking in the ears.

### Key Facts
- **Prevalence**: 10-15% of adults experience chronic tinnitus
- **Not a disease**: Tinnitus is a symptom, not a condition itself
- **Brain-based**: Modern research shows tinnitus originates in the brain, not the ears

### Common Causes
1. **Noise exposure** — Loud music, machinery, headphones
2. **Age-related hearing loss** — Most common cause after age 50
3. **Ear infections or blockage** — Temporary tinnitus from earwax or fluid
4. **Medications** — Some drugs are "ototoxic" (harmful to hearing)
5. **Stress and anxiety** — Can trigger or worsen tinnitus

### When to See a Doctor
- Tinnitus in only one ear
- Pulsing sound that matches your heartbeat
- Sudden hearing loss with tinnitus
- Tinnitus after a head injury

### Living with Tinnitus
The good news: most tinnitus can be managed effectively with:
- Sound therapy
- Cognitive behavioral therapy (CBT)
- Relaxation techniques
- Healthy sleep habits`,
    contentVi: `## Ù Tai Là Gì?

Ù tai là hiện tượng nghe thấy âm thanh khi không có nguồn âm bên ngoài. Thường được mô tả là tiếng rít, vo ve, rì rì hoặc tiếng click trong tai.

### Những Điều Cần Biết
- **Tỷ lệ**: 10-15% người lớn trải qua ù tai mãn tính
- **Không phải bệnh**: Ù tai là triệu chứng, không phải bệnh lý
- **Từ não bộ**: Nghiên cứu hiện đại cho thấy ù tai xuất phát từ não, không phải tai

### Nguyên Nhân Phổ Biến
1. **Tiếp xúc tiếng ồn** — Nhạc lớn, máy móc, tai nghe
2. **Mất thính lực do tuổi** — Nguyên nhân phổ biến nhất sau 50 tuổi
3. **Nhiễm trùng hoặc tắc tai** — Ù tai tạm thời do ráy tai hoặc dịch
4. **Thuốc** — Một số thuốc có hại cho thính giác
5. **Stress và lo âu** — Có thể gây ra hoặc làm nặng ù tai

### Khi Nào Cần Gặp Bác Sĩ
- Ù tai chỉ một bên
- Âm thanh nhịp theo nhịp tim
- Mất thính lực đột ngột kèm ù tai
- Ù tai sau chấn thương đầu

### Sống Chung Với Ù Tai
Tin tốt: phần lớn ù tai có thể kiểm soát hiệu quả bằng:
- Liệu pháp âm thanh
- Liệu pháp nhận thức hành vi (CBT)
- Kỹ thuật thư giãn
- Thói quen ngủ lành mạnh`,
  },
  {
    slug: 'sound-therapy-guide',
    title: 'Sound Therapy for Tinnitus: How It Works',
    titleVi: 'Liệu Pháp Âm Thanh Cho Ù Tai: Cách Hoạt Động',
    excerpt: 'Learn how different sounds can reduce the perception of tinnitus.',
    excerptVi: 'Tìm hiểu cách các loại âm thanh giảm cảm nhận ù tai.',
    emoji: '🎧',
    category: 'therapy',
    readTime: 4,
    date: '2025-03-05',
    content: `## How Sound Therapy Works

Sound therapy is one of the most effective ways to manage tinnitus. It works by:
1. **Masking** — External sounds cover up the tinnitus
2. **Habituation** — Your brain learns to ignore the tinnitus over time
3. **Neuroplasticity** — Sound stimulation helps rewire neural pathways

### Types of Sound Therapy

#### White, Pink & Brown Noise
- **White noise**: Equal energy across all frequencies — good for high-pitched tinnitus
- **Pink noise**: More bass, less treble — sounds more natural
- **Brown noise**: Deep, rumbling — excellent for sleep

#### Nature Sounds
Rain, ocean waves, birds — these complex sounds engage your auditory system naturally.

#### Binaural Beats
Two slightly different frequencies in each ear create a perceived "beat" frequency. Alpha (10 Hz) for relaxation, theta (6 Hz) for meditation, delta (2 Hz) for sleep.

#### Notch Therapy
A specialized technique that filters OUT your specific tinnitus frequency from broadband noise. Research shows this can reduce tinnitus loudness by up to 25% over 12 months.

### Best Practices
- Listen at a volume **just below** your tinnitus level
- Use for 2-8 hours daily for best results
- Consistency matters more than volume
- Try different sounds to find what works for you`,
    contentVi: `## Liệu Pháp Âm Thanh Hoạt Động Thế Nào

Liệu pháp âm thanh là một trong những cách hiệu quả nhất để quản lý ù tai:
1. **Che lấp** — Âm thanh bên ngoài che đi tiếng ù tai
2. **Thích nghi** — Não học cách bỏ qua ù tai theo thời gian
3. **Dẻo thần kinh** — Kích thích âm thanh giúp tái cấu trúc đường thần kinh

### Các Loại Liệu Pháp

#### Tiếng Ồn Trắng, Hồng & Nâu
- **Ồn trắng**: Năng lượng đều — tốt cho ù tai tần số cao
- **Ồn hồng**: Nhiều bass hơn — nghe tự nhiên hơn
- **Ồn nâu**: Trầm sâu — tuyệt vời cho giấc ngủ

#### Âm Thanh Thiên Nhiên
Mưa, sóng biển, chim — âm thanh phức tạp kích thích hệ thính giác tự nhiên.

#### Nhịp Nhị Tai (Binaural Beats)
Hai tần số hơi khác nhau ở mỗi tai tạo nhịp "ảo". Alpha (10 Hz) thư giãn, theta (6 Hz) thiền, delta (2 Hz) ngủ.

#### Liệu Pháp Lọc Âm (Notch Therapy)
Kỹ thuật chuyên biệt lọc BỎ tần số ù tai từ tiếng ồn. Nghiên cứu cho thấy giảm ù tai đến 25% sau 12 tháng.

### Lời Khuyên
- Nghe ở mức **vừa dưới** mức ù tai
- Sử dụng 2-8 giờ/ngày để có kết quả tốt nhất
- Kiên trì quan trọng hơn âm lượng
- Thử nhiều loại âm thanh để tìm phù hợp`,
  },
  {
    slug: 'cbti-tinnitus',
    title: 'CBT-i: Cognitive Therapy for Tinnitus & Insomnia',
    titleVi: 'CBT-i: Liệu Pháp Nhận Thức Cho Ù Tai & Mất Ngủ',
    excerpt: 'How cognitive behavioral therapy helps manage tinnitus-related sleep problems.',
    excerptVi: 'Liệu pháp nhận thức hành vi giúp quản lý mất ngủ do ù tai.',
    emoji: '🧠',
    category: 'wellness',
    readTime: 6,
    date: '2025-03-10',
    content: `## CBT-i for Tinnitus

Cognitive Behavioral Therapy for Insomnia (CBT-i) is the gold standard treatment for insomnia — and it's especially effective for tinnitus-related sleep problems.

### The Tinnitus-Sleep Cycle
1. Tinnitus makes it hard to fall asleep
2. Poor sleep increases stress and anxiety
3. Stress makes tinnitus louder
4. The cycle repeats

### CBT-i Techniques

#### 1. Sleep Restriction
Limit time in bed to match actual sleep time. This builds "sleep pressure" and improves sleep efficiency.

#### 2. Stimulus Control
- Use bed ONLY for sleep (not scrolling, watching TV)
- If awake for 20+ minutes, get up and do something calming
- Go to bed only when truly sleepy

#### 3. Cognitive Restructuring
Challenge unhelpful thoughts about sleep:
- ❌ "I'll never sleep with this ringing"
- ✅ "My tinnitus is manageable, and I've slept before"

#### 4. Relaxation Training
- Progressive muscle relaxation
- Guided imagery
- Breathing exercises (4-7-8 technique)

#### 5. Sleep Hygiene
- Consistent sleep/wake times
- Cool, dark bedroom
- No caffeine after 2 PM
- Use sound therapy at bedtime

### Evidence
Research shows CBT-i reduces tinnitus distress by 40-60% and improves sleep quality significantly within 4-6 weeks.`,
    contentVi: `## CBT-i Cho Ù Tai

Liệu pháp Nhận thức Hành vi cho Mất ngủ (CBT-i) là tiêu chuẩn vàng điều trị mất ngủ — đặc biệt hiệu quả cho mất ngủ do ù tai.

### Vòng Xoáy Ù Tai - Mất Ngủ
1. Ù tai khiến khó ngủ
2. Ngủ kém tăng stress và lo âu
3. Stress làm ù tai to hơn
4. Chu kỳ lặp lại

### Kỹ Thuật CBT-i

#### 1. Hạn Chế Giấc Ngủ
Giới hạn thời gian trên giường bằng thời gian ngủ thực tế. Tạo "áp lực ngủ" và cải thiện hiệu quả giấc ngủ.

#### 2. Kiểm Soát Kích Thích
- Dùng giường CHỈ để ngủ
- Nếu thức 20+ phút, dậy làm gì đó nhẹ nhàng
- Chỉ lên giường khi thực sự buồn ngủ

#### 3. Tái Cấu Trúc Nhận Thức
Thách thức suy nghĩ tiêu cực:
- ❌ "Tôi không bao giờ ngủ được với tiếng ù"
- ✅ "Ù tai có thể kiểm soát, tôi đã ngủ được trước đây"

#### 4. Huấn Luyện Thư Giãn
- Thư giãn cơ tiến triển
- Hình dung có hướng dẫn
- Bài tập thở (kỹ thuật 4-7-8)

#### 5. Vệ Sinh Giấc Ngủ
- Giờ ngủ/dậy cố định
- Phòng mát, tối
- Không caffeine sau 2 PM
- Dùng âm thanh trị liệu khi ngủ

### Bằng Chứng
Nghiên cứu cho thấy CBT-i giảm 40-60% khó chịu do ù tai và cải thiện đáng kể chất lượng giấc ngủ trong 4-6 tuần.`,
  },
  {
    slug: 'hearing-loss-tinnitus',
    title: '70% of Tinnitus Cases Involve Hearing Loss',
    titleVi: '70% Người Ù Tai Bị Nghe Kém',
    excerpt: 'The critical link between tinnitus and hearing loss, and why testing matters.',
    excerptVi: 'Mối liên hệ quan trọng giữa ù tai và nghe kém, và tại sao cần kiểm tra thính lực.',
    emoji: '👂',
    category: 'science',
    readTime: 4,
    date: '2025-03-15',
    content: `## The Tinnitus-Hearing Loss Connection

Research consistently shows that approximately 70% of people with tinnitus also have some degree of hearing loss — often undetected.

### Why Are They Connected?
When hair cells in the cochlea are damaged, the brain "fills in" missing frequencies with phantom sounds — tinnitus.

### The Importance of Testing
- Many people don't realize they have hearing loss
- Early detection leads to better outcomes
- Hearing aids can reduce tinnitus in 60% of cases

### Test Your Hearing
We recommend getting a professional hearing test. You can start with our online screening at [hearingtest.vuinghe.com](https://hearingtest.vuinghe.com).

### Treatment Options
1. **Hearing aids** — Amplify external sounds, reducing tinnitus perception
2. **Combined devices** — Hearing aids + built-in sound therapy
3. **Sound therapy** — For those without significant hearing loss`,
    contentVi: `## Mối Liên Hệ Ù Tai - Nghe Kém

Nghiên cứu cho thấy khoảng 70% người ù tai cũng bị nghe kém ở mức độ nào đó — thường không phát hiện.

### Tại Sao Chúng Liên Quan?
Khi tế bào lông trong ốc tai bị tổn thương, não "bù" các tần số thiếu bằng âm thanh ảo — ù tai.

### Tầm Quan Trọng Của Kiểm Tra
- Nhiều người không biết mình nghe kém
- Phát hiện sớm cho kết quả tốt hơn
- Máy trợ thính giảm ù tai trong 60% trường hợp

### Kiểm Tra Thính Lực
Chúng tôi khuyến nghị kiểm tra thính lực chuyên nghiệp. Bạn có thể bắt đầu với bài kiểm tra trực tuyến tại [hearingtest.vuinghe.com](https://hearingtest.vuinghe.com).

### Phương Pháp Điều Trị
1. **Máy trợ thính** — Khuếch đại âm thanh bên ngoài, giảm cảm nhận ù tai
2. **Thiết bị kết hợp** — Trợ thính + liệu pháp âm thanh
3. **Liệu pháp âm thanh** — Cho người không nghe kém đáng kể`,
  },
]
