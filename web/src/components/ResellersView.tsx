import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Network, Reseller } from '../../../shared/types';
import { Check, DollarSign, MapPin, Phone, Plus, Store, UserCheck, Wallet, X } from 'lucide-react';

const formatNumber = (value: number) => new Intl.NumberFormat('ar-YE').format(value);
const formatMoney = (value: number) => `${formatNumber(value)} ر.ي`;

export function ResellersView({ network }: { network: Network | null }) {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [topupTarget, setTopupTarget] = useState<Reseller | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.resellers();
      setResellers(res.data);
    } catch (err) {
      console.error('Failed to load resellers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBalance = resellers.reduce((sum, r) => sum + (r.balance || 0), 0);
  const totalCardsSold = resellers.reduce((sum, r) => sum + (r.cardsSold || 0), 0);

  return (
    <div className="resellers-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">نقاط البيع والموزعون</span>
          <h1>البقالات ونقاط التوزيع</h1>
          <p>إدارة مراكز بيع الكروت وشحن الأرصدة للبقالات المعتمدة لشبكة {network?.name ?? 'وناسة نت'}.</p>
        </div>
        <button className="button primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> إضافة نقطة بيع جديدة
        </button>
      </div>

      <div className="quick-metrics-strip">
        <div className="quick-metric">
          <div className="quick-metric-icon orange"><Store size={20} /></div>
          <div className="quick-metric-info">
            <small>إجمالي نقاط البيع</small>
            <strong>{formatNumber(resellers.length)}</strong>
          </div>
        </div>
        <div className="quick-metric">
          <div className="quick-metric-icon green"><Wallet size={20} /></div>
          <div className="quick-metric-info">
            <small>إجمالي الأرصدة الحالية</small>
            <strong>{formatMoney(totalBalance)}</strong>
          </div>
        </div>
        <div className="quick-metric">
          <div className="quick-metric-icon blue"><DollarSign size={20} /></div>
          <div className="quick-metric-info">
            <small>إجمالي الكروت المباعة</small>
            <strong>{formatNumber(totalCardsSold)} كرت</strong>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-view">
          <span>جارٍ تحميل بيانات البقالات...</span>
        </div>
      ) : (
        <div className="reseller-grid">
          {resellers.map((r) => (
            <div className="reseller-card" key={r.id}>
              <div>
                <div className="reseller-header">
                  <div>
                    <h3>{r.name}</h3>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <UserCheck size={13} /> {r.ownerName}
                    </p>
                  </div>
                  <span className="package-card-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {r.region}
                  </span>
                </div>

                <div className="reseller-balance-box">
                  <span>
                    <small>الرصيد المتاح</small>
                    <strong>{formatNumber(r.balance)} <span style={{ fontSize: '13px' }}>ر.ي</span></strong>
                  </span>
                  <Wallet size={28} opacity={0.6} />
                </div>

                <div className="reseller-stats">
                  <span>
                    نسبة العمولة: <b>{r.commissionPercent}%</b>
                  </span>
                  <span>
                    الكروت المباعة: <b>{formatNumber(r.cardsSold)} كرت</b>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7a8699', marginBottom: '14px' }}>
                  <Phone size={13} />
                  <span dir="ltr">{r.phone}</span>
                </div>
              </div>

              <div>
                <button
                  className="button primary compact"
                  style={{ width: '100%' }}
                  onClick={() => setTopupTarget(r)}
                >
                  <Plus size={15} /> شحن رصيد للبقالة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddResellerModal
          onClose={() => setShowAddModal(false)}
          onAdded={(newRes) => {
            setResellers([...resellers, newRes]);
            setShowAddModal(false);
          }}
        />
      )}

      {topupTarget && (
        <TopupResellerModal
          reseller={topupTarget}
          onClose={() => setTopupTarget(null)}
          onSuccess={(updated) => {
            setResellers((prev) => prev.map((item) => item.id === updated.id ? updated : item));
            setTopupTarget(null);
          }}
        />
      )}
    </div>
  );
}

function AddResellerModal({
  onClose,
  onAdded
}: {
  onClose: () => void;
  onAdded: (res: Reseller) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    region: 'شبام',
    commissionPercent: '10',
    initialBalance: '10000'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.addReseller({
        name: form.name,
        ownerName: form.ownerName,
        phone: form.phone,
        region: form.region,
        commissionPercent: Number(form.commissionPercent),
        balance: Number(form.initialBalance),
        totalSales: 0,
        cardsSold: 0,
        status: 'active'
      });
      onAdded(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إضافة البقالة.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h2>إضافة بقالة أو نقطة بيع</h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="modal-form" onSubmit={submit}>
          <label>
            اسم المحل / البقالة
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: بقالة النور"
              required
            />
          </label>
          <div className="form-row">
            <label>
              اسم المسؤول
              <input
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                placeholder="أحمد علي"
                required
              />
            </label>
            <label>
              رقم الجوال
              <input
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="771234567"
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              المنطقة / الحي
              <input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="مثال: شبام، الجولة"
                required
              />
            </label>
            <label>
              نسبة الربح (%)
              <input
                type="number"
                value={form.commissionPercent}
                onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
                required
              />
            </label>
          </div>
          <label>
            الرصيد الافتتاحي (ر.ي)
            <input
              type="number"
              value={form.initialBalance}
              onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="button ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="button primary" disabled={saving}>
              {saving ? 'جارٍ الحفظ...' : 'حفظ البقالة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TopupResellerModal({
  reseller,
  onClose,
  onSuccess
}: {
  reseller: Reseller;
  onClose: () => void;
  onSuccess: (res: Reseller) => void;
}) {
  const [amount, setAmount] = useState('10000');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const quickAmounts = [5000, 10000, 20000, 50000];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.topupReseller(reseller.id, Number(amount));
      onSuccess(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر شحن الرصيد.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h2>شحن رصيد - {reseller.name}</h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="modal-form" onSubmit={submit}>
          <div style={{ background: '#f5f7f4', padding: '12px 14px', borderRadius: '10px', fontSize: '12px', color: '#566477' }}>
            الرصيد الحالي للبقالة: <b>{formatMoney(reseller.balance)}</b>
          </div>

          <label>
            اختر مبلغ الشحن السريع
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '6px' }}>
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  className={`button ${amount === String(q) ? 'primary' : 'light'} compact`}
                  style={{ fontSize: '11px' }}
                  onClick={() => setAmount(String(q))}
                >
                  {formatNumber(q)}
                </button>
              ))}
            </div>
          </label>

          <label>
            أو اكتب المبلغ يدويًا (ر.ي)
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="100"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="button ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="button primary" disabled={saving}>
              {saving ? 'جارٍ الشحن...' : `تأكيد شحن ${formatMoney(Number(amount) || 0)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
