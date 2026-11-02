import type { ApiResponse, AuthResponse, Customer, MikroTikDevice, Network, Package, Reseller, SessionUser, Transaction, Voucher } from '../../shared/types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('waselnet_token');
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? 'تعذر إكمال العملية.');
  return body;
}

export const api = {
  ownerRequestOtp: (payload: { name: string; phone: string; networkName: string; region: string }) => request<{ challengeId: string; expiresInSeconds: number }>('/auth/owner/request-otp', { method: 'POST', body: JSON.stringify(payload) }),
  ownerVerifyOtp: (payload: { challengeId: string; code: string }) => request<AuthResponse>('/auth/owner/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  ownerLoginRequestOtp: (payload: { phone: string }) => request<{ challengeId: string; expiresInSeconds: number }>('/auth/owner/login/request-otp', { method: 'POST', body: JSON.stringify(payload) }),
  ownerLoginVerifyOtp: (payload: { challengeId: string; code: string }) => request<AuthResponse>('/auth/owner/login/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request<{ user: SessionUser }>('/auth/me'),
  network: () => request<Network>('/networks/current'),
  dashboard: () => request<{ customers: number; activeCustomers: number; expiredCustomers: number; totalSales: number; todaySales: number; monthSales: number; resellers: number; connectedDevices: number; dataUsedGb: number }>('/dashboard/summary'),
  mikrotiks: () => request<MikroTikDevice[]>('/mikrotiks'),
  addMikrotik: (payload: { name: string; host: string; port: number; connectionType: 'routeros_api' | 'radius'; secret: string }) => request<MikroTikDevice>('/mikrotiks', { method: 'POST', body: JSON.stringify(payload) }),
  testMikrotik: (id: string) => request<{ device: MikroTikDevice; probe: { online: boolean; latencyMs: number; error?: string } }>(`/mikrotiks/${id}/test`, { method: 'POST' }),

  // Packages
  packages: () => request<Package[]>('/packages'),
  addPackage: (payload: Omit<Package, 'id' | 'networkId' | 'createdAt'>) => request<Package>('/packages', { method: 'POST', body: JSON.stringify(payload) }),
  deletePackage: (id: string) => request<{ success: boolean }>(`/packages/${id}`, { method: 'DELETE' }),

  // Vouchers
  vouchers: (filter?: { packageId?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filter?.packageId) params.append('packageId', filter.packageId);
    if (filter?.status) params.append('status', filter.status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Voucher[]>(`/vouchers${qs}`);
  },
  generateVouchers: (payload: { packageId: string; count: number; prefix?: string; digits?: number; resellerId?: string; syncToMikrotik?: boolean }) => request<{ vouchers: Voucher[]; count: number; syncedToMikrotik: boolean }>('/vouchers/generate', { method: 'POST', body: JSON.stringify(payload) }),

  // Customers
  customers: () => request<Customer[]>('/customers'),
  addCustomer: (payload: Omit<Customer, 'id' | 'networkId' | 'createdAt'>) => request<Customer>('/customers', { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomer: (id: string, payload: Partial<Customer>) => request<Customer>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Resellers
  resellers: () => request<Reseller[]>('/resellers'),
  addReseller: (payload: Omit<Reseller, 'id' | 'networkId' | 'createdAt'>) => request<Reseller>('/resellers', { method: 'POST', body: JSON.stringify(payload) }),
  topupReseller: (id: string, amount: number) => request<Reseller>(`/resellers/${id}/topup`, { method: 'POST', body: JSON.stringify({ amount }) }),

  // Transactions
  transactions: () => request<Transaction[]>('/transactions')
};
