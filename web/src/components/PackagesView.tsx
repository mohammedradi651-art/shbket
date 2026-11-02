import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Network, Package, Reseller, Voucher } from '../../../shared/types';
import { ArrowLeft, Check, HardDrive, Package as PackageIcon, Plus, Printer, RadioTower, Search, Sparkles, Ticket, Trash2, X } from 'lucide-react';
import { PrintVouchersModal } from './PrintVouchersModal';

const formatNumber = (value: number) => new Intl.NumberFormat('ar-YE').format(value);
const formatMoney = (value: number) => `${formatNumber(value)} ر.ي`;

export function PackagesView({ network }: { network: Network | null }) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'packages' | 'vouchers'>('packages');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPkgForGen, setSelectedPkgForGen] = useState<string>('');

  const [searchCode, setSearchCode] = useState('');
  const [filterPackage, setFilterPackage] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pkgsRes, vchsRes, resRes] = await Promise.all([
        api.packages(),
        api.vouchers(),
        api.resellers()
      ]);
      setPackages(pkgsRes.data);
      setVouchers(vchsRes.data);
      setResellers(resRes.data);
    } catch (err) {
      console.error('Failed to load package data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeletePackage = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    try {
      await api.deletePackage(id);
      setPackages((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'تعذر حذف الباقة.');
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch = !searchCode || v.code.includes(searchCode);
    const matchesPkg = filterPackage === 'all' || v.packageId === filterPackage;
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    return matchesSearch && matchesPkg && matchesStatus;
  });

  return (
    <div className="packages-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">إدارة الاشتراكات والمبيعات</span>
          <h1>الباقات وإصدار الكروت</h1>
          <p>إدارة باقات شبكة {network?.name ?? 'وناسة نت'}، توليد كروت الشحن، وطباعتها للبيع المباشر والبقالات.</p>
        </div>
        <div className="toolbar-actions">
          <button className="button light" onClick={() => setShowPrintModal(true)}>
            <Printer size={16} /> طباعة الكروت ({filteredVouchers.length})
          </button>
          <button
            className="button light"
            onClick={() => {
              if (packages.length > 0) setSelectedPkgForGen(packages[0].id);
              setShowGenModal(true);
            }}
          >
            <Sparkles size={16} color="var(--orange)" /> توليد كروت جديدة
          </button>
          <button className="button primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> إضافة باقة جديدة
          </button>
        </div>
      </div>

      <div className="view-tabs">
        <button
          className={activeTab === 'packages' ? 'view-tab active' : 'view-tab'}
          onClick={() => setActiveTab('packages')}
        >
          <PackageIcon size={16} />
          <span>الباقات النشطة</span>
          <span className="badge">{packages.length}</span>
        </button>
        <button
          className={activeTab === 'vouchers' ? 'view-tab active' : 'view-tab'}
          onClick={() => setActiveTab('vouchers')}
        >
          <Ticket size={16} />
          <span>سجل ومخزون الكروت</span>
          <span className="badge">{vouchers.length}</span>
        </button>
      </div>

      {loading ? (
        <div className="empty-view">
          <span>جارٍ تحميل الباقات والكروت...</span>
        </div>
      ) : activeTab === 'packages' ? (
        <div className="package-grid">
          {packages.map((pkg) => (
            <div className="package-card" key={pkg.id}>
              <div>
                <div className="package-card-header">
                  <div>
                    <h3>{pkg.name}</h3>
                    <p>{pkg.description || 'باقة إنترنت هوت سبوت'}</p>
                  </div>
                  <span className="package-card-badge">
                    {pkg.dataLimitMb >= 1024 ? `${pkg.dataLimitMb / 1024} GB` : `${pkg.dataLimitMb} MB`}
                  </span>
                </div>

                <div className="package-price">
                  {formatNumber(pkg.price)}
                  <small>ر.ي</small>
                </div>

                <div className="package-specs">
                  <div className="package-spec-item">
                    <span>حجم البيانات</span>
                    <b>{pkg.dataLimitMb >= 1024 ? `${pkg.dataLimitMb / 1024} جيجابايت` : `${pkg.dataLimitMb} ميجابايت`}</b>
                  </div>
                  <div className="package-spec-item">
                    <span>فترة الصلاحية</span>
                    <b>{pkg.validityDays > 1 ? `${pkg.validityDays} أيام` : '24 ساعة'}</b>
                  </div>
                  <div className="package-spec-item">
                    <span>حد السرعة</span>
                    <b>{pkg.speedLimit || 'غير محدد'}</b>
                  </div>
                  <div className="package-spec-item">
                    <span>الكروت النشطة</span>
                    <b style={{ color: 'var(--orange)' }}>{pkg.activeCardsCount || 0} كرت</b>
                  </div>
                </div>
              </div>

              <div className="package-card-footer">
                <button
                  className="button primary compact"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setSelectedPkgForGen(pkg.id);
                    setShowGenModal(true);
                  }}
                >
                  <Ticket size={15} /> توليد كروت
                </button>
                <button
                  className="icon-button"
                  style={{ color: '#d1583c' }}
                  onClick={() => handleDeletePackage(pkg.id)}
                  title="حذف الباقة"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="table-toolbar">
            <div className="search-box">
              <Search size={16} color="#8591a2" />
              <input
                placeholder="ابحث برقم الكرت..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <select
                className="filter-select"
                value={filterPackage}
                onChange={(e) => setFilterPackage(e.target.value)}
              >
                <option value="all">كل الباقات</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatMoney(p.price)})
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">كل الحالات</option>
                <option value="available">متاح للبيع</option>
                <option value="used">مستخدم</option>
              </select>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الكرت / الكود</th>
                  <th>الباقة</th>
                  <th>السعر</th>
                  <th>البقالة / النقطة</th>
                  <th>الحالة</th>
                  <th>المايكروتك</th>
                  <th>تاريخ التوليد</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#8894a3' }}>
                      لا توجد كروت مطابقة للفلاتر المحددة.
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <span className="voucher-code-badge">{v.code}</span>
                      </td>
                      <td><b>{v.packageName}</b></td>
                      <td>{formatMoney(v.price)}</td>
                      <td>{v.resellerName || 'المركز الرئيسي'}</td>
                      <td>
                        <span className={`status-pill ${v.status}`}>
                          <i /> {v.status === 'available' ? 'متاح' : 'مستخدم'}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#4a8f6d' }}>
                          <Check size={14} /> متزامن
                        </span>
                      </td>
                      <td>{new Date(v.createdAt).toLocaleDateString('ar-YE')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddPackageModal
          onClose={() => setShowAddModal(false)}
          onAdded={(newPkg) => {
            setPackages([...packages, newPkg]);
            setShowAddModal(false);
          }}
        />
      )}

      {showGenModal && (
        <GenerateVouchersModal
          packages={packages}
          resellers={resellers}
          initialPackageId={selectedPkgForGen}
          onClose={() => setShowGenModal(false)}
          onGenerated={() => {
            setShowGenModal(false);
            loadData();
          }}
        />
      )}

      {showPrintModal && (
        <PrintVouchersModal
          vouchers={filteredVouchers.slice(0, 100)}
          networkName={network?.name ?? 'وناسة نت'}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}

function AddPackageModal({
  onClose,
  onAdded
}: {
  onClose: () => void;
  onAdded: (pkg: Package) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    price: '200',
    dataLimitMb: '1024',
    timeLimitMinutes: '1440',
    validityDays: '1',
    speedLimit: '3M/3M',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.addPackage({
        name: form.name,
        price: Number(form.price),
        dataLimitMb: Number(form.dataLimitMb),
        timeLimitMinutes: Number(form.timeLimitMinutes),
        validityDays: Number(form.validityDays),
        speedLimit: form.speedLimit,
        description: form.description,
        status: 'active'
      });
      onAdded(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الباقة.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h2>إضافة باقة إنترنت جديدة</h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="modal-form" onSubmit={submit}>
          <label>
            اسم الباقة
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: باقة 2 جيجا السريعة"
              required
            />
          </label>
          <div className="form-row">
            <label>
              السعر (ر.ي)
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </label>
            <label>
              حجم البيانات (ميجابايت)
              <input
                type="number"
                value={form.dataLimitMb}
                onChange={(e) => setForm({ ...form, dataLimitMb: e.target.value })}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              صلاحية الاستخدام (بالدقائق)
              <input
                type="number"
                value={form.timeLimitMinutes}
                onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })}
                required
              />
            </label>
            <label>
              صلاحية الكرت (بالأيام)
              <input
                type="number"
                value={form.validityDays}
                onChange={(e) => setForm({ ...form, validityDays: e.target.value })}
                required
              />
            </label>
          </div>
          <label>
            حد السرعة (Rate Limit)
            <input
              dir="ltr"
              value={form.speedLimit}
              onChange={(e) => setForm({ ...form, speedLimit: e.target.value })}
              placeholder="مثال: 3M/3M"
            />
          </label>
          <label>
            وصف الباقة
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="صالحة لمدة 24 ساعة لجميع المواقع"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="button ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="button primary" disabled={saving}>
              {saving ? 'جارٍ الحفظ...' : 'حفظ الباقة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GenerateVouchersModal({
  packages,
  resellers,
  initialPackageId,
  onClose,
  onGenerated
}: {
  packages: Package[];
  resellers: Reseller[];
  initialPackageId: string;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [packageId, setPackageId] = useState(initialPackageId || packages[0]?.id || '');
  const [count, setCount] = useState('20');
  const [prefix, setPrefix] = useState('');
  const [resellerId, setResellerId] = useState('');
  const [syncToMikrotik, setSyncToMikrotik] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    try {
      const res = await api.generateVouchers({
        packageId,
        count: Number(count),
        prefix,
        resellerId: resellerId || undefined,
        syncToMikrotik
      });
      setSuccessMsg(`تم توليد ${res.data.count} كرت بنجاح! ${res.data.syncedToMikrotik ? 'وتمت المزامنة مع راوتر MikroTik.' : ''}`);
      setTimeout(() => {
        onGenerated();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر توليد الكروت.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h2>توليد كروت شحن ورقية جديدة</h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="modal-form" onSubmit={submit}>
          <label>
            اختر الباقة
            <select value={packageId} onChange={(e) => setPackageId(e.target.value)} required>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {formatMoney(p.price)} ({p.dataLimitMb >= 1024 ? `${p.dataLimitMb / 1024} GB` : `${p.dataLimitMb} MB`})
                </option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label>
              عدد الكروت المراد توليدها
              <select value={count} onChange={(e) => setCount(e.target.value)}>
                <option value="10">10 كروت</option>
                <option value="20">20 كرت</option>
                <option value="50">50 كرت</option>
                <option value="100">100 كرت</option>
              </select>
            </label>
            <label>
              بادئة الكرت (اختياري)
              <input
                dir="ltr"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="مثال: 77 أو فارغ"
              />
            </label>
          </div>

          <label>
            تخصيص لبقالة أو نقطة بيع (اختياري)
            <select value={resellerId} onChange={(e) => setResellerId(e.target.value)}>
              <option value="">بدون تخصيص (المركز الرئيسي)</option>
              {resellers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} - {r.region}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: '6px 0' }}>
            <input
              type="checkbox"
              checked={syncToMikrotik}
              onChange={(e) => setSyncToMikrotik(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <span style={{ fontSize: '12px' }}>مزامنة الكروت فورياً مع راوتر MikroTik المتصل</span>
          </label>

          {error && <div className="form-error">{error}</div>}
          {successMsg && <div className="form-success">{successMsg}</div>}

          <div className="modal-actions">
            <button type="button" className="button ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="button primary" disabled={generating}>
              {generating ? 'جارٍ التوليد...' : 'توليد الكروت الآن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
