export type Role = 'super_admin' | 'network_owner' | 'reseller';

export type Network = {
  id: string;
  ownerId: string;
  name: string;
  region: string;
  slug: string;
  status: 'active' | 'suspended';
  createdAt: string;
};

export type MikroTikConnectionType = 'routeros_api' | 'radius';
export type MikroTikDevice = {
  id: string;
  networkId: string;
  name: string;
  host: string;
  port: number;
  connectionType: MikroTikConnectionType;
  status: 'pending' | 'online' | 'offline';
  createdAt: string;
};

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  role: Role;
  networkId?: string;
  networkName?: string;
};

export type AuthResponse = { user: SessionUser; token: string; network?: Network };

export type ApiResponse<T> = { data: T; meta?: { source?: 'firestore' | 'memory' } };

export type Package = {
  id: string;
  networkId: string;
  name: string;
  price: number;
  dataLimitMb: number;
  timeLimitMinutes: number;
  validityDays: number;
  speedLimit?: string;
  status: 'active' | 'archived';
  description?: string;
  activeCardsCount?: number;
  createdAt: string;
};

export type Voucher = {
  id: string;
  networkId: string;
  code: string;
  pin?: string;
  packageId: string;
  packageName: string;
  price: number;
  dataLimitMb: number;
  timeLimitMinutes: number;
  resellerId?: string;
  resellerName?: string;
  status: 'available' | 'used' | 'expired';
  usedAt?: string;
  usedBy?: string;
  createdAt: string;
  syncedToMikrotik?: boolean;
};

export type Customer = {
  id: string;
  networkId: string;
  name: string;
  phone: string;
  activePackage?: string;
  dataTotalMb: number;
  dataUsedMb: number;
  uptimeUsedMinutes: number;
  status: 'active' | 'expired' | 'blocked';
  ipAddress?: string;
  macAddress?: string;
  connectedAt?: string;
  expiresAt?: string;
  lastSeen?: string;
  createdAt: string;
};

export type Reseller = {
  id: string;
  networkId: string;
  name: string;
  ownerName: string;
  phone: string;
  region: string;
  balance: number;
  totalSales: number;
  cardsSold: number;
  commissionPercent: number;
  status: 'active' | 'inactive';
  createdAt: string;
};

export type Transaction = {
  id: string;
  networkId: string;
  type: 'voucher_sale' | 'reseller_topup' | 'subscription_renew';
  amount: number;
  description: string;
  resellerId?: string;
  resellerName?: string;
  customerId?: string;
  customerName?: string;
  packageId?: string;
  packageName?: string;
  createdAt: string;
};
