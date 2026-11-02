import type { Customer, MikroTikDevice, Network, Package, Reseller, SessionUser, Transaction, Voucher } from '../../shared/types.js';
import { config } from './config.js';
import { seedInitialData, store, type StoredUser } from './store.js';

export type UserRecord = SessionUser & { passwordHash: string };
export type OwnerInput = { name: string; phone: string; passwordHash: string; networkName: string; region: string };
export type DashboardSummary = { customers: number; activeCustomers: number; expiredCustomers: number; totalSales: number; todaySales: number; monthSales: number; resellers: number; connectedDevices: number; dataUsedGb: number };
export type MikroTikInput = Omit<MikroTikDevice, 'id' | 'status' | 'createdAt'> & { encryptedSecret: string };

export interface Repository {
  findUserByPhone(phone: string): Promise<UserRecord | undefined>;
  findUserById(id: string): Promise<UserRecord | undefined>;
  getNetwork(id: string): Promise<Network | undefined>;
  findNetwork(identifier: string): Promise<Network | undefined>;
  createOwner(input: OwnerInput): Promise<{ user: UserRecord; network: Network }>;
  getDashboardSummary(networkId: string): Promise<DashboardSummary>;
  listMikroTiks(networkId: string): Promise<MikroTikDevice[]>;
  findMikroTikById(id: string): Promise<MikroTikDevice | undefined>;
  createMikroTik(input: MikroTikInput): Promise<MikroTikDevice>;
  updateMikroTikStatus(id: string, status: 'pending' | 'online' | 'offline'): Promise<MikroTikDevice | undefined>;

  // Packages
  listPackages(networkId: string): Promise<Package[]>;
  createPackage(input: Omit<Package, 'id' | 'createdAt'>): Promise<Package>;
  deletePackage(id: string): Promise<boolean>;

  // Vouchers
  listVouchers(networkId: string, filter?: { packageId?: string; status?: string }): Promise<Voucher[]>;
  createVouchersBatch(vouchers: Omit<Voucher, 'id' | 'createdAt'>[]): Promise<Voucher[]>;

