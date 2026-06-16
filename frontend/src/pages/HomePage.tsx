import { useNavigate } from 'react-router-dom';
import {
  Users,
  BarChart2,
  ClipboardList,
  ShieldCheck,
  ArrowRight,
  Star,
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '4', label: 'Vai trò người dùng' },
  { value: '100%', label: 'Kiểm soát điểm số' },
  { value: 'JWT', label: 'Xác thực bảo mật' },
  { value: '∞', label: 'Nhật ký kiểm toán' },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Quản lý học viên',
    body: 'Hồ sơ đầy đủ, phân nhóm linh hoạt, theo dõi trạng thái phê duyệt từng học viên.',
    accent: 'pale-green',
  },
  {
    icon: BarChart2,
    title: 'Dashboard điểm số',
    body: 'Biểu đồ theo tuần, bảng xếp hạng nhóm, so sánh điểm trực quan.',
    accent: 'pale-blue',
  },
  {
    icon: ClipboardList,
    title: 'Nhật ký bất biến',
    body: 'Mỗi thay đổi điểm đều được ghi lại vĩnh viễn — không thể chỉnh sửa hay xóa.',
    accent: 'pale-yellow',
  },
  {
    icon: ShieldCheck,
    title: 'Phân quyền 4 tầng',
    body: 'Admin, Teacher, Group Leader, Student — mỗi vai trò thấy đúng những gì họ cần.',
    accent: 'pale-red',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Hệ thống rất gọn gàng, tôi không cần giải thích nhiều cho học viên.',
    name: 'Nguyễn Văn A',
    role: 'Giảng viên · Lớp Java Backend',
  },
  {
    quote: 'Tôi thấy điểm của mình thay đổi ngay lập tức, rất minh bạch.',
    name: 'Trần Thị B',
    role: 'Học viên · Nhóm 3',
  },
];

// ─── Accent map ───────────────────────────────────────────────────────────────

