'use client'

import Link from 'next/link'
import { useLangStore } from '@/stores/use-lang-store'

export default function TermsPage() {
  const { lang } = useLangStore()
  const isEn = lang === 'en'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 px-6 py-16 max-w-3xl mx-auto">
      <Link href="/" className="text-blue-400 text-sm hover:text-blue-300 transition-colors mb-8 block">
        ← {isEn ? 'Back to Home' : 'Về trang chủ'}
      </Link>

      <h1 className="text-3xl font-bold text-white mb-2">
        {isEn ? 'Terms of Service' : 'Điều Khoản Sử Dụng'}
      </h1>
      <p className="text-sm text-slate-500 mb-10">
        {isEn ? 'Last updated: March 19, 2026' : 'Cập nhật: 19 tháng 3, 2026'}
      </p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '1. Acceptance of Terms' : '1. Chấp nhận điều khoản'}
          </h2>
          <p>{isEn
            ? 'By accessing or using TinniMate, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the application.'
            : 'Bằng việc truy cập hoặc sử dụng TinniMate, bạn đồng ý tuân theo các Điều Khoản Sử Dụng và Chính Sách Bảo Mật. Nếu không đồng ý, vui lòng không sử dụng ứng dụng.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '2. Description of Service' : '2. Mô tả dịch vụ'}
          </h2>
          <p>{isEn
            ? 'TinniMate provides AI-powered tools for tinnitus management, including sound therapy, hearing assessments, cognitive behavioral therapy modules, and progress tracking. These tools are designed to support — not replace — professional medical care.'
            : 'TinniMate cung cấp công cụ AI hỗ trợ quản lý ù tai, bao gồm liệu pháp âm thanh, đánh giá thính lực, module trị liệu hành vi nhận thức, và theo dõi tiến triển. Các công cụ này hỗ trợ — không thay thế — chăm sóc y tế chuyên nghiệp.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3 text-amber-400">
            {isEn ? '3. Medical Disclaimer' : '3. Tuyên bố y tế'}
          </h2>
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p>{isEn
              ? 'TinniMate is NOT a medical device and has not been approved by the FDA, CE, or any regulatory body. It does not diagnose, treat, cure, or prevent any medical condition. The hearing test provides screening results only and is not a substitute for clinical audiometry. Always consult a qualified healthcare professional (ENT specialist, audiologist) for medical diagnosis and treatment.'
              : 'TinniMate KHÔNG PHẢI thiết bị y tế và chưa được FDA, CE, hoặc cơ quan quản lý nào phê duyệt. Ứng dụng không chẩn đoán, điều trị, chữa trị, hoặc phòng ngừa bất kỳ tình trạng y tế nào. Kiểm tra thính lực chỉ mang tính sàng lọc, không thay thế đo thính lực lâm sàng. Luôn tham vấn bác sĩ chuyên khoa (TMH, thính học) để chẩn đoán và điều trị.'}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '4. User Accounts' : '4. Tài khoản người dùng'}
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>{isEn ? 'You must provide accurate information when creating an account' : 'Bạn phải cung cấp thông tin chính xác khi tạo tài khoản'}</li>
            <li>{isEn ? 'You are responsible for maintaining the security of your account' : 'Bạn chịu trách nhiệm bảo mật tài khoản'}</li>
            <li>{isEn ? 'You must be at least 13 years old to use TinniMate' : 'Bạn phải từ 13 tuổi trở lên để sử dụng TinniMate'}</li>
            <li>{isEn ? 'We may suspend or terminate accounts that violate these terms' : 'Chúng tôi có thể tạm ngừng hoặc chấm dứt tài khoản vi phạm điều khoản'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '5. Subscription & Payments' : '5. Gói đăng ký & Thanh toán'}
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>{isEn ? 'Free tier includes limited daily interactions' : 'Gói miễn phí bao gồm giới hạn tương tác hàng ngày'}</li>
            <li>{isEn ? 'Premium and Pro subscriptions are billed monthly' : 'Gói Premium và Pro thanh toán hàng tháng'}</li>
            <li>{isEn ? 'Subscriptions auto-renew unless cancelled 24 hours before the renewal date' : 'Gói tự động gia hạn nếu không hủy trước 24 giờ'}</li>
            <li>{isEn ? 'Refunds are handled according to the platform\'s (Apple/Google) refund policy' : 'Hoàn tiền theo chính sách của nền tảng (Apple/Google)'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '6. Acceptable Use' : '6. Sử dụng chấp nhận được'}
          </h2>
          <p className="mb-2">{isEn ? 'You agree NOT to:' : 'Bạn đồng ý KHÔNG:'}</p>
          <ul className="list-disc list-inside space-y-2">
            <li>{isEn ? 'Use TinniMate for any unlawful purpose' : 'Sử dụng TinniMate cho mục đích bất hợp pháp'}</li>
            <li>{isEn ? 'Attempt to reverse engineer or copy the application' : 'Cố gắng dịch ngược hoặc sao chép ứng dụng'}</li>
            <li>{isEn ? 'Share your account with others or create multiple accounts' : 'Chia sẻ tài khoản hoặc tạo nhiều tài khoản'}</li>
            <li>{isEn ? 'Abuse the AI chat system with harmful or inappropriate content' : 'Lạm dụng hệ thống AI chat với nội dung có hại'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '7. Intellectual Property' : '7. Sở hữu trí tuệ'}
          </h2>
          <p>{isEn
            ? 'All content, design, code, sounds, and AI models in TinniMate are the intellectual property of VuiNghe and are protected by copyright law. You may not reproduce, distribute, or create derivative works without written permission.'
            : 'Tất cả nội dung, thiết kế, mã nguồn, âm thanh, và mô hình AI trong TinniMate là sở hữu trí tuệ của VuiNghe và được bảo vệ bởi luật bản quyền. Bạn không được sao chép, phân phối, hoặc tạo tác phẩm phái sinh mà không có sự cho phép bằng văn bản.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '8. Limitation of Liability' : '8. Giới hạn trách nhiệm'}
          </h2>
          <p>{isEn
            ? 'TinniMate is provided "as is" without warranties of any kind. We are not liable for any damages arising from use of the application, including but not limited to health outcomes, data loss, or service interruptions. Your use of TinniMate is at your own risk.'
            : 'TinniMate được cung cấp "nguyên trạng" mà không có bất kỳ bảo đảm nào. Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc sử dụng, bao gồm kết quả sức khỏe, mất dữ liệu, hoặc gián đoạn dịch vụ. Bạn sử dụng TinniMate với rủi ro tự chịu.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '9. Changes to Terms' : '9. Thay đổi điều khoản'}
          </h2>
          <p>{isEn
            ? 'We may modify these terms at any time. Significant changes will be notified via the app or email. Continued use after changes constitutes acceptance.'
            : 'Chúng tôi có thể sửa đổi điều khoản bất kỳ lúc nào. Thay đổi quan trọng sẽ được thông báo qua ứng dụng hoặc email. Tiếp tục sử dụng sau thay đổi nghĩa là chấp nhận.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '10. Governing Law' : '10. Luật áp dụng'}
          </h2>
          <p>{isEn
            ? 'These terms are governed by the laws of Vietnam. Any disputes will be resolved in the courts of Ho Chi Minh City, Vietnam.'
            : 'Các điều khoản này được điều chỉnh bởi luật pháp Việt Nam. Mọi tranh chấp sẽ được giải quyết tại tòa án TP. Hồ Chí Minh.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            {isEn ? '11. Contact' : '11. Liên hệ'}
          </h2>
          <p className="mt-2 text-white">
            📧 support@vuinghe.com<br />
            🌐 tinnitus.vuinghe.com
          </p>
        </section>
      </div>

      <div className="mt-12 flex gap-4 text-xs text-slate-500">
        <Link href="/privacy" className="hover:text-blue-400 transition-colors">
          {isEn ? 'Privacy Policy' : 'Chính sách bảo mật'}
        </Link>
      </div>

      <div className="mt-16 pt-8 border-t border-white/5 text-center text-xs text-slate-600">
        © 2026 TinniMate by VuiNghe. All rights reserved.
      </div>
    </div>
  )
}