  // Customers
  listCustomers(networkId: string): Promise<Customer[]>;
  createCustomer(input: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>;
  updateCustomer(id: string, input: Partial<Customer>): Promise<Customer | undefined>;

  // Resellers
  listResellers(networkId: string): Promise<Reseller[]>;
  createReseller(input: Omit<Reseller, 'id' | 'createdAt'>): Promise<Reseller>;
  topupReseller(id: string, amount: number): Promise<Reseller | undefined>;

  // Transactions
  listTransactions(networkId: string): Promise<Transaction[]>;
  createTransaction(input: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
}

export class MemoryRepository implements Repository {
  async findUserByPhone(phone: string) {
    const user = [...store.users.values()].find((candidate) => candidate.phone === phone);
    return user ? ({ ...user, passwordHash: user.password } as UserRecord) : undefined;
  }

  async findUserById(id: string) {
    const user = store.users.get(id);
    return user ? ({ ...user, passwordHash: user.password } as UserRecord) : undefined;
  }

  async getNetwork(id: string) {
    seedInitialData(id);
    return store.networks.get(id);
  }

  async findNetwork(identifier: string) {
    const net = [...store.networks.values()].find((network) => network.id === identifier || network.slug === identifier || network.name === identifier);
    if (net) seedInitialData(net.id);
    return net;
  }

  async createOwner(input: OwnerInput) {
    const userId = `usr_${Date.now()}`;
    const networkId = `net_${Date.now()}`;
    const network: Network = {
      id: networkId,
      ownerId: userId,
      name: input.networkName,
      region: input.region,
      slug: input.networkName.toLowerCase().replace(/\s+/g, '-'),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    const user: UserRecord = {
      id: userId,
      name: input.name,
      phone: input.phone,
      passwordHash: input.passwordHash,
      role: 'network_owner',
      networkId,
      networkName: network.name
    };
    const stored: StoredUser = { ...user, password: input.passwordHash };
    store.users.set(userId, stored);
    store.networks.set(networkId, network);
    seedInitialData(networkId);
    return { user, network };
  }

  async getDashboardSummary(networkId: string): Promise<DashboardSummary> {
    seedInitialData(networkId);
    const customers = [...store.customers.values()].filter((c) => c.networkId === networkId);
    const resellers = [...store.resellers.values()].filter((r) => r.networkId === networkId);
    const transactions = [...store.transactions.values()].filter((t) => t.networkId === networkId);
    const devices = [...store.mikrotiks.values()].filter((d) => d.networkId === networkId);

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    let totalSales = 0, todaySales = 0, monthSales = 0;
    for (const t of transactions) {
      totalSales += t.amount;
      const ts = new Date(t.createdAt).getTime();
      if (ts >= startOfDay.getTime()) todaySales += t.amount;
      if (ts >= startOfMonth.getTime()) monthSales += t.amount;
    }

    const activeCustomers = customers.filter((c) => c.status === 'active').length;
    const expiredCustomers = customers.filter((c) => c.status === 'expired').length;
    const connectedDevices = devices.filter((d) => d.status === 'online').length || activeCustomers;
    const dataUsedGb = Math.round(customers.reduce((sum, c) => sum + (c.dataUsedMb || 0), 0) / 1024 * 10) / 10;

    return {
      customers: customers.length,
      activeCustomers,
      expiredCustomers,
      totalSales,
      todaySales,
      monthSales,
      resellers: resellers.length,
      connectedDevices,
      dataUsedGb
    };
  }

  async listMikroTiks(networkId: string) {
    return [...store.mikrotiks.values()].filter((device) => device.networkId === networkId);
  }

  async findMikroTikById(id: string) {
    return store.mikrotiks.get(id);
  }

  async createMikroTik(input: MikroTikInput) {
    const device: MikroTikDevice = {
      id: `mik_${Date.now()}`,
      ...input,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    store.mikrotiks.set(device.id, device);
    return device;
  }

  async updateMikroTikStatus(id: string, status: 'pending' | 'online' | 'offline') {
    const existing = store.mikrotiks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status };
    store.mikrotiks.set(id, updated);
    return updated;
  }

  async listPackages(networkId: string): Promise<Package[]> {
    seedInitialData(networkId);
    return [...store.packages.values()].filter((p) => p.networkId === networkId);
  }

  async createPackage(input: Omit<Package, 'id' | 'createdAt'>): Promise<Package> {
    const id = `pkg_${Date.now()}`;
    const pkg: Package = { id, ...input, activeCardsCount: 0, createdAt: new Date().toISOString() };
    store.packages.set(id, pkg);
    return pkg;
  }

  async deletePackage(id: string): Promise<boolean> {
    return store.packages.delete(id);
  }

  async listVouchers(networkId: string, filter?: { packageId?: string; status?: string }): Promise<Voucher[]> {
    seedInitialData(networkId);
    let list = [...store.vouchers.values()].filter((v) => v.networkId === networkId);
    if (filter?.packageId) list = list.filter((v) => v.packageId === filter.packageId);
    if (filter?.status) list = list.filter((v) => v.status === filter.status);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createVouchersBatch(newVouchers: Omit<Voucher, 'id' | 'createdAt'>[]): Promise<Voucher[]> {
    const created: Voucher[] = [];
    for (const item of newVouchers) {
      const id = `vch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const voucher: Voucher = { id, ...item, createdAt: new Date().toISOString() };
      store.vouchers.set(id, voucher);
      created.push(voucher);
      const pkg = store.packages.get(item.packageId);
      if (pkg) {
        pkg.activeCardsCount = (pkg.activeCardsCount || 0) + 1;
        store.packages.set(pkg.id, pkg);
      }
    }
    return created;
  }

  async listCustomers(networkId: string): Promise<Customer[]> {
    seedInitialData(networkId);
    return [...store.customers.values()].filter((c) => c.networkId === networkId);
  }

  async createCustomer(input: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const id = `cust_${Date.now()}`;
    const customer: Customer = { id, ...input, createdAt: new Date().toISOString() };
    store.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, input: Partial<Customer>): Promise<Customer | undefined> {
    const existing = store.customers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...input };
    store.customers.set(id, updated);
    return updated;
  }

  async listResellers(networkId: string): Promise<Reseller[]> {
    seedInitialData(networkId);
    return [...store.resellers.values()].filter((r) => r.networkId === networkId);
  }

  async createReseller(input: Omit<Reseller, 'id' | 'createdAt'>): Promise<Reseller> {
    const id = `res_${Date.now()}`;
    const reseller: Reseller = { id, ...input, createdAt: new Date().toISOString() };
    store.resellers.set(id, reseller);
    return reseller;
  }

  async topupReseller(id: string, amount: number): Promise<Reseller | undefined> {
    const reseller = store.resellers.get(id);
    if (!reseller) return undefined;
    reseller.balance += amount;
    store.resellers.set(id, reseller);
    const txId = `tx_${Date.now()}`;
    const tx: Transaction = {
      id: txId,
      networkId: reseller.networkId,
      type: 'reseller_topup',
      amount,
      description: `شحن رصيد نقدي لـ ${reseller.name}`,
      resellerId: reseller.id,
      resellerName: reseller.name,
      createdAt: new Date().toISOString()
    };
    store.transactions.set(txId, tx);
    return reseller;
  }

  async listTransactions(networkId: string): Promise<Transaction[]> {
    seedInitialData(networkId);
    return [...store.transactions.values()]
      .filter((t) => t.networkId === networkId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTransaction(input: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const id = `tx_${Date.now()}`;
    const tx: Transaction = { id, ...input, createdAt: new Date().toISOString() };
    store.transactions.set(id, tx);
    return tx;
  }
}

class FirebaseRepository implements Repository {
  private memory = new MemoryRepository();
  private get db() {
    return import('./firebase.js').then(({ firestore }) => firestore);
  }

  async findUserByPhone(phone: string) {
    try {
      const db = await this.db;
      const snapshot = await db.collection('users').where('phone', '==', phone).limit(1).get();
      const document = snapshot.docs[0];
      return document ? ({ id: document.id, ...document.data() } as UserRecord) : undefined;
    } catch {
      return this.memory.findUserByPhone(phone);
    }
  }

  async findUserById(id: string) {
    try {
      const db = await this.db;
      const document = await db.collection('users').doc(id).get();
      return document.exists ? ({ id: document.id, ...document.data() } as UserRecord) : undefined;
    } catch {
      return this.memory.findUserById(id);
    }
  }

  async getNetwork(id: string) {
    try {
      const db = await this.db;
      const document = await db.collection('networks').doc(id).get();
      return document.exists ? ({ id: document.id, ...document.data() } as Network) : undefined;
    } catch {
      return this.memory.getNetwork(id);
    }
  }

  async findNetwork(identifier: string) {
    try {
      const db = await this.db;
      const byId = await db.collection('networks').doc(identifier).get();
      if (byId.exists) return { id: byId.id, ...byId.data() } as Network;
      const snapshot = await db.collection('networks').where('slug', '==', identifier).limit(1).get();
      const document = snapshot.docs[0];
      return document ? ({ id: document.id, ...document.data() } as Network) : undefined;
    } catch {
      return this.memory.findNetwork(identifier);
    }
  }

  async createOwner(input: OwnerInput) {
    try {
      const db = await this.db;
      const userReference = db.collection('users').doc();
      const networkReference = db.collection('networks').doc();
      const network: Network = {
        id: networkReference.id,
        ownerId: userReference.id,
        name: input.networkName,
        region: input.region,
        slug: input.networkName.toLowerCase().replace(/\s+/g, '-'),
        status: 'active',
        createdAt: new Date().toISOString()
      };
      const user: UserRecord = {
        id: userReference.id,
        name: input.name,
        phone: input.phone,
        passwordHash: input.passwordHash,
        role: 'network_owner',
        networkId: network.id,
        networkName: network.name
      };
      const batch = db.batch();
      batch.set(networkReference, network);
      batch.set(userReference, user);
      await batch.commit();
      return { user, network };
    } catch {
      return this.memory.createOwner(input);
    }
  }

  async getDashboardSummary(networkId: string): Promise<DashboardSummary> {
    try {
      const db = await this.db;
      const [customers, resellers, transactions, devices, accounting] = await Promise.all([
        db.collection('customers').where('networkId', '==', networkId).get(),
        db.collection('resellers').where('networkId', '==', networkId).get(),
        db.collection('transactions').where('networkId', '==', networkId).get(),
        db.collection('mikrotiks').where('networkId', '==', networkId).get(),
        db.collection('accountingEvents').where('networkId', '==', networkId).get()
      ]);
      const now = Date.now();
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      let totalSales = 0, todaySales = 0, monthSales = 0;
      for (const item of transactions.docs.map((document) => document.data())) {
        const amount = Number(item.amount ?? item.price ?? 0);
        const timestamp = new Date(item.createdAt ?? item.timestamp ?? 0).getTime();
        totalSales += amount;
        if (timestamp >= startOfDay.getTime()) todaySales += amount;
        if (timestamp >= startOfMonth.getTime()) monthSales += amount;
      }
      const activeCustomers = customers.docs.filter((document) => {
        const item = document.data();
        return item.status === 'active' && (!item.expiresAt || new Date(item.expiresAt).getTime() > now);
      }).length;
      const expiredCustomers = customers.size - activeCustomers;
      const dataUsedGb = accounting.docs.reduce((total, document) => total + Number(document.data().usedGb ?? 0), 0);
      const connectedDevices = devices.docs.filter((document) => ['online', 'connected', 'active'].includes(String(document.data().status))).length;
      return { customers: customers.size, activeCustomers, expiredCustomers, totalSales, todaySales, monthSales, resellers: resellers.size, connectedDevices, dataUsedGb };
    } catch {
      return this.memory.getDashboardSummary(networkId);
    }
  }

  async listMikroTiks(networkId: string) {
    try {
      const db = await this.db;
      const snapshot = await db.collection('mikrotiks').where('networkId', '==', networkId).get();
      return snapshot.docs.map((document) => ({ id: document.id, ...document.data() } as MikroTikDevice));
    } catch {
      return this.memory.listMikroTiks(networkId);
    }
  }

  async findMikroTikById(id: string) {
    try {
      const db = await this.db;
      const doc = await db.collection('mikrotiks').doc(id).get();
      return doc.exists ? ({ id: doc.id, ...doc.data() } as MikroTikDevice) : undefined;
    } catch {
      return this.memory.findMikroTikById(id);
    }
  }

  async createMikroTik(input: MikroTikInput) {
    try {
      const db = await this.db;
      const reference = db.collection('mikrotiks').doc();
      const device: MikroTikDevice = {
        id: reference.id,
        networkId: input.networkId,
        name: input.name,
        host: input.host,
        port: input.port,
        connectionType: input.connectionType,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await reference.set({ ...device, encryptedSecret: input.encryptedSecret });
      return device;
    } catch {
      return this.memory.createMikroTik(input);
    }
  }

  async updateMikroTikStatus(id: string, status: 'pending' | 'online' | 'offline') {
    try {
      const db = await this.db;
      await db.collection('mikrotiks').doc(id).update({ status });
      return this.findMikroTikById(id);
    } catch {
      return this.memory.updateMikroTikStatus(id, status);
    }
  }

  async listPackages(networkId: string) { return this.memory.listPackages(networkId); }
  async createPackage(input: Omit<Package, 'id' | 'createdAt'>) { return this.memory.createPackage(input); }
  async deletePackage(id: string) { return this.memory.deletePackage(id); }

  async listVouchers(networkId: string, filter?: { packageId?: string; status?: string }) { return this.memory.listVouchers(networkId, filter); }
  async createVouchersBatch(vouchers: Omit<Voucher, 'id' | 'createdAt'>[]) { return this.memory.createVouchersBatch(vouchers); }

  async listCustomers(networkId: string) { return this.memory.listCustomers(networkId); }
  async createCustomer(input: Omit<Customer, 'id' | 'createdAt'>) { return this.memory.createCustomer(input); }
  async updateCustomer(id: string, input: Partial<Customer>) { return this.memory.updateCustomer(id, input); }

  async listResellers(networkId: string) { return this.memory.listResellers(networkId); }
  async createReseller(input: Omit<Reseller, 'id' | 'createdAt'>) { return this.memory.createReseller(input); }
  async topupReseller(id: string, amount: number) { return this.memory.topupReseller(id, amount); }

  async listTransactions(networkId: string) { return this.memory.listTransactions(networkId); }
  async createTransaction(input: Omit<Transaction, 'id' | 'createdAt'>) { return this.memory.createTransaction(input); }
}

export const repository: Repository = config.useFirebase ? new FirebaseRepository() : new MemoryRepository();
