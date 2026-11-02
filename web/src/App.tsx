import { useEffect, useState } from 'react';
import { api } from './api';
import type { Customer, Network, Package, Reseller, SessionUser, Transaction, Voucher } from '../../shared/types';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  ClipboardList,
  Clock,
  Cloud,
  Download,
  Eye,
  Filter,
  HardDrive,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Network as NetworkIcon,
  Package as PackageIcon,
  Phone,
  Plus,
  Printer,
  QrCode,
  RadioTower,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Ticket,
  Trash2,
  UserCheck,
  Users,
  Wallet,
  Wifi,
  X
} from 'lucide-react';
import { PackagesView } from './components/PackagesView';
import { CustomersView } from './components/CustomersView';
import { ResellersView } from './components/ResellersView';
import { TransactionsView } from './components/TransactionsView';

type View = 'overview' | 'customers' | 'packages' | 'resellers' | 'transactions' | 'settings';
type AuthMode = 'login' | 'register';
type Metrics = { customers: number; activeCustomers: number; expiredCustomers: number; totalSales: number; todaySales: number; monthSales: number; resellers: number; connectedDevices: number; dataUsedGb: number };

const formatNumber = (value: number) => new Intl.NumberFormat('ar-YE').format(value);
const formatMoney = (value: number) => `${formatNumber(value)} ر.ي`;

export function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [view, setView] = useState<View>('overview');
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.me().then(({ data }) => { setUser(data.user); return api.network(); }).then(({ data }) => setNetwork(data)).catch(() => undefined).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="loading-screen"><div className="brand-mark small">و</div><span>جارٍ تجهيز مساحتك...</span></div>;
  if (!user) return <PublicSite onAuthenticated={(authUser, authNetwork) => { setUser(authUser); setNetwork(authNetwork ?? null); }} />;
  return <AdminShell user={user} network={network} view={view} setView={setView} onLogout={() => { localStorage.removeItem('waselnet_token'); setUser(null); setNetwork(null); }} />;
}

function PublicSite({ onAuthenticated }: { onAuthenticated: (user: SessionUser, network?: Network) => void }) {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const authError = '';
  const setAuthError = (_value: string) => undefined;
  const handleAuth = async (_payload: { name?: string; phone: string; password: string; networkName?: string }) => undefined;
  return <div className="public-page"><header className="public-nav"><a className="brand" href="#top"><span className="brand-mark">و</span><span>وصل نت<small>إدارة أذكى للشبكات</small></span></a><div className="nav-actions"><a href="#how">كيف يعمل؟</a><button className="button ghost" onClick={() => setAuthMode('login')}>تسجيل الدخول</button><button className="button primary compact" onClick={() => setAuthMode('register')}>ابدأ مجانًا <ArrowLeft size={16} /></button></div></header><main id="top"><section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="pulse-dot" /> منصة تشغيل شبكتك في مكان واحد</div><h1>خلِّ شبكتك<br /><em>تشتغل بذكاء.</em></h1><p>من الكرت الورقي إلى تجربة اتصال واضحة، وصل نت يمنحك أدوات بسيطة لإدارة المشتركين والبقالات والمبيعات، مع جاهزية للربط مع MikroTik.</p><div className="hero-actions"><button className="button primary large" onClick={() => setAuthMode('register')}>أنشئ شبكتك الآن <ArrowLeft size={18} /></button><a href="#how" className="text-link">اكتشف كيف يعمل <ChevronLeft size={16} /></a></div><div className="trust-row"><div className="avatar-stack"><span>م</span><span>ع</span><span>س</span><span>+</span></div><span>مصمم لأصحاب الشبكات في اليمن</span><ShieldCheck size={17} /></div></div><div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="signal-card"><div className="signal-top"><span><RadioTower size={17} /> حالة الشبكة</span><b><i /> مستقرة</b></div><div className="signal-number">98.6<span>%</span></div><div className="signal-line"><span style={{ width: '82%' }} /></div><div className="signal-foot"><span>آخر 30 يوم</span><span>+12.4%</span></div></div><div className="network-node node-one"><Wifi size={20} /><span>شبكة الأفق</span><b>متصل</b></div><div className="network-node node-two"><Users size={18} /><span>1,284 مشترك</span></div><div className="hero-center"><div className="center-ring"><NetworkIcon size={54} /></div><span>اتصال أوضح</span></div></div></section><section id="how" className="feature-band"><div className="section-heading"><span className="eyebrow">كل ما تحتاجه، بهدوء</span><h2>من لوحة واحدة، ترى الصورة كاملة.</h2></div><div className="feature-grid"><Feature icon={<Users />} title="مشتركون منظمون" text="ملف واضح لكل عميل، وباقة ورصيد وحالة اتصال في متناولك." /><Feature icon={<Store />} title="بقالات تحت السيطرة" text="امنح كل بقال صلاحياته، وتابع مبيعاته دون أن تفقد السيطرة." /><Feature icon={<Cloud />} title="جاهز للتوسع" text="بنية متعددة الشبكات وواجهة API تستوعب MikroTik وRADIUS مستقبلًا." /></div></section><section className="closing-band"><div><span className="eyebrow">ابدأ من حيث أنت</span><h2>شبكتك تستحق نظامًا<br />يشبه طموحك.</h2></div><button className="button light" onClick={() => setAuthMode('register')}>سجّل شبكتك <ArrowLeft size={17} /></button></section></main><footer><span>© 2026 وصل نت</span><span>إدارة أبسط. نمو أوضح.</span></footer>{authMode && <AuthModal mode={authMode} error={authError} onClose={() => { setAuthMode(null); setAuthError(''); }} onSubmit={handleAuth} onAuthenticated={onAuthenticated} onSwitch={() => { setAuthError(''); setAuthMode(authMode === 'login' ? 'register' : 'login'); }} />}</div>;
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <article className="feature"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p><ChevronLeft size={17} /></article>; }

