import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Network, Transaction } from '../../../shared/types';
import { ArrowUpRight, CheckCircle2, DollarSign, Filter, RefreshCw, Search, Ticket, Wallet } from 'lucide-react';

const formatNumber = (value: number) => new Intl.NumberFormat('ar-YE').format(value);
const formatMoney = (value: number) => `${formatNumber(value)} ر.ي`;

export function TransactionsView({ network }: { network: Network | null }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.transactions();
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const todayAmount = transactions
    .filter((t) => new Date(t.createdAt).getTime() >= startOfDay.getTime())
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const filtered = transactions.filter((t) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      t.description.toLowerCase().includes(term) ||
      (t.resellerName && t.resellerName.toLowerCase().includes(term)) ||
      (t.customerName && t.customerName.toLowerCase().includes(term)) ||
      (t.packageName && t.packageName.toLowerCase().includes(term));
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="transactions-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">السجل المالي والمحاسبي</span>
          <h1>سجل العمليات والمبيعات</h1>
          <p>سجل دقيق لجميع حركات بيع الكروت، شحن أرصدة نقاط البيع، واشتراكات شبكة {network?.name ?? 'وناسة نت'}.</p>
        </div>
      </div>

      <div className="quick-metrics-strip">
        <div className="quick-metric">
          <div className="quick-metric-icon green"><DollarSign size={20} /></div>
          <div className="quick-metric-info">
            <small>إجمالي المبيعات</small>
            <strong>{formatMoney(totalAmount)}</strong>
          </div>
        </div>
        <div className="quick-metric">
          <div className="quick-metric-icon orange"><ArrowUpRight size={20} /></div>
          <div className="quick-metric-info">
            <small>مبيعات اليوم</small>
            <strong>{formatMoney(todayAmount)}</strong>
          </div>
        </div>
        <div className="quick-metric">
          <div className="quick-metric-icon blue"><Ticket size={20} /></div>
          <div className="quick-metric-info">
            <small>إجمالي العمليات المسجلة</small>
            <strong>{formatNumber(transactions.length)} عملية</strong>
          </div>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} color="#8591a2" />
          <input
            placeholder="ابحث في تفاصيل العمليات أو أسماء البقالات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">كل أنواع العمليات</option>
            <option value="voucher_sale">مبيعات كروت</option>
            <option value="reseller_topup">شحن رصيد بقالة</option>
            <option value="subscription_renew">تجديد اشتراك</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty-view">
          <span>جارٍ تحميل سجل العمليات...</span>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>نوع العملية</th>
                <th>بيان وتفاصيل العملية</th>
                <th>الطرف المستفيد</th>
                <th>المبلغ</th>
                <th>التاريخ والوقت</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#8894a3' }}>
                    لا توجد عمليات مسجلة مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span
                        className="package-card-badge"
                        style={{
                          background: tx.type === 'reseller_topup' ? '#e8f6ee' : tx.type === 'voucher_sale' ? '#fff2e7' : '#eef2fa',
                          color: tx.type === 'reseller_topup' ? '#35855c' : tx.type === 'voucher_sale' ? 'var(--orange)' : '#416ea4'
                        }}
                      >
                        {tx.type === 'reseller_topup' ? 'شحن رصيد' : tx.type === 'voucher_sale' ? 'بيع كرت' : 'تجديد باقة'}
                      </span>
                    </td>
                    <td>
                      <b>{tx.description}</b>
                    </td>
                    <td>
                      {tx.resellerName ? (
                        <span>{tx.resellerName}</span>
                      ) : tx.customerName ? (
                        <span>{tx.customerName}</span>
                      ) : (
                        <span style={{ color: '#8c98a7' }}>المركز الرئيسي</span>
                      )}
                    </td>
                    <td>
                      <strong style={{ fontFamily: 'Manrope', color: '#25764f', fontSize: '14px' }}>
                        +{formatMoney(tx.amount)}
                      </strong>
                    </td>
                    <td>
                      <small style={{ color: '#7e8a9b' }}>
                        {new Date(tx.createdAt).toLocaleString('ar-YE', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </small>
                    </td>
                    <td>
                      <span className="status-pill active">
                        <i /> مكتملة
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
