import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Customer, Network, Package } from '../../../shared/types';
import { AlertCircle, CheckCircle2, Clock, HardDrive, Plus, RefreshCw, Search, Smartphone, UserCheck, Users, Wifi, X, Zap } from 'lucide-react';

const formatNumber = (value: number) => new Intl.NumberFormat('ar-YE').format(value);

export function CustomersView({ network }: { network: Network | null }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [rechargingCustomer, setRechargingCustomer] = useState<Customer | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [custRes, pkgRes] = await Promise.all([
        api.customers(),
        api.packages()
      ]);
      setCustomers(custRes.data);
      setPackages(pkgRes.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (customer: Customer) => {
    const newStatus = customer.status === 'active' ? 'blocked' : 'active';
    try {
      const res = await api.updateCustomer(customer.id, { status: newStatus });
      setCustomers((prev) => prev.map((c) => c.id === customer.id ? res.data : c));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'تعذر تحديث حالة المشترك.');
    }
  };

  const handleRenew = async (customer: Customer) => {
    try {
      const res = await api.updateCustomer(customer.id, {
        status: 'active',
        dataUsedMb: 0,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
      });
      setCustomers((prev) => prev.map((c) => c.id === customer.id ? res.data : c));
      alert(`تم تجديد اشتراك ${customer.name} بنجاح.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'تعذر تجديد الاشتراك.');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.ipAddress && c.ipAddress.includes(term)) ||
      (c.macAddress && c.macAddress.toLowerCase().includes(term));
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalUsedMb = customers.reduce((sum, c) => sum + (c.dataUsedMb || 0), 0);
  const activeCount = customers.filter((c) => c.status === 'active').length;
  const expiredCount = customers.filter((c) => c.status === 'expired').length;

  return (
    <div className="customers-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">مستخدمو الشبكة ونقاط الهوت سبوت</span>
          <h1>إدارة العملاء والمشتركين</h1>
          <p>متابعة استهلاك البيانات لأجهزة المشتركين على شبكة {network?.name ?? 'ستار ميديا'}، وحالة الاتصال، وتجديد الحسابات.</p>
        </div>
        <button className="button primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> إضافة مشترك جديد
        </button>
      </div>

      <div className="quick-metrics-strip">
        <div className="quick-metric">
          <div className="quick-metric-icon blue"><Users size={20} /></div>
          <div className="quick-metric-info">
            <small>إجمالي المشتركين</small>
            <strong>{formatNumber(customers.length)}</strong>
          </div>
        </div>
        <div className="quick-metric">
          <div className="quick-metric-icon green"><Wifi size={20} /></div>
          <div className="quick-metric-info">
            <small>المشتركون النشطون</small>
            <strong>{formatNumber(activeCount)}</strong>
          </div>
        </div>
        <div className="quick-metric">
          <div className="quick-metric-icon orange"><AlertCircle size={20} /></div>
          <div className="quick-metric-info">
            <small>الاشتراكات المنتهية</small>
            <strong>{formatNumber(expiredCount)}</strong>
          </div>
        </div>
        <div className="quick-metric">
          <div className="quick-metric-icon purple"><HardDrive size={20} /></div>
          <div className="quick-metric-info">
            <small>إجمالي استهلاك البيانات</small>
            <strong>{Math.round(totalUsedMb / 1024 * 10) / 10} GB</strong>
          </div>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} color="#8591a2" />
          <input
            placeholder="ابحث بالاسم، الجوال، الآيبي، أو الماك..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="expired">منتهي</option>
            <option value="blocked">محظور</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty-view">
          <span>جارٍ تحميل بيانات المشتركين...</span>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم المشترك</th>
                <th>رقم الجوال</th>
                <th>الباقة الحالية</th>
                <th>استهلاك البيانات</th>
                <th>عنوان IP / MAC</th>
                <th>الحالة</th>
                <th>تاريخ الانتهاء</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#8894a3' }}>
                    لم يتم العثور على مشتركين مطابقين للبحث.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const percent = Math.min(100, Math.round((customer.dataUsedMb / Math.max(1, customer.dataTotalMb)) * 100));
                  return (
                    <tr key={customer.id}>
                      <td>
                        <b>{customer.name}</b>
                      </td>
                      <td dir="ltr" style={{ textAlign: 'right' }}>{customer.phone}</td>
                      <td>
                        <span className="package-card-badge">{customer.activePackage || 'باقة افتراضية'}</span>
                      </td>
                      <td>
                        <div style={{ width: '130px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#7a8698', marginBottom: '4px' }}>
                            <span>{customer.dataUsedMb} MB</span>
                            <span>{customer.dataTotalMb} MB</span>
                          </div>
                          <div className="progress">
                            <span
                              className={percent > 90 ? 'orange' : percent > 50 ? 'blue' : 'mint'}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'grid', gap: '2px', fontSize: '11px', fontFamily: 'monospace' }} dir="ltr">
                          <span>{customer.ipAddress || '192.168.88.xxx'}</span>
                          <small style={{ color: '#909caa' }}>{customer.macAddress || 'تلقائي'}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${customer.status}`}>
                          <i /> {customer.status === 'active' ? 'نشط' : customer.status === 'expired' ? 'منتهي' : 'محظور'}
                        </span>
                      </td>
                      <td>
                        <small>{customer.expiresAt ? new Date(customer.expiresAt).toLocaleDateString('ar-YE') : 'مفتوح'}</small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="button primary compact"
                            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', background: '#2563eb', color: '#fff' }}
                            onClick={() => setRechargingCustomer(customer)}
                            title="شحن رصيد للمشترك"
                          >
                            <Zap size={12} /> شحن رصيد
                          </button>
                          <button
                            className="button ghost compact"
                            style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #dce0d9', borderRadius: '6px' }}
                            onClick={() => handleRenew(customer)}
                            title="تجديد الباقة"
                          >
                            <RefreshCw size={13} /> تجديد
                          </button>
                          <button
                            className="button ghost compact"
                            style={{ padding: '4px 8px', fontSize: '11px', color: customer.status === 'active' ? '#d1583c' : '#398a61' }}
                            onClick={() => handleToggleStatus(customer)}
                          >
                            {customer.status === 'active' ? 'إيقاف' : 'تفعيل'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddCustomerModal
          packages={packages}
          onClose={() => setShowAddModal(false)}
          onAdded={(cust) => {
            setCustomers([cust, ...customers]);
            setShowAddModal(false);
          }}
        />
      )}

      {rechargingCustomer && (
        <RechargeCustomerModal
          customer={rechargingCustomer}
          packages={packages}
          onClose={() => setRechargingCustomer(null)}
          onSuccess={(updated) => {
            setCustomers((prev) => prev.map((c) => c.id === updated.id ? updated : c));
            setRechargingCustomer(null);
          }}
        />
      )}
    </div>
  );
}