function OwnerOtpModal({ onClose, onSwitch, onAuthenticated }: { onClose: () => void; onSwitch: () => void; onAuthenticated: (user: SessionUser, network?: Network) => void }) {
  const [form, setForm] = useState({ name: '', phone: '', networkName: '', region: '', otp: '' });
  const [challengeId, setChallengeId] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [error, setError] = useState('');
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: event.target.value });
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); try { if (!otpStep) { const result = await api.ownerRequestOtp({ name: form.name, phone: form.phone, networkName: form.networkName, region: form.region }); setChallengeId(result.data.challengeId); setOtpStep(true); return; } const result = await api.ownerVerifyOtp({ challengeId, code: form.otp }); localStorage.setItem('waselnet_token', result.data.token); onAuthenticated(result.data.user, result.data.network); } catch (authError) { setError(authError instanceof Error ? authError.message : 'تعذر إكمال العملية.'); } };
  return <div className="modal-backdrop"><div className="auth-modal"><button className="icon-button modal-close" onClick={onClose} aria-label="إغلاق"><X size={19} /></button><div className="auth-intro"><div className="brand-mark">و</div><span className="eyebrow">تسجيل آمن</span><h2>{otpStep ? 'تحقق من رقمك' : 'أنشئ شبكة جديدة'}</h2><p>{otpStep ? `أرسلنا رمزًا من 4 أرقام إلى ${form.phone}` : 'أدخل معلوماتك، وسنرسل رمز تحقق حقيقي.'}</p></div><form onSubmit={submit}>{!otpStep && <><label>اسمك الكامل<input value={form.name} onChange={update('name')} placeholder="مثال: أحمد محمد" required /></label><label>اسم الشبكة<input value={form.networkName} onChange={update('networkName')} placeholder="مثال: شبكة الأفق" required /></label><label>المنطقة<input value={form.region} onChange={update('region')} placeholder="مثال: صنعاء" required /></label></>}<label>رقم الجوال<input dir="ltr" value={form.phone} onChange={update('phone')} placeholder="771234567" inputMode="numeric" required disabled={otpStep} /></label>{otpStep && <label>رمز التحقق<input dir="ltr" value={form.otp} onChange={update('otp')} placeholder="1234" inputMode="numeric" maxLength={4} autoFocus required /></label>}{error && <div className="form-error">{error}</div>}<button className="button primary submit" type="submit">{otpStep ? 'تأكيد وإنشاء الحساب' : 'إرسال رمز التحقق'} <ArrowLeft size={17} /></button></form><div className="auth-switch">لديك حساب بالفعل؟ <button onClick={onSwitch}>سجّل الدخول</button></div></div></div>;
}

