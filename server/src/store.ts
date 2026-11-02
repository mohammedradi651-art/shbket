import fs from 'fs';
import path from 'path';
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

export function seedInitialData(_networkId: string) {
  // Clean initialization - real data persisted to file
}

const defaultOwnerId = 'usr_starmedia_owner';
const defaultNetworkId = 'net_starmedia_default';

const defaultOwner: StoredUser = {
  id: defaultOwnerId,
  name: 'محمد راضي (مالك شبكة ستار ميديا)',
  phone: '770326828',
  role: 'network_owner',
  networkId: defaultNetworkId,
  networkName: 'شبكة ستار ميديا',
  password: ''
};

const defaultNetwork: Network = {
  id: defaultNetworkId,
  ownerId: defaultOwnerId,
  name: 'شبكة ستار ميديا',
  slug: 'star-media',
  region: 'حضرموت',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z'
};

const defaultMikrotik: MikroTikDevice = {
  id: 'mtk_starmedia_default',
  networkId: defaultNetworkId,
  name: 'مايكروتك ستار ميديا الرئيسي',
  host: '192.168.88.1',
  port: 8728,
  connectionType: 'routeros_api',
  status: 'online',
  createdAt: '2026-01-01T00:00:00.000Z'
};

const dataFilePath = process.env.VERCEL
  ? path.join('/tmp', 'waselnet_store.json')
  : path.resolve(process.cwd(), 'server', 'data', 'store.json');

export function persistStore() {
  try {
    const data = {
      users: [...users.entries()],
      networks: [...networks.entries()],
      mikrotiks: [...mikrotiks.entries()],
      packages: [...packages.entries()],
      vouchers: [...vouchers.entries()],
      customers: [...customers.entries()],
      resellers: [...resellers.entries()],
      transactions: [...transactions.entries()]
    };
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to persist store:', err);
  }
}

export function loadStore() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) { users.clear(); data.users.forEach(([k, v]: [string, StoredUser]) => users.set(k, v)); }
      if (Array.isArray(data.networks)) { networks.clear(); data.networks.forEach(([k, v]: [string, Network]) => networks.set(k, v)); }
      if (Array.isArray(data.mikrotiks)) { mikrotiks.clear(); data.mikrotiks.forEach(([k, v]: [string, MikroTikDevice]) => mikrotiks.set(k, v)); }
      if (Array.isArray(data.packages)) { packages.clear(); data.packages.forEach(([k, v]: [string, Package]) => packages.set(k, v)); }
      if (Array.isArray(data.vouchers)) { vouchers.clear(); data.vouchers.forEach(([k, v]: [string, Voucher]) => vouchers.set(k, v)); }
      if (Array.isArray(data.customers)) { customers.clear(); data.customers.forEach(([k, v]: [string, Customer]) => customers.set(k, v)); }
      if (Array.isArray(data.resellers)) { resellers.clear(); data.resellers.forEach(([k, v]: [string, Reseller]) => resellers.set(k, v)); }
      if (Array.isArray(data.transactions)) { transactions.clear(); data.transactions.forEach(([k, v]: [string, Transaction]) => transactions.set(k, v)); }
    }
  } catch (err) {
    console.warn('Failed to load store from disk:', err);
  }
  // Ensure default owner and network always exist
  if (!users.has(defaultOwnerId)) users.set(defaultOwnerId, defaultOwner);
  if (!networks.has(defaultNetworkId)) networks.set(defaultNetworkId, defaultNetwork);
  if (!mikrotiks.has('mtk_starmedia_default')) mikrotiks.set('mtk_starmedia_default', defaultMikrotik);
}

// Initial load
loadStore();

export const store = { users, networks, mikrotiks, packages, vouchers, customers, resellers, transactions };
