'use client'

import Link from 'next/link'
import { useLangStore } from '@/stores/use-lang-store'

export default function PrivacyPage() {
  const { lang } = useLangStore()
  const isEn = lang === 'en'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 px-6 py-16 max-w-3xl mx-auto">
      <Link href="/" className="text-blue-400 text-sm hover:text-blue-300 transition-colors mb-8 block">
        ← {isEn ? 'Back to Home' : 'Về trang chủ'}
      </Link>

      <h1 className="text-3xl font-bold text-white mb-2">
        {isEn ? 'Privacy Policy' : 'Chính Sách Bảo Mật'}
      </h1>
      <p className="text-sm text-slate-500 mb-10">
        {isEn ? 'Last updated: March 19, 2026' : 'Cập nhật: 19 tháng 3, 2026'}
      </p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '1. Introduction' : '1. Giới thiệu'}
          </h2>
          <p>
            {isEn
              ? 'TinniMate ("we", "our", "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal data when you use our application.'
              : 'TinniMate ("chúng tôi") cam kết bảo vệ quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu cá nhân khi bạn sử dụng ứng dụng.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '2. Data We Collect' : '2. Dữ liệu chúng tôi thu thập'}
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>{isEn ? 'Account Data' : 'Tài khoản'}:</strong> {isEn ? 'Email address, display name' : 'Địa chỉ email, tên hiển thị'}</li>
            <li><strong>{isEn ? 'Health Data' : 'Dữ liệu sức khỏe'}:</strong> {isEn ? 'Tinnitus severity ratings, mood check-ins, sleep quality scores, hearing test results (processed locally)' : 'Đánh giá mức ù tai, check-in tâm trạng, chất lượng giấc ngủ, kết quả kiểm tra thính lực (xử lý tại máy)'}</li>
            <li><strong>{isEn ? 'Chat Data' : 'Dữ liệu chat'}:</strong> {isEn ? 'Conversations with Tinni AI (used to provide personalized support)' : 'Hội thoại với Tinni AI (dùng để cung cấp hỗ trợ cá nhân hóa)'}</li>
            <li><strong>{isEn ? 'Usage Data' : 'Dữ liệu sử dụng'}:</strong> {isEn ? 'Therapy session duration, feature usage patterns' : 'Thời lượng phiên trị liệu, cách sử dụng tính năng'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '3. How We Use Your Data' : '3. Cách sử dụng dữ liệu'}
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>{isEn ? 'Provide and improve our services' : 'Cung cấp và cải thiện dịch vụ'}</li>
            <li>{isEn ? 'Personalize your therapy experience' : 'Cá nhân hóa trải nghiệm trị liệu'}</li>
            <li>{isEn ? 'Track your progress over time' : 'Theo dõi tiến triển theo thời gian'}</li>
            <li>{isEn ? 'Generate AI-powered recommendations' : 'Tạo gợi ý bằng AI'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '4. Data Storage & Security' : '4. Lưu trữ & Bảo mật'}
          </h2>
          <p>
            {isEn
              ? 'Your data is stored securely on Supabase servers with encryption at rest and in transit (TLS 1.3). We follow industry-standard security practices. Hearing test audio is processed entirely on your device and is never uploaded.'
              : 'Dữ liệu được lưu trữ an toàn trên máy chủ Supabase với mã hóa khi lưu và khi truyền (TLS 1.3). Chúng tôi tuân theo tiêu chuẩn bảo mật ngành. Âm thanh kiểm tra thính lực được xử lý hoàn toàn trên thiết bị, không bao giờ tải lên.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '5. Data Sharing' : '5. Chia sẻ dữ liệu'}
          </h2>
          <p>
            {isEn
              ? 'We do NOT sell, trade, or share your personal data with third parties. We may use anonymized, aggregated data for research and improvement purposes. AI conversations are processed via Google Gemini API with data handling governed by their privacy policy.'
              : 'Chúng tôi KHÔNG bán, trao đổi hoặc chia sẻ dữ liệu cá nhân với bên thứ ba. Chúng tôi có thể sử dụng dữ liệu ẩn danh, tổng hợp cho mục đích nghiên cứu. Hội thoại AI được xử lý qua Google Gemini API theo chính sách bảo mật của họ.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '6. Your Rights' : '6. Quyền của bạn'}
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>{isEn ? 'Access' : 'Truy cập'}:</strong> {isEn ? 'View all your stored data anytime in the Profile section' : 'Xem tất cả dữ liệu trong mục Hồ sơ'}</li>
            <li><strong>{isEn ? 'Delete' : 'Xóa'}:</strong> {isEn ? 'Request complete data deletion from Profile → Delete Account' : 'Yêu cầu xóa toàn bộ dữ liệu trong Hồ sơ → Xóa tài khoản'}</li>
            <li><strong>{isEn ? 'Export' : 'Xuất'}:</strong> {isEn ? 'Export your health data in standard formats' : 'Xuất dữ liệu sức khỏe theo định dạng chuẩn'}</li>
            <li><strong>{isEn ? 'Opt-out' : 'Từ chối'}:</strong> {isEn ? 'Opt out of any data collection by deleting your account' : 'Từ chối thu thập dữ liệu bằng cách xóa tài khoản'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '7. Cookies' : '7. Cookie'}
          </h2>
          <p>
            {isEn
              ? 'We use essential cookies only for authentication and session management. We do not use advertising or tracking cookies.'
              : 'Chúng tôi chỉ dùng cookie thiết yếu cho xác thực và quản lý phiên. Không sử dụng cookie quảng cáo hoặc theo dõi.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '8. Medical Disclaimer' : '8. Tuyên bố y tế'}
          </h2>
          <p className="text-amber-400/80">
            {isEn
              ? 'TinniMate is NOT a medical device and is not intended to diagnose, treat, cure, or prevent any disease. It provides supportive tools based on published clinical research. Always consult a qualified healthcare professional (ENT specialist, audiologist) for medical advice.'
              : 'TinniMate KHÔNG PHẢI thiết bị y tế và không dùng để chẩn đoán, điều trị, chữa trị hoặc phòng ngừa bệnh. Ứng dụng cung cấp công cụ hỗ trợ dựa trên nghiên cứu lâm sàng. Luôn tham vấn bác sĩ chuyên khoa (TMH, thính học) cho tư vấn y tế.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '9. Children' : '9. Trẻ em'}
          </h2>
          <p>
            {isEn
              ? 'TinniMate is not intended for children under 13. We do not knowingly collect data from children.'
              : 'TinniMate không dành cho trẻ dưới 13 tuổi. Chúng tôi không cố ý thu thập dữ liệu từ trẻ em.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '10. Contact' : '10. Liên hệ'}
          </h2>
          <p>
            {isEn
              ? 'For privacy questions or data requests, contact us at:'
              : 'Câu hỏi về bảo mật hoặc yêu cầu dữ liệu, liên hệ:'}
          </p>
          <p className="mt-2 text-white">
            📧 privacy@vuinghe.com<br />
            🌐 tinnitus.vuinghe.com
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '11. Changes to This Policy' : '11. Thay đổi chính sách'}
          </h2>
          <p>
            {isEn
              ? 'We may update this policy from time to time. We will notify you of any significant changes via the app or email. Continued use of TinniMate after changes constitutes acceptance of the updated policy.'
              : 'Chúng tôi có thể cập nhật chính sách theo thời gian. Chúng tôi sẽ thông báo thay đổi quan trọng qua ứng dụng hoặc email. Tiếp tục sử dụng TinniMate sau thay đổi nghĩa là chấp nhận chính sách mới.'}
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-white/5 text-center text-xs text-slate-600">
        © 2026 TinniMate by VuiNghe. All rights reserved.
      </div>
    </div>
  )
}
