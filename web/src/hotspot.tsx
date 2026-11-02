import { useEffect, useState } from 'react';
import { Check, ChevronLeft, LockKeyhole, MessageCircle, Radio, ShieldCheck, Sparkles, Wifi, X } from 'lucide-react';
import ReactDOM from 'react-dom/client';
import './hotspot.css';

type NetworkConfig = { id: string; name: string; region: string; slug: string; status: 'active' | 'suspended' };
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function loadNetwork(identifier: string) {
  const response = await fetch(`${API_URL}/hotspot/config?network=${encodeURIComponent(identifier)}`);
  if (!response.ok) throw new Error('NETWORK_NOT_FOUND');
  return (await response.json()).data as NetworkConfig;
}

function HotspotPage() {
  const requestedNetwork = new URLSearchParams(window.location.search).get('network') ?? 'بيحم';
  const [network, setNetwork] = useState<NetworkConfig>({ id: '', name: requestedNetwork, region: '', slug: requestedNetwork, status: 'active' });
  const [networkReady, setNetworkReady] = useState(false);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { loadNetwork(requestedNetwork).then((value) => { setNetwork(value); setNetworkReady(true); }).catch(() => setError('هذه الشبكة غير مهيأة بعد في النظام.')); }, [requestedNetwork]);
  const submit = (event: React.FormEvent) => { event.preventDefault(); setError(''); if (step === 'phone') { if (!/^77\d{7}$/.test(phone)) { setError('أدخل رقم جوال يمني صحيح يبدأ بـ 77.'); return; } setStep('otp'); return; } if (!/^\d{4}$/.test(otp)) { setError('أدخل رمز التحقق المكون من 4 أرقام.'); return; } setError('سيتم تفعيل الدخول بعد ربط خدمة العملاء وDevice Verification.'); };
  return <main className="hotspot-shell"><div className="hotspot-glow glow-one" /><div className="hotspot-glow glow-two" /><header className="hotspot-header"><div className="hotspot-brand"><span className="hotspot-logo"><Wifi size={22} /></span><span><b>{network.name}</b><small>{network.region || 'اتصال موثوق'}</small></span></div><span className="secure-chip"><ShieldCheck size={14} /> اتصال آمن</span></header><section className="hotspot-card"><div className="card-topline"><span className="live-dot" /> بوابة الإنترنت</div><div className="hero-wifi"><div className="wifi-orbit orbit-a" /><div className="wifi-orbit orbit-b" /><div className="wifi-core"><Radio size={31} /></div></div><h1>أهلًا بك في<br /><em>{network.name}</em></h1><p className="intro">اتصل بالإنترنت بسهولة. أدخل رقم جوالك للتحقق من حسابك وابدأ التصفح.</p>{!networkReady && !error && <div className="loading-line">جارٍ التحقق من إعدادات الشبكة...</div>}<form onSubmit={submit} className="hotspot-form"><label>رقم الجوال<span className="field-wrap"><span className="country-code">+967</span><input dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="771234567" inputMode="numeric" disabled={step === 'otp'} /></span></label>{step === 'otp' && <label>رمز التحقق<span className="field-wrap"><LockKeyhole size={17} className="field-icon" /><input dir="ltr" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" inputMode="numeric" autoFocus /></span><small className="field-hint">أدخل الرمز المرسل إلى جوالك</small></label>}{error && <div className="hotspot-error"><X size={15} /> {error}</div>}<button className="hotspot-button" type="submit" disabled={!networkReady && !error}>{step === 'phone' ? <><MessageCircle size={18} /> إرسال رمز التحقق</> : <><Check size={18} /> تحقق واتصل</>}</button></form>{step === 'otp' && <button className="back-link" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}><ChevronLeft size={15} /> تغيير الرقم</button>}<div className="hotspot-note"><Sparkles size={14} /> إنترنت مستقر، تجربة أبسط</div></section><footer><span>Powered by WaselNet</span><span><LockKeyhole size={12} /> خصوصيتك مهمة</span></footer></main>;
}

ReactDOM.createRoot(document.getElementById('hotspot-root')!).render(<HotspotPage />);