const ACCENT_BG: Record<string, string> = {
  'pale-green':  'bg-pale-green text-pale-green-text',
  'pale-blue':   'bg-pale-blue text-pale-blue-text',
  'pale-yellow': 'bg-pale-yellow text-pale-yellow-text',
  'pale-red':    'bg-pale-red text-pale-red-text',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-[#FBFBFA] font-sans text-neutral-900">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 w-full bg-[#FBFBFA]/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="inline-block w-5 h-5 rounded-sm bg-neutral-900" aria-hidden="true" />
            <span className="font-mono text-[13px] font-semibold tracking-tight text-neutral-900">
              ClassManager
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7">
            {['Tính năng', 'Vai trò', 'Về hệ thống'].map((label) => (
              <a
                key={label}
                href={`#${label}`}
                className="text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors duration-150"
              >
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <button
            id="nav-login-btn"
            onClick={() => navigate('/login')}
            className="
              flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800
              text-white text-[12px] font-semibold tracking-wide
              px-4 py-2 rounded-lg transition-all duration-150 active:scale-[0.97]
              cursor-pointer
            "
          >
            Đăng nhập
            <ArrowRight size={13} strokeWidth={2} />
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 animate-fade-lift">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: copy */}
          <div>
            {/* Eyebrow — only one on the whole page */}
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-neutral-400 mb-4">
              Hệ thống quản lý lớp học
            </p>

            <h1 className="font-serif text-[2.6rem] md:text-[3.25rem] leading-[1.08] tracking-tight text-neutral-900 mb-5">
              Quản lý điểm số.<br />
              <em className="not-italic font-light">Minh bạch tuyệt đối.</em>
            </h1>

            <p className="text-[15px] text-neutral-500 leading-relaxed max-w-[44ch] mb-8">
              ClassManager giúp giáo viên và ban quản lý theo dõi điểm thi đua, phân quyền chính xác và ghi nhật ký bất biến cho mọi thay đổi.
            </p>

            <div className="flex items-center gap-3">
              <button
                id="hero-login-btn"
                onClick={() => navigate('/login')}
                className="
                  flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800
                  text-white text-[13px] font-semibold
                  px-5 py-2.5 rounded-lg transition-all duration-150 active:scale-[0.97]
                  cursor-pointer
                "
              >
                Bắt đầu ngay
                <ArrowRight size={14} strokeWidth={2} />
              </button>
              <a
                href="#Tính năng"
                className="text-[13px] text-neutral-500 hover:text-neutral-900 underline underline-offset-4 transition-colors"
              >
                Xem tính năng
              </a>
            </div>
          </div>

          {/* Right: hero image */}
          <div
            className="
              relative rounded-xl overflow-hidden
              border border-neutral-100
            "
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)' }}
          >
            <img
              src="/homepage-hero.png"
              alt="ClassManager — giao diện bảng điểm học viên"
              className="w-full h-auto block"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
      <section className="border-y border-neutral-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <dl className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-100">
            {STATS.map(({ value, label }) => (
              <div key={label} className="px-6 first:pl-0 last:pr-0 py-2">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 mb-1">
                  {label}
                </dt>
                <dd className="font-serif text-[2rem] leading-none tracking-tight text-neutral-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── FEATURES BENTO ───────────────────────────────────────────────── */}
      <section id="Tính năng" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-serif text-[1.85rem] leading-tight tracking-tight text-neutral-900 mb-8 max-w-[30ch]">
          Mọi thứ bạn cần để vận hành một lớp học chuyên nghiệp.
        </h2>

        {/* Bento: 2-col on md, first cell spans 2 rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Feature cell — large, with chart image */}
          <div
            className="md:row-span-2 bg-white border border-neutral-100 rounded-xl p-6 flex flex-col justify-between"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)' }}
          >
            <div>
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-md mb-4 ${ACCENT_BG['pale-blue']}`}>
                <BarChart2 size={16} strokeWidth={1.75} />
              </div>
              <h3 className="font-serif text-[1.3rem] leading-tight tracking-tight text-neutral-900 mb-2">
                Dashboard điểm số theo tuần
              </h3>
              <p className="text-[13px] text-neutral-500 leading-relaxed max-w-[38ch]">
                Biểu đồ cột trực quan, so sánh điểm từng nhóm, bảng xếp hạng cập nhật real-time.
              </p>
            </div>
            <div className="mt-6 rounded-lg overflow-hidden border border-neutral-100">
              <img
                src="/homepage-chart.png"
                alt="Biểu đồ điểm theo tuần"
                className="w-full h-auto block"
                loading="lazy"
              />
            </div>
          </div>

          {/* Feature cells — small */}
          {FEATURES.filter((f) => f.accent !== 'pale-blue').map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white border border-neutral-100 rounded-xl p-6"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)' }}
              >
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-md mb-3 ${ACCENT_BG[feature.accent]}`}>
                  <Icon size={16} strokeWidth={1.75} />
                </div>
                <h3 className="font-serif text-[1.05rem] leading-tight tracking-tight text-neutral-900 mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-[13px] text-neutral-500 leading-relaxed">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── ROLE SECTION ─────────────────────────────────────────────────── */}
      <section id="Vai trò" className="border-t border-neutral-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-serif text-[1.85rem] leading-tight tracking-tight text-neutral-900 mb-10 max-w-[28ch]">
            Bốn vai trò, một hệ sinh thái nhất quán.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
            {[
              { role: 'Admin', cap: 'Toàn quyền hệ thống', accent: 'pale-red', items: ['Quản lý tài khoản', 'Cấu hình lớp học', 'Xem toàn bộ nhật ký'] },
              { role: 'Teacher', cap: 'Quản lý nội dung', accent: 'pale-blue', items: ['Chấm điểm học viên', 'Tạo form động', 'Xem dashboard nhóm'] },
              { role: 'Group Leader', cap: 'Đại diện nhóm', accent: 'pale-yellow', items: ['Xem điểm nhóm mình', 'Gửi yêu cầu phê duyệt', 'Nhật ký cá nhân'] },
              { role: 'Student', cap: 'Học viên', accent: 'pale-green', items: ['Xem điểm của mình', 'Lịch sử thay đổi', 'Hồ sơ cá nhân'] },
            ].map(({ role, cap, accent, items }) => (
              <div key={role} className="bg-white p-6 flex flex-col gap-3">
                <div>
                  <span className={`inline-block font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded ${ACCENT_BG[accent]} font-semibold`}>
                    {role}
                  </span>
                  <p className="text-[11px] text-neutral-400 mt-2">{cap}</p>
                </div>
                <ul className="space-y-1.5 mt-1">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[12.5px] text-neutral-600">
                      <span className="mt-[5px] inline-block w-1 h-1 rounded-full bg-neutral-300 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="bg-white border border-neutral-100 rounded-xl p-6"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)' }}
            >
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={12} className="fill-pale-yellow-text text-pale-yellow-text" strokeWidth={0} />
                ))}
              </div>
              <blockquote className="font-serif text-[1.05rem] leading-snug tracking-tight text-neutral-800 mb-4">
                "{t.quote}"
              </blockquote>
              <figcaption className="text-[11.5px] text-neutral-400 font-mono">
                {t.name} · {t.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── FOOTER CTA STRIP ─────────────────────────────────────────────── */}
      <section id="Về hệ thống" className="border-t border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="font-serif text-[1.5rem] leading-tight tracking-tight text-neutral-900 mb-1.5">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-[13px] text-neutral-500">
              Đăng nhập bằng tài khoản được cấp phát hoặc qua Google.
            </p>
          </div>
          <button
            id="footer-login-btn"
            onClick={() => navigate('/login')}
            className="
              shrink-0 flex items-center gap-2
              bg-neutral-900 hover:bg-neutral-800
              text-white text-[13px] font-semibold
              px-6 py-3 rounded-lg
              transition-all duration-150 active:scale-[0.97]
              cursor-pointer
            "
          >
            Đăng nhập ngay
            <ArrowRight size={14} strokeWidth={2} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-sm bg-neutral-900" aria-hidden="true" />
            <span className="font-mono text-[11px] font-semibold tracking-tight text-neutral-900">
              ClassManager
            </span>
          </div>
          <p className="font-mono text-[10.5px] text-neutral-400 tracking-wide">
            © 2025 ClassManager · Hệ thống quản lý lớp học nội bộ
          </p>
        </div>
      </footer>

    </div>
  );
}