function AddCustomerModal({
  packages,
  onClose,
  onAdded
}: {
  packages: Package[];
  onClose: () => void;
  onAdded: (cust: Customer) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    packageId: packages[0]?.id || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const selectedPkg = packages.find((p) => p.id === form.packageId);
      const res = await api.addCustomer({
        name: form.name,
        phone: form.phone,
        activePackage: selectedPkg?.name || 'باقة 1 جيجا',
        dataTotalMb: selectedPkg?.dataLimitMb || 1024,
        dataUsedMb: 0,
        uptimeUsedMinutes: 0,
        status: 'active',
        expiresAt: new Date(Date.now() + (selectedPkg?.validityDays || 30) * 86400000).toISOString()
      });
      onAdded(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إضافة المشترك.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h2>إضافة مشترك جديد للشبكة</h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="modal-form" onSubmit={submit}>
          <label>
            اسم المشترك الكامل
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: صالح أحمد النهدي"
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

          <label>
            الباقة الابتدائية
            <select
              value={form.packageId}
              onChange={(e) => setForm({ ...form, packageId: e.target.value })}
            >
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.price} ر.ي ({p.dataLimitMb >= 1024 ? `${p.dataLimitMb / 1024} GB` : `${p.dataLimitMb} MB`})
                </option>
              ))}
            </select>
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="button ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="button primary" disabled={saving}>
              {saving ? 'جارٍ الإضافة...' : 'إضافة المشترك'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RechargeCustomerModal({
  customer,
  packages,
  onClose,
  onSuccess
}: {
  customer: Customer;
  packages: Package[];
  onClose: () => void;
  onSuccess: (updated: Customer) => void;
}) {
  const [selectedPkgId, setSelectedPkgId] = useState(packages[0]?.id || 'custom');
  const [customMb, setCustomMb] = useState(1024);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let pkgName = 'شحن مخصص';
      let mb = customMb;
      let validityDays = 30;

      if (selectedPkgId !== 'custom') {
        const pkg = packages.find((p) => p.id === selectedPkgId);
        if (pkg) {
          pkgName = pkg.name;
          mb = pkg.dataLimitMb;
          validityDays = pkg.validityDays || 30;
        }
      }

      const res = await api.updateCustomer(customer.id, {
        activePackage: pkgName,
        dataTotalMb: (customer.dataTotalMb || 0) + mb,
        dataUsedMb: 0,
        status: 'active',
        expiresAt: new Date(Date.now() + validityDays * 86400000).toISOString()
      });

      alert(`تم شحن رصيد المشترك ${customer.name} بـ (${mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`}) وتحديث الراوتر بنجاح!`);
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
          <h2>شحن وتعبئة رصيد المشترك</h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="modal-form" onSubmit={submit}>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
            <div><strong>اسم المشترك:</strong> {customer.name}</div>
            <div><strong>رقم الجوال:</strong> {customer.phone}</div>
            <div><strong>الرصيد الحالي:</strong> {customer.dataTotalMb || 0} MB (المستهلك: {customer.dataUsedMb || 0} MB)</div>
          </div>

          <label>
            اختر الباقة أو الشحن
            <select value={selectedPkgId} onChange={(e) => setSelectedPkgId(e.target.value)}>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.price} ر.ي ({p.dataLimitMb >= 1024 ? `${p.dataLimitMb / 1024} GB` : `${p.dataLimitMb} MB`})
                </option>
              ))}
              <option value="custom">شحن كمية ميجابايت مخصصة</option>
            </select>
          </label>

          {selectedPkgId === 'custom' && (
            <label>
              حجم البيانات (بالميجابايت MB)
              <input
                type="number"
                min="50"
                step="50"
                value={customMb}
                onChange={(e) => setCustomMb(Number(e.target.value))}
                placeholder="مثال: 1024"
                required
              />
            </label>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="button ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="button primary" disabled={saving}>
              {saving ? 'جارٍ الشحن...' : 'تأكيد الشحن وتحديث الراوتر'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
