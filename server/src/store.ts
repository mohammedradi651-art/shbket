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
  // Database starts completely clean with 0 dummy records.
}

// Pre-seed default network owner 770326828 and WanasahNet
const defaultOwnerId = 'usr_wanasah_owner';
const defaultNetworkId = 'net_wanasah_default';

const defaultOwner: StoredUser = {
  id: defaultOwnerId,
  name: 'محمد راضي (مالك شبكة وناسة نت)',
  phone: '770326828',
  role: 'network_owner',
  networkId: defaultNetworkId,
  networkName: 'شبكة وناسة نت',
  password: ''
};

const defaultNetwork: Network = {
  id: defaultNetworkId,
  ownerId: defaultOwnerId,
  name: 'شبكة وناسة نت',
  slug: 'wanasah-net',
  region: 'حضرموت',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z'
};

const defaultMikrotik: MikroTikDevice = {
  id: 'mtk_wanasah_default',
  networkId: defaultNetworkId,
  name: 'مايكروتك وناسة نت الرئيسي',
  host: '192.168.88.1',
  port: 8728,
  connectionType: 'routeros_api',
  status: 'online',
  createdAt: '2026-01-01T00:00:00.000Z'
};

users.set(defaultOwnerId, defaultOwner);
networks.set(defaultNetworkId, defaultNetwork);
mikrotiks.set('mtk_wanasah_default', defaultMikrotik);

export const store = { users, networks, mikrotiks, packages, vouchers, customers, resellers, transactions };