function OwnerLoginOtpModal({ onClose, onSwitch, onAuthenticated }: { onClose: () => void; onSwitch: () => void; onAuthenticated: (user: SessionUser, network?: Network) => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); try { if (!otpStep) { const result = await api.ownerLoginRequestOtp({ phone }); setChallengeId(result.data.challengeId); setOtpStep(true); return; } const result = await api.ownerLoginVerifyOtp({ challengeId, code }); localStorage.setItem('waselnet_token', result.data.token); onAuthenticated(result.data.user, result.data.network); } catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'تعذر إكمال العملية.'); } };
  return <div className="modal-backdrop"><div className="auth-modal"><button className="icon-button modal-close" onClick={onClose} aria-label="إغلاق"><X size={19} /></button><div className="auth-intro"><div className="brand-mark">و</div><span className="eyebrow">دخول آمن</span><h2>{otpStep ? 'أدخل رمز التحقق' : 'أهلًا بعودتك'}</h2><p>{otpStep ? `أرسلنا رمزًا من 4 أرقام إلى ${phone}` : 'سجّل الدخول باستخدام رقم جوالك.'}</p></div><form onSubmit={submit}><label>رقم الجوال<input dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="771234567" inputMode="numeric" required disabled={otpStep} /></label>{otpStep && <label>رمز التحقق<input dir="ltr" value={code} onChange={(event) => setCode(event.target.value)} placeholder="1234" inputMode="numeric" maxLength={4} autoFocus required /></label>}{error && <div className="form-error">{error}</div>}<button className="button primary submit" type="submit">{otpStep ? 'تأكيد الدخول' : 'إرسال رمز التحقق'} <ArrowLeft size={17} /></button></form><div className="auth-switch">ليس لديك حساب؟ <button onClick={onSwitch}>أنشئ شبكتك</button></div></div></div>;
}

function AuthModal({ mode, onClose, onSwitch, onAuthenticated }: { mode: AuthMode; error?: string; onSubmit?: (data: { name?: string; phone: string; password: string; networkName?: string }) => void; onClose: () => void; onSwitch: () => void; onAuthenticated: (user: SessionUser, network?: Network) => void }) {
  if (mode === 'register') return <OwnerOtpModal onClose={onClose} onSwitch={onSwitch} onAuthenticated={onAuthenticated} />;
  return <OwnerLoginOtpModal onClose={onClose} onSwitch={onSwitch} onAuthenticated={onAuthenticated} />;
}

