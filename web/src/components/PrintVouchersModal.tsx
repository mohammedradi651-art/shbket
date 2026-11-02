import type { Voucher } from '../../../shared/types';
import { Printer, X } from 'lucide-react';

const formatMoney = (value: number) => `${new Intl.NumberFormat('ar-YE').format(value)} ر.ي`;

export function PrintVouchersModal({
  vouchers,
  networkName,
  onClose
}: {
  vouchers: Voucher[];
  networkName: string;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="print-modal-container">
        <div className="print-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="package-card-badge">جاهز للطباعة ({vouchers.length} كرت)</span>
            <h2 style={{ margin: 0, fontSize: '16px', color: 'var(--navy)' }}>معاينة كروت الشحن الورقية</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="button primary compact" onClick={() => window.print()}>
              <Printer size={16} /> طباعة الكروت (A4)
            </button>
            <button className="icon-button" onClick={onClose} aria-label="إغلاق">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="print-modal-body">
          <div className="print-sheet">
            {vouchers.map((voucher) => (
              <div className="printable-card" key={voucher.id}>
                <div className="printable-card-top">
                  <div className="printable-card-brand">
                    <span className="brand-mark small">و</span>
                    <span>{networkName || 'وناسة نت - Wanasah Net'}</span>
                  </div>
                  <span className="printable-card-pkg">{voucher.packageName}</span>
                </div>
                <div className="printable-card-body">
                  <div className="printable-card-code-section">
                    <div className="printable-card-code-label">رقم الكرت / كود الدخول:</div>
                    <div className="printable-card-code">{voucher.code}</div>
                  </div>
                  <img
                    className="printable-card-qr"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('http://n.com/login?username=' + voucher.code)}`}
                    alt="QR"
                    loading="lazy"
                  />
                </div>
                <div className="printable-card-footer">
                  <span>صفحة الدخول: <b>http://n.com</b></span>
                  <span>البيانات: <b>{voucher.dataLimitMb >= 1024 ? `${voucher.dataLimitMb / 1024} GB` : `${voucher.dataLimitMb} MB`}</b></span>
                  <span>السعر: <b>{formatMoney(voucher.price)}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
