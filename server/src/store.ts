import type { Customer, MikroTikDevice, Network, Package, Reseller, SessionUser, Transaction, Voucher } from '../../shared/types.js';

export type StoredUser = SessionUser & { password: string };

const users = new Map<string, StoredUser>();
const networks = new Map<string, Network>();
const mikrotiks = new Map<string, MikroTikDevice>();
const packages = new Map<string, Package>();
const vouchers = new Map<string, Voucher>();
const customers = new Map<string, Customer>();
const resellers = new Map<string, Reseller>();
const transactions = new Map<string, Transaction>();

export function seedInitialData(networkId: string) {
  const existingPkg = [...packages.values()].find((p) => p.networkId === networkId);
  if (existingPkg) return;

  const defaultPackages: Omit<Package, 'id' | 'networkId' | 'createdAt'>[] = [
    { name: 'باقة 500 ميجا', price: 100, dataLimitMb: 500, timeLimitMinutes: 720, validityDays: 1, speedLimit: '2M/2M', status: 'active', description: 'صالحة لمدة 12 ساعة' },
    { name: 'باقة 1 جيجا', price: 200, dataLimitMb: 1024, timeLimitMinutes: 1440, validityDays: 1, speedLimit: '3M/3M', status: 'active', description: 'صالحة لمدة 24 ساعة' },
    { name: 'باقة 5 جيجا', price: 500, dataLimitMb: 5120, timeLimitMinutes: 20160, validityDays: 14, speedLimit: '4M/4M', status: 'active', description: 'صالحة لمدة 14 يوم' },
    { name: 'باقة 10 جيجا', price: 1000, dataLimitMb: 10240, timeLimitMinutes: 43200, validityDays: 30, speedLimit: '5M/5M', status: 'active', description: 'صالحة لمدة 30 يوم' },
    { name: 'باقة 15 جيجا', price: 1500, dataLimitMb: 15360, timeLimitMinutes: 43200, validityDays: 30, speedLimit: '5M/5M', status: 'active', description: 'صالحة لمدة شهر' },
    { name: 'باقة 25 جيجا', price: 2500, dataLimitMb: 25600, timeLimitMinutes: 43200, validityDays: 30, speedLimit: '6M/6M', status: 'active', description: 'صالحة لمدة شهر' },
    { name: 'باقة 30 جيجا', price: 3000, dataLimitMb: 30720, timeLimitMinutes: 43200, validityDays: 30, speedLimit: '6M/6M', status: 'active', description: 'صالحة لمدة شهر كامل' },
    { name: 'باقة 50 جيجا', price: 5000, dataLimitMb: 51200, timeLimitMinutes: 43200, validityDays: 30, speedLimit: '8M/8M', status: 'active', description: 'باقة الشركات والأعمال' },
  ];

  const pkgIds: string[] = [];
  defaultPackages.forEach((pkg, idx) => {
    const id = `pkg_${networkId}_${idx + 1}`;
    pkgIds.push(id);
    packages.set(id, {
      ...pkg,
      id,
      networkId,
      activeCardsCount: idx === 0 ? 12 : idx === 1 ? 25 : idx === 3 ? 18 : 8,
      createdAt: new Date(Date.now() - (10 - idx) * 86400000).toISOString()
    });
  });

  const defaultResellers: Omit<Reseller, 'id' | 'networkId' | 'createdAt'>[] = [
    { name: 'مقهى وناسة (المركز الرئيسي)', ownerName: 'أحمد بن علي', phone: '770326828', region: 'شبام', balance: 45000, totalSales: 320000, cardsSold: 420, commissionPercent: 10, status: 'active' },
    { name: 'بقالة البركة', ownerName: 'سالم باوزير', phone: '771239988', region: 'الجولة', balance: 22000, totalSales: 165000, cardsSold: 210, commissionPercent: 10, status: 'active' },
    { name: 'سوبر ماركت البر', ownerName: 'عمر الكثيري', phone: '777884411', region: 'النورس', balance: 35000, totalSales: 240000, cardsSold: 315, commissionPercent: 10, status: 'active' },
    { name: 'بقالة طيب وباعشرة', ownerName: 'فهد باعشرة', phone: '773112233', region: 'السحيل', balance: 15000, totalSales: 98000, cardsSold: 130, commissionPercent: 10, status: 'active' },
    { name: 'مركز الأمل للاتصالات', ownerName: 'صالح النهدي', phone: '775556677', region: 'السوق العام', balance: 50000, totalSales: 410000, cardsSold: 510, commissionPercent: 12, status: 'active' },
  ];

  const resIds: string[] = [];
  defaultResellers.forEach((res, idx) => {
    const id = `res_${networkId}_${idx + 1}`;
    resIds.push(id);
    resellers.set(id, {
      ...res,
      id,
      networkId,
      createdAt: new Date(Date.now() - (20 - idx) * 86400000).toISOString()
    });
  });

  const defaultCustomers: Omit<Customer, 'id' | 'networkId' | 'createdAt'>[] = [
    { name: 'مشترك 770326828', phone: '770326828', activePackage: 'باقة 500 ميجا', dataTotalMb: 500, dataUsedMb: 142, uptimeUsedMinutes: 18, status: 'active', ipAddress: '192.168.88.254', macAddress: '6C:3B:6B:22:52:EE', connectedAt: new Date(Date.now() - 18 * 60000).toISOString(), expiresAt: new Date(Date.now() + 702 * 60000).toISOString(), lastSeen: new Date().toISOString() },
    { name: 'عبدالله باصريح', phone: '772114455', activePackage: 'باقة 10 جيجا', dataTotalMb: 10240, dataUsedMb: 4320, uptimeUsedMinutes: 240, status: 'active', ipAddress: '192.168.88.230', macAddress: '88:75:56:4A:12:33', connectedAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: new Date(Date.now() + 25 * 86400000).toISOString(), lastSeen: new Date().toISOString() },
    { name: 'خالد التميمي', phone: '774889900', activePackage: 'باقة 5 جيجا', dataTotalMb: 5120, dataUsedMb: 5120, uptimeUsedMinutes: 600, status: 'expired', expiresAt: new Date(Date.now() - 86400000).toISOString(), lastSeen: new Date(Date.now() - 86400000).toISOString() },
    { name: 'ياسر العطاس', phone: '776332211', activePackage: 'باقة 1 جيجا', dataTotalMb: 1024, dataUsedMb: 760, uptimeUsedMinutes: 90, status: 'active', ipAddress: '192.168.88.215', macAddress: 'DC:A6:32:98:B1:FF', connectedAt: new Date(Date.now() - 5400000).toISOString(), expiresAt: new Date(Date.now() + 18 * 3600000).toISOString(), lastSeen: new Date().toISOString() },
    { name: 'هاني بن دحمان', phone: '771009988', activePackage: 'باقة 25 جيجا', dataTotalMb: 25600, dataUsedMb: 18900, uptimeUsedMinutes: 1420, status: 'active', ipAddress: '192.168.88.198', macAddress: '54:E4:3A:45:90:7E', connectedAt: new Date(Date.now() - 7200000).toISOString(), expiresAt: new Date(Date.now() + 12 * 86400000).toISOString(), lastSeen: new Date().toISOString() },
  ];

  defaultCustomers.forEach((cust, idx) => {
    const id = `cust_${networkId}_${idx + 1}`;
    customers.set(id, {
      ...cust,
      id,
      networkId,
      createdAt: new Date(Date.now() - (15 - idx) * 86400000).toISOString()
    });
  });

  const defaultVouchers: Omit<Voucher, 'id' | 'networkId' | 'createdAt'>[] = [
    { code: '770326828', packageId: pkgIds[0], packageName: 'باقة 500 ميجا', price: 100, dataLimitMb: 500, timeLimitMinutes: 720, resellerId: resIds[0], resellerName: 'مقهى وناسة (المركز الرئيسي)', status: 'used', usedAt: new Date(Date.now() - 30 * 60000).toISOString(), usedBy: '770326828', syncedToMikrotik: true },
    { code: '84920194', packageId: pkgIds[1], packageName: 'باقة 1 جيجا', price: 200, dataLimitMb: 1024, timeLimitMinutes: 1440, resellerId: resIds[1], resellerName: 'بقالة البركة', status: 'available', syncedToMikrotik: true },
    { code: '84920195', packageId: pkgIds[1], packageName: 'باقة 1 جيجا', price: 200, dataLimitMb: 1024, timeLimitMinutes: 1440, resellerId: resIds[1], resellerName: 'بقالة البركة', status: 'available', syncedToMikrotik: true },
    { code: '84920196', packageId: pkgIds[1], packageName: 'باقة 1 جيجا', price: 200, dataLimitMb: 1024, timeLimitMinutes: 1440, resellerId: resIds[1], resellerName: 'بقالة البركة', status: 'available', syncedToMikrotik: true },
    { code: '59201481', packageId: pkgIds[2], packageName: 'باقة 5 جيجا', price: 500, dataLimitMb: 5120, timeLimitMinutes: 20160, resellerId: resIds[2], resellerName: 'سوبر ماركت البر', status: 'available', syncedToMikrotik: true },
    { code: '59201482', packageId: pkgIds[2], packageName: 'باقة 5 جيجا', price: 500, dataLimitMb: 5120, timeLimitMinutes: 20160, resellerId: resIds[2], resellerName: 'سوبر ماركت البر', status: 'available', syncedToMikrotik: true },
    { code: '10928374', packageId: pkgIds[3], packageName: 'باقة 10 جيجا', price: 1000, dataLimitMb: 10240, timeLimitMinutes: 43200, resellerId: resIds[4], resellerName: 'مركز الأمل للاتصالات', status: 'available', syncedToMikrotik: true },
    { code: '10928375', packageId: pkgIds[3], packageName: 'باقة 10 جيجا', price: 1000, dataLimitMb: 10240, timeLimitMinutes: 43200, resellerId: resIds[4], resellerName: 'مركز الأمل للاتصالات', status: 'available', syncedToMikrotik: true },
    { code: '25983711', packageId: pkgIds[5], packageName: 'باقة 25 جيجا', price: 2500, dataLimitMb: 25600, timeLimitMinutes: 43200, resellerId: resIds[0], resellerName: 'مقهى وناسة (المركز الرئيسي)', status: 'available', syncedToMikrotik: true },
  ];

  defaultVouchers.forEach((vch, idx) => {
    const id = `vch_${networkId}_${idx + 1}`;
    vouchers.set(id, {
      ...vch,
      id,
      networkId,
      createdAt: new Date(Date.now() - (idx + 1) * 3600000).toISOString()
    });
  });

  const defaultTransactions: Omit<Transaction, 'id' | 'networkId' | 'createdAt'>[] = [
    { type: 'voucher_sale', amount: 1000, description: 'بيع كرت باقة 10 جيجا', resellerId: resIds[4], resellerName: 'مركز الأمل للاتصالات', packageId: pkgIds[3], packageName: 'باقة 10 جيجا' },
    { type: 'voucher_sale', amount: 500, description: 'بيع كرت باقة 5 جيجا', resellerId: resIds[2], resellerName: 'سوبر ماركت البر', packageId: pkgIds[2], packageName: 'باقة 5 جيجا' },
    { type: 'reseller_topup', amount: 20000, description: 'شحن رصيد بقالة البركة', resellerId: resIds[1], resellerName: 'بقالة البركة' },
    { type: 'voucher_sale', amount: 200, description: 'بيع كرت باقة 1 جيجا', resellerId: resIds[1], resellerName: 'بقالة البركة', packageId: pkgIds[1], packageName: 'باقة 1 جيجا' },
    { type: 'voucher_sale', amount: 100, description: 'بيع كرت باقة 500 ميجا', resellerId: resIds[0], resellerName: 'مقهى وناسة (المركز الرئيسي)', customerId: `cust_${networkId}_1`, customerName: 'مشترك 770326828', packageId: pkgIds[0], packageName: 'باقة 500 ميجا' },
    { type: 'reseller_topup', amount: 30000, description: 'شحن رصيد مقهى وناسة الرئيسي', resellerId: resIds[0], resellerName: 'مقهى وناسة (المركز الرئيسي)' },
  ];

  defaultTransactions.forEach((tx, idx) => {
    const id = `tx_${networkId}_${idx + 1}`;
    transactions.set(id, {
      ...tx,
      id,
      networkId,
      createdAt: new Date(Date.now() - (idx * 2 + 1) * 3600000).toISOString()
    });
  });
}

export const store = { users, networks, mikrotiks, packages, vouchers, customers, resellers, transactions };