function AdminShell({ user, network, view, setView, onLogout }: { user: SessionUser; network: Network | null; view: View; setView: (view: View) => void; onLogout: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="admin-shell">
      <aside className={mobileOpen ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-brand">
          <a className="brand" href="#dashboard">
            <span className="brand-mark">و</span>
            <span>وصل نت<small>لوحة الإدارة</small></span>
          </a>
          <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="workspace-switcher">
          <span className="workspace-avatar">{network?.name?.[0] ?? 'و'}</span>
          <span><b>{network?.name ?? 'شبكتي'}</b><small>{network?.region ?? ''}</small></span>
          <ChevronLeft size={15} />
        </div>
        <nav>
          <NavItem icon={<LayoutDashboard />} label="نظرة عامة" active={view === 'overview'} onClick={() => { setView('overview'); setMobileOpen(false); }} />
          <NavItem icon={<Users />} label="العملاء" active={view === 'customers'} onClick={() => { setView('customers'); setMobileOpen(false); }} />
          <NavItem icon={<PackageIcon />} label="الباقات والكروت" active={view === 'packages'} onClick={() => { setView('packages'); setMobileOpen(false); }} />
          <NavItem icon={<Store />} label="البقالات" active={view === 'resellers'} onClick={() => { setView('resellers'); setMobileOpen(false); }} />
          <NavItem icon={<ClipboardList />} label="العمليات" active={view === 'transactions'} onClick={() => { setView('transactions'); setMobileOpen(false); }} />
        </nav>
        <div className="sidebar-bottom">
          <NavItem icon={<Settings2 />} label="الإعدادات والراوتر" active={view === 'settings'} onClick={() => { setView('settings'); setMobileOpen(false); }} />
          <button className="nav-item logout" onClick={onLogout}>
            <LogOut /> <span>تسجيل الخروج</span>
          </button>
          <div className="profile">
            <span className="profile-avatar">{user.name[0]}</span>
            <span><b>{user.name}</b><small>مالك الشبكة</small></span>
            <ChevronLeft size={15} />
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <button className="icon-button menu-trigger" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="header-search">
            <Search size={17} />
            <input placeholder="ابحث في شبكتك..." />
          </div>
          <div className="header-actions">
            <button className="icon-button"><CircleHelp size={19} /></button>
            <button className="notification icon-button"><span /> <BarChart3 size={19} /></button>
          </div>
        </header>
        <main className="dashboard-content">
          {view === 'overview' ? (
            <RealOverview network={network} onNavigate={setView} />
          ) : view === 'packages' ? (
            <PackagesView network={network} />
          ) : view === 'customers' ? (
            <CustomersView network={network} />
          ) : view === 'resellers' ? (
            <ResellersView network={network} />
          ) : view === 'transactions' ? (
            <TransactionsView network={network} />
          ) : (
            <MikroTikSettings />
          )}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={active ? 'nav-item active' : 'nav-item'} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {active && <i />}
    </button>
  );
}

function RealOverview({ network, onNavigate }: { network: Network | null; onNavigate: (view: View) => void }) {
  const [metrics, setMetrics] = useState<Metrics>({
    customers: 0,
    activeCustomers: 0,
    expiredCustomers: 0,
    totalSales: 0,
    todaySales: 0,
    monthSales: 0,
    resellers: 0,
    connectedDevices: 0,
    dataUsedGb: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard().then(({ data }) => setMetrics(data)).finally(() => setLoading(false));
  }, []);

  const cards = [
    { icon: <Users />, label: 'إجمالي المشتركين', value: formatNumber(metrics.customers), tone: 'mint', target: 'customers' as View },
    { icon: <Wifi />, label: 'مشتركون نشطون', value: formatNumber(metrics.activeCustomers), tone: 'blue', target: 'customers' as View },
    { icon: <Store />, label: 'إجمالي المبيعات', value: formatMoney(metrics.totalSales), tone: 'orange', target: 'transactions' as View },
    { icon: <Smartphone />, label: 'أجهزة متصلة الآن', value: formatNumber(metrics.connectedDevices), tone: 'violet', target: 'customers' as View }
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">بيانات مباشرة من شبكتك</span>
          <h1>مرحبًا، {network?.name ?? 'يا صاحب الشبكة'}</h1>
          <p>{network?.region ?? 'حضرموت'} · متابعة فورية لمبيعات واستخدام شبكة الهوت سبوت.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="button light" onClick={() => onNavigate('packages')}>
            <PackageIcon size={16} /> إدارة الباقات والكروت
          </button>
          <button className="button primary" onClick={() => onNavigate('resellers')}>
            <Store size={16} /> نقاط البيع والبقالات
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-view">
          <span>جارٍ تحميل بيانات الشبكة...</span>
        </div>
      ) : (
        <>
          <div className="metric-grid">
            {cards.map((card) => (
              <div
                className={`metric-card ${card.tone}`}
                key={card.label}
                style={{ cursor: 'pointer' }}
                onClick={() => onNavigate(card.target)}
              >
                <span className="metric-icon">{card.icon}</span>
                <span className="metric-label">{card.label}</span>
                <strong>{card.value}</strong>
              </div>
            ))}
          </div>

          <div className="real-summary-grid">
            <div className="panel real-summary">
              <h2>ملخص العمليات المالية</h2>
              <p>الأرقام التالية محدثة مباشرة من مبيعات ونقاط بيع شبكتك.</p>
              <div className="real-summary-row">
                <span>مبيعات اليوم</span>
                <b>{formatMoney(metrics.todaySales)}</b>
              </div>
              <div className="real-summary-row">
                <span>مبيعات الشهر</span>
                <b>{formatMoney(metrics.monthSales)}</b>
              </div>
              <div
                className="real-summary-row"
                style={{ cursor: 'pointer' }}
                onClick={() => onNavigate('resellers')}
              >
                <span>البقالات ونقاط التوزيع</span>
                <b style={{ color: 'var(--orange)' }}>{formatNumber(metrics.resellers)} نقطة</b>
              </div>
              <div className="real-summary-row">
                <span>استهلاك البيانات الكلي</span>
                <b>{formatNumber(metrics.dataUsedGb)} GB</b>
              </div>
            </div>

            <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h2>الإجراءات السريعة</h2>
                <p>الوصول المباشر لإدارة الكروت والبقالات والمايكروتك.</p>
                <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
                  <button className="button light" style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 14px' }} onClick={() => onNavigate('packages')}>
                    <Ticket size={16} color="var(--orange)" /> إصدار وتوليد كروت شحن ورقية
                  </button>
                  <button className="button light" style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 14px' }} onClick={() => onNavigate('customers')}>
                    <Users size={16} color="#457bba" /> تصفح المشتركين والأجهزة المتصلة
                  </button>
                  <button className="button light" style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 14px' }} onClick={() => onNavigate('transactions')}>
                    <ClipboardList size={16} color="#3b8e64" /> استعراض سجل العمليات والمبيعات
                  </button>
                  <button className="button light" style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 14px' }} onClick={() => onNavigate('settings')}>
                    <RadioTower size={16} color="#7e61b8" /> فحص وإعدادات راوتر MikroTik
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Overview({ network }: { network: Network | null }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  useEffect(() => { api.dashboard().then(({ data }) => setMetrics(data)).catch(() => undefined); }, []);
  const metricCards = metrics ? [{ icon: <Users />, label: 'إجمالي العملاء', value: formatNumber(metrics.customers), note: '+8.2%', tone: 'mint' }, { icon: <Wifi />, label: 'عملاء نشطون', value: formatNumber(metrics.activeCustomers), note: '+5.4%', tone: 'blue' }, { icon: <Store />, label: 'إجمالي المبيعات', value: formatMoney(metrics.totalSales), note: '+14.8%', tone: 'orange' }, { icon: <Smartphone />, label: 'أجهزة متصلة الآن', value: formatNumber(metrics.connectedDevices), note: 'مباشر', tone: 'violet' }] : [];
  return <><div className="page-heading"><div><span className="eyebrow">الأحد، 11 سبتمبر 2026</span><h1>صباح الخير، {network?.name ?? 'يا صاحب الشبكة'} <span>👋</span></h1><p>هذه لمحة سريعة عن أداء شبكتك اليوم.</p></div><button className="button primary"><Plus size={17} /> إضافة عملية</button></div><div className="metric-grid">{metricCards.map((card) => <div className={`metric-card ${card.tone}`} key={card.label}><div className="metric-card-top"><span className="metric-icon">{card.icon}</span><span className="metric-note"><i /> {card.note}</span></div><span className="metric-label">{card.label}</span><strong>{card.value}</strong><div className="sparkline"><span /><span /><span /><span /><span /><span /><span /></div></div>)}</div><div className="dashboard-grid"><section className="panel sales-panel"><div className="panel-heading"><div><h2>حركة المبيعات</h2><p>نظرة على مبيعات آخر 7 أيام</p></div><button className="select-button">هذا الأسبوع <ChevronLeft size={15} /></button></div><div className="chart"><div className="chart-y"><span>60k</span><span>40k</span><span>20k</span><span>0</span></div><div className="chart-body"><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 640 220" preserveAspectRatio="none"><path d="M0 184 C45 165 63 178 98 150 S155 116 190 139 S240 188 280 139 S330 88 370 112 S420 142 460 104 S515 30 550 77 S603 70 640 20" fill="none" stroke="#e88b4a" strokeWidth="4" strokeLinecap="round" /><path d="M0 184 C45 165 63 178 98 150 S155 116 190 139 S240 188 280 139 S330 88 370 112 S420 142 460 104 S515 30 550 77 S603 70 640 20 L640 220 L0 220Z" fill="url(#chartFill)" opacity=".14" /><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#e88b4a" /><stop offset="1" stopColor="#e88b4a" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-x"><span>السبت</span><span>الأحد</span><span>الإثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>الجمعة</span></div></div></div></section><section className="panel activity-panel"><div className="panel-heading"><div><h2>آخر العمليات</h2><p>تحديثات تعبئة حديثة</p></div><button className="icon-button"><ArrowLeft size={18} /></button></div><Activity name="بقالة النور" detail="20 GB · 900 ر.ي" time="منذ 8 دقائق" initials="ن" color="orange" /><Activity name="متجر الإخوة" detail="10 GB · 500 ر.ي" time="منذ 24 دقيقة" initials="إ" color="blue" /><Activity name="بقالة الميناء" detail="50 GB · 1,800 ر.ي" time="منذ 41 دقيقة" initials="م" color="mint" /><Activity name="بقالة الوفاء" detail="20 GB · 900 ر.ي" time="منذ ساعة" initials="و" color="violet" /></section></div><div className="bottom-grid"><section className="panel package-panel"><div className="panel-heading"><div><h2>الباقات الأكثر مبيعًا</h2><p>حسب عدد العمليات هذا الشهر</p></div><button className="text-button">عرض الكل <ArrowLeft size={15} /></button></div><PackageRow name="باقة 20 جيجا" sales="382 عملية" amount="343,800 ر.ي" percent={74} color="orange" /><PackageRow name="باقة 10 جيجا" sales="246 عملية" amount="123,000 ر.ي" percent={52} color="blue" /><PackageRow name="باقة 50 جيجا" sales="96 عملية" amount="172,800 ر.ي" percent={31} color="mint" /></section><section className="panel status-panel"><div className="panel-heading"><div><h2>حالة الشبكة</h2><p>الأجهزة والبنية التشغيلية</p></div><span className="online-badge"><i /> مستقرة</span></div><div className="status-visual"><div className="status-ring"><strong>98.6%</strong><span>الجاهزية</span></div><div className="status-list"><span><i className="green" /> MikroTik <b>متصل</b></span><span><i className="blue-dot" /> API <b>يعمل</b></span><span><i className="yellow" /> Accounting <b>بانتظار الربط</b></span></div></div></section></div></>;
}

function Activity({ name, detail, time, initials, color }: { name: string; detail: string; time: string; initials: string; color: string }) { return <div className="activity-row"><span className={`activity-avatar ${color}`}>{initials}</span><span className="activity-main"><b>{name}</b><small>{detail}</small></span><small>{time}</small></div>; }
function PackageRow({ name, sales, amount, percent, color }: { name: string; sales: string; amount: string; percent: number; color: string }) { return <div className="package-row"><span className={`package-icon ${color}`}><PackageIcon size={17} /></span><span className="package-main"><b>{name}</b><small>{sales}</small></span><div className="progress"><span className={color} style={{ width: `${percent}%` }} /></div><strong>{amount}</strong></div>; }
function MikroTikSettings() {
  const [devices, setDevices] = useState<import('../../shared/types').MikroTikDevice[]>([]);
  const [form, setForm] = useState({ name: '', host: '', port: '8728', connectionType: 'routeros_api' as 'routeros_api' | 'radius', secret: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    api.mikrotiks().then(({ data }) => setDevices(data)).catch((value) => setError(value instanceof Error ? value.message : 'تعذر تحميل الأجهزة.'));
  }, []);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await api.addMikrotik({ ...form, port: Number(form.port) });
      setDevices([...devices, result.data]);
      setForm({ name: '', host: '', port: '8728', connectionType: 'routeros_api', secret: '' });
      setMessage(result.data.status === 'online' ? 'تم حفظ الجهاز واختبار الاتصال بنجاح (متصل).' : 'تم حفظ إعدادات MikroTik بنجاح.');
    } catch (value) {
      setError(value instanceof Error ? value.message : 'تعذر حفظ الجهاز.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setMessage('');
    setError('');
    try {
      const res = await api.testMikrotik(id);
      setDevices((prev) => prev.map((d) => d.id === id ? res.data.device : d));
      if (res.data.probe.online) {
        setMessage(`تم الاتصال بنجاح بالمايكروتك (${res.data.probe.latencyMs}ms).`);
      } else {
        setError(`فشل الاتصال: ${res.data.probe.error ?? 'لا يوجد رد'}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر فحص الجهاز.');
    } finally {
      setTestingId(null);
    }
  };

  return <div className="settings-page"><div className="page-heading"><div><span className="eyebrow">الاتصال والبنية التحتية</span><h1>إعدادات MikroTik</h1><p>أضف أجهزة شبكتك ليتم ربطها لاحقًا مع API أو RADIUS وAccounting.</p></div><span className="online-badge"><i /> الأسرار مشفرة</span></div><div className="settings-grid"><section className="panel settings-form"><div className="panel-heading"><div><h2>إضافة جهاز</h2><p>لا ترسل كلمة السر إلى المتصفح بعد الحفظ.</p></div></div><form onSubmit={submit}><label>اسم الجهاز<input value={form.name} onChange={update('name')} placeholder="MikroTik الرئيسي" required /></label><label>عنوان IP أو hostname<input dir="ltr" value={form.host} onChange={update('host')} placeholder="10.0.0.1 أو router.example" required /></label><div className="form-row"><label>المنفذ<input dir="ltr" type="number" min="1" max="65535" value={form.port} onChange={update('port')} required /></label><label>طريقة الربط<select value={form.connectionType} onChange={update('connectionType')}><option value="routeros_api">RouterOS API</option><option value="radius">RADIUS</option></select></label></div><label>Secret أو كلمة مرور الاتصال<input type="password" value={form.secret} onChange={update('secret')} placeholder="سيتم تشفيرها على الخادم" minLength={8} required /></label>{error && <div className="form-error">{error}</div>}{message && <div className="form-success">{message}</div>}<button className="button primary submit" type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ الجهاز'} <Plus size={17} /></button></form></section><section className="panel devices-panel"><div className="panel-heading"><div><h2>أجهزة الشبكة</h2><p>{devices.length} جهاز مسجل</p></div><RadioTower size={19} color="#e88b4a" /></div>{devices.length === 0 ? <div className="device-empty"><NetworkIcon size={26} /><span>لم تتم إضافة أي جهاز بعد.</span></div> : devices.map((device) => <div className="device-row" key={device.id}><span className="device-icon"><RadioTower size={18} /></span><span><b>{device.name}</b><small dir="ltr">{device.host}:{device.port} · {device.connectionType === 'radius' ? 'RADIUS' : 'RouterOS API'}</small></span><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span className={`device-status ${device.status}`}><i /> {device.status === 'online' ? 'متصل' : device.status === 'offline' ? 'غير متصل' : 'بانتظار الفحص'}</span><button type="button" className="button ghost" style={{ padding: '5px 11px', fontSize: '11px', border: '1px solid #dce0d9', borderRadius: '7px' }} onClick={() => handleTest(device.id)} disabled={testingId === device.id}>{testingId === device.id ? 'جارٍ الفحص...' : 'فحص الاتصال'}</button></div></div>)}</section></div></div>;
}
function EmptyView({ view }: { view: View }) { const labels: Record<View, string> = { overview: 'نظرة عامة', customers: 'العملاء', packages: 'الباقات', resellers: 'البقالات', transactions: 'العمليات', settings: 'الإعدادات' }; return <div className="empty-view"><div className="empty-icon"><PackageIcon size={26} /></div><span className="eyebrow">المرحلة القادمة</span><h1>{labels[view]}</h1><p>هذه المساحة جاهزة للمرحلة التالية من بناء وصل نت. ستظهر هنا بيانات شبكتك الحقيقية بعد تفعيل الوحدة.</p><button className="button primary" onClick={() => undefined}>قريبًا <ArrowLeft size={17} /></button></div>; }
