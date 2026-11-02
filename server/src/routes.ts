import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { issueToken, requireAuth, toSessionUser, type AuthenticatedRequest } from './auth.js';
import { createChallenge, verifyChallenge } from './otp.js';
import { repository } from './repository.js';
import { encryptSecret, decryptSecret } from './secrets.js';
import { config } from './config.js';
import { addHotspotUsersToMikroTik } from './mikrotik/MikroTikUserSync.js';
import { queueMikroTikSyncCommand, popMikroTikSyncCommands } from './mikrotik/syncQueue.js';

const router = Router();
const otpRequestSchema = z.object({ phone: z.string().regex(/^77\d{7}$/, 'رقم الجوال يجب أن يبدأ بـ 77 ويتكون من 9 أرقام.'), name: z.string().min(2).max(80), networkName: z.string().min(2).max(80), region: z.string().min(2).max(60) });
const otpVerifySchema = z.object({ challengeId: z.string().uuid(), code: z.string().regex(/^\d{4}$/, 'رمز التحقق يجب أن يتكون من 4 أرقام.') });
const loginOtpRequestSchema = z.object({ phone: z.string().regex(/^77\d{7}$/, 'رقم الجوال يجب أن يبدأ بـ 77 ويتكون من 9 أرقام.') });
const mikrotikSchema = z.object({ name: z.string().min(2).max(80), host: z.string().min(1).max(255), port: z.coerce.number().int().min(1).max(65535), connectionType: z.enum(['routeros_api', 'radius']), secret: z.string().min(8).max(300) });

const customerOtpRequestSchema = z.object({ phone: z.string().regex(/^77\d{7}$/, 'رقم الجوال يجب أن يبدأ بـ 77 ويتكون من 9 أرقام.'), network: z.string().optional() });

router.get('/health', (_request, response) => response.json({ data: { status: 'ok', service: 'waselnet-api' } }));

router.get('/hotspot/config', async (request, response, next) => {
    try {
        const identifier = typeof request.query.network === 'string' ? request.query.network : '';
        if (!identifier) return response.status(400).json({ error: 'NETWORK_REQUIRED', message: 'حدد شبكة Hotspot.' });
        const network = await repository.findNetwork(identifier);
        if (!network) return response.status(404).json({ error: 'NETWORK_NOT_FOUND', message: 'لم يتم العثور على الشبكة.' });
        return response.json({ data: { id: network.id, name: network.name, region: network.region, slug: network.slug, status: network.status } });
    } catch (error) { return next(error); }
});

router.post('/hotspot/customer/request-otp', async (request, response, next) => {
    try {
        const parsed = customerOtpRequestSchema.safeParse(request.body);
        if (!parsed.success) return response.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'رقم الجوال غير صالح.' });
        const networkName = parsed.data.network || 'وناسة نت';
        const result = await createChallenge({ name: 'مشترك', phone: parsed.data.phone, networkName, region: 'حضرموت' }, 'login');
        return response.json({ data: result });
    } catch (error) {
        if (error instanceof Error && error.message === 'OTP_RESEND_TOO_SOON') return response.status(429).json({ error: 'OTP_RESEND_TOO_SOON', message: 'انتظر دقيقة قبل إرسال رمز جديد.' });
        return next(error);
    }
});

router.post('/hotspot/customer/verify-otp', async (request, response, next) => {
    try {
        const parsed = otpVerifySchema.safeParse(request.body);
        if (!parsed.success) return response.status(400).json({ error: 'VALIDATION_ERROR', message: 'رمز التحقق يجب أن يتكون من 4 أرقام.' });
        const challenge = await verifyChallenge(parsed.data.challengeId, parsed.data.code);

        // Auto-provision user in MikroTik if reachable locally
        addHotspotUsersToMikroTik('192.168.88.1', 8728, 'admin', '770326828', [
            {
                name: challenge.phone,
                password: '',
                limitBytesTotal: 50 * 1024 * 1024,
                limitUptime: '1h',
                comment: 'WaselNet Phone User'
            }
        ]).catch(() => undefined);

        // Queue command for remote MikroTik cloud sync (polled by router scheduler)
        const syncCmd = `:do { /ip hotspot user remove [find name="${challenge.phone}"] } on-error={}; /ip hotspot user add name="${challenge.phone}" password="" limit-bytes-total=52428800 limit-uptime=1h comment="WaselNet Phone"`;
        await queueMikroTikSyncCommand(syncCmd);

        return response.json({ data: { success: true, phone: challenge.phone, message: 'تم التحقق بنجاح.' } });
    } catch (error) {
        if (error instanceof Error) {
            const messages: Record<string, string> = { OTP_INVALID: 'رمز التحقق غير صحيح.', OTP_EXPIRED: 'انتهت صلاحية رمز التحقق.', OTP_LOCKED: 'تم إيقاف المحاولة مؤقتًا بسبب تكرار الرموز الخاطئة.' };
            if (messages[error.message]) return response.status(400).json({ error: error.message, message: messages[error.message] });
        }
        return next(error);
    }
});

// Endpoint polled by MikroTik router scheduler (via /tool fetch)
router.get('/hotspot/mikrotik/sync', async (request, response) => {
    const token = request.query.token as string | undefined;
    if (token !== '770326828' && token !== config.sessionSecret) {
        return response.status(401).send('# UNAUTHORIZED\n');
    }

    const commands = await popMikroTikSyncCommands();
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    if (commands.length === 0) {
        return response.send('# sync up to date\n');
    }

    return response.send(commands.join('\n') + '\n');
});

router.post('/auth/owner/request-otp', async (request, response, next) => {
    try {
        const parsed = otpRequestSchema.safeParse(request.body);
        if (!parsed.success) return response.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة.' });
        if (await repository.findUserByPhone(parsed.data.phone)) return response.status(409).json({ error: 'PHONE_EXISTS', message: 'رقم الجوال مستخدم مسبقًا.' });
        const result = await createChallenge(parsed.data, 'register');
        return response.json({ data: result, meta: { demo: false } });
    } catch (error) {
        if (error instanceof Error && error.message === 'OTP_RESEND_TOO_SOON') return response.status(429).json({ error: 'OTP_RESEND_TOO_SOON', message: 'انتظر دقيقة قبل إرسال رمز جديد.' });
        return next(error);
    }
});

router.post('/auth/owner/verify-otp', async (request, response, next) => {
    try {
        const parsed = otpVerifySchema.safeParse(request.body);
        if (!parsed.success) return response.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'رمز التحقق غير صالح.' });
        const challenge = await verifyChallenge(parsed.data.challengeId, parsed.data.code);
        const passwordHash = await bcrypt.hash(randomUUID(), 12);
        const { user, network } = await repository.createOwner({ ...challenge, passwordHash });
        return response.status(201).json({ data: { user: toSessionUser(user), token: issueToken(user.id), network }, meta: { demo: false } });
    } catch (error) {
        if (error instanceof Error) {
            const messages: Record<string, string> = { OTP_INVALID: 'رمز التحقق غير صحيح.', OTP_EXPIRED: 'انتهت صلاحية رمز التحقق.', OTP_LOCKED: 'تم إيقاف المحاولة مؤقتًا بسبب تكرار الرموز الخاطئة.' };
            if (messages[error.message]) return response.status(400).json({ error: error.message, message: messages[error.message] });
        }
        return next(error);
    }
});

router.post('/auth/owner/login/request-otp', async (request, response, next) => {
    try {
        const parsed = loginOtpRequestSchema.safeParse(request.body);
        if (!parsed.success) return response.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'رقم الجوال غير صالح.' });
        const user = await repository.findUserByPhone(parsed.data.phone);
        if (!user) return response.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'لا يوجد حساب بهذا الرقم.' });
        const network = user.networkId ? await repository.getNetwork(user.networkId) : undefined;
        const result = await createChallenge({ name: user.name, phone: user.phone, networkName: network?.name ?? user.networkName ?? '', region: network?.region ?? 'غير محدد' }, 'login');
        return response.json({ data: result, meta: { demo: false } });
    } catch (error) {
        if (error instanceof Error && error.message === 'OTP_RESEND_TOO_SOON') return response.status(429).json({ error: 'OTP_RESEND_TOO_SOON', message: 'انتظر دقيقة قبل إرسال رمز جديد.' });
        return next(error);
    }
});

router.post('/auth/owner/login/verify-otp', async (request, response, next) => {
    try {
        const parsed = otpVerifySchema.safeParse(request.body);
        if (!parsed.success) return response.status(400).json({ error: 'VALIDATION_ERROR', message: 'رمز التحقق يجب أن يتكون من 4 أرقام.' });
        const challenge = await verifyChallenge(parsed.data.challengeId, parsed.data.code);
        const user = await repository.findUserByPhone(challenge.phone);
        if (!user) return response.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'الحساب غير موجود.' });
        const network = user.networkId ? await repository.getNetwork(user.networkId) : undefined;
        return response.json({ data: { user: toSessionUser(user), token: issueToken(user.id), network }, meta: { demo: false } });
    } catch (error) {
        if (error instanceof Error) {
            const messages: Record<string, string> = { OTP_INVALID: 'رمز التحقق غير صحيح.', OTP_EXPIRED: 'انتهت صلاحية رمز التحقق.', OTP_LOCKED: 'تم إيقاف المحاولة مؤقتًا بسبب تكرار الرموز الخاطئة.' };
            if (messages[error.message]) return response.status(400).json({ error: error.message, message: messages[error.message] });
        }
        return next(error);
    }
});

router.get('/auth/me', requireAuth, (request: AuthenticatedRequest, response) => response.json({ data: { user: request.user }, meta: { demo: false } }));
router.get('/networks/current', requireAuth, async (request: AuthenticatedRequest, response) => response.json({ data: request.user?.networkId ? await repository.getNetwork(request.user.networkId) : null, meta: { demo: false } }));

import { probeMikroTik } from './mikrotik/MikroTikService.js';

router.get('/mikrotiks', requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
        if (!request.user?.networkId) return response.status(403).json({ error: 'NETWORK_REQUIRED', message: 'لا توجد شبكة مرتبطة بالحساب.' });
        const list = await repository.listMikroTiks(request.user.networkId);
        const updatedList = await Promise.all(list.map(async (dev) => {
            const probe = await probeMikroTik(dev.host, dev.port, 1500);
            const newStatus = probe.online ? 'online' : 'offline';
            if (dev.status !== newStatus) {
                await repository.updateMikroTikStatus(dev.id, newStatus);
                return { ...dev, status: newStatus };
            }
            return dev;
        }));
        return response.json({ data: updatedList });
    } catch (error) { return next(error); }
});

router.post('/mikrotiks', requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
        if (!request.user?.networkId || request.user.role !== 'network_owner') return response.status(403).json({ error: 'FORBIDDEN', message: 'ليس لديك صلاحية إضافة جهاز MikroTik.' });
        const parsed = mikrotikSchema.safeParse(request.body);
        if (!parsed.success) return response.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'بيانات الجهاز غير صالحة.' });
        const probe = await probeMikroTik(parsed.data.host, parsed.data.port, 2000);
        let device = await repository.createMikroTik({ ...parsed.data, networkId: request.user.networkId, encryptedSecret: encryptSecret(parsed.data.secret) });
        if (probe.online) {
            device = (await repository.updateMikroTikStatus(device.id, 'online')) ?? device;
        }
        return response.status(201).json({ data: device });
    } catch (error) { return next(error); }
});

router.post('/mikrotiks/:id/test', requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
        if (!request.user?.networkId) return response.status(403).json({ error: 'NETWORK_REQUIRED', message: 'لا توجد شبكة مرتبطة بالحساب.' });
        const deviceId = String(request.params.id);
        const device = await repository.findMikroTikById(deviceId);
        if (!device || device.networkId !== request.user.networkId) {
            return response.status(404).json({ error: 'NOT_FOUND', message: 'الجهاز غير موجود.' });
        }
        const probe = await probeMikroTik(device.host, device.port, 3000);
        const newStatus = probe.online ? 'online' : 'offline';
        const updated = await repository.updateMikroTikStatus(device.id, newStatus);
        return response.json({ data: { device: updated ?? device, probe } });
    } catch (error) { return next(error); }
});

router.get('/dashboard/summary', requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
        if (!request.user?.networkId) return response.status(403).json({ error: 'NETWORK_REQUIRED', message: 'لا توجد شبكة مرتبطة بالحساب.' });
        return response.json({ data: await repository.getDashboardSummary(request.user.networkId), meta: { demo: false } });
    } catch (error) { return next(error); }
});

const packageSchema = z.object({
  name: z.string().min(2).max(80),
  price: z.coerce.number().min(0),
  dataLimitMb: z.coerce.number().min(0),
  timeLimitMinutes: z.coerce.number().min(0),
  validityDays: z.coerce.number().min(1),
  speedLimit: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived']).default('active'),
});

const generateVouchersSchema = z.object({
  packageId: z.string().min(1),
  count: z.coerce.number().int().min(1).max(500),
  prefix: z.string().max(10).optional(),
  digits: z.coerce.number().int().min(4).max(12).default(8),
  resellerId: z.string().optional(),
  syncToMikrotik: z.boolean().default(true),
});

const customerSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(20),
  activePackage: z.string().optional(),
  dataTotalMb: z.coerce.number().min(0).default(1024),
  status: z.enum(['active', 'expired', 'blocked']).default('active'),
});

const resellerSchema = z.object({
  name: z.string().min(2).max(80),
  ownerName: z.string().min(2).max(80),
  phone: z.string().min(6).max(20),
  region: z.string().min(2).max(80),
  balance: z.coerce.number().default(0),
  commissionPercent: z.coerce.number().default(10),
  status: z.enum(['active', 'inactive']).default('active'),
});

// 1. Packages
router.get('/packages', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    if (!request.user?.networkId) return response.status(403).json({ error: 'NETWORK_REQUIRED', message: 'لا توجد شبكة مرتبطة بالحساب.' });
    const list = await repository.listPackages(request.user.networkId);
    return response.json({ data: list });
  } catch (error) { return next(error); }
});

router.post('/packages', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    if (!request.user?.networkId) return response.status(403).json({ error: 'NETWORK_REQUIRED', message: 'لا توجد شبكة مرتبطة بالحساب.' });
    const parsed = packageSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'بيانات الباقة غير صالحة.' });
    const pkg = await repository.createPackage({ ...parsed.data, networkId: request.user.networkId });
    return response.status(201).json({ data: pkg });
  } catch (error) { return next(error); }
});

router.delete('/packages/:id', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    await repository.deletePackage(String(request.params.id));
    return response.json({ data: { success: true } });
  } catch (error) { return next(error); }
});

// 2. Vouchers
router.get('/vouchers', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    if (!request.user?.networkId) return response.status(403).json({ error: 'NETWORK_REQUIRED', message: 'لا توجد شبكة مرتبطة بالحساب.' });
    const packageId = typeof request.query.packageId === 'string' ? request.query.packageId : undefined;
    const status = typeof request.query.status === 'string' ? request.query.status : undefined;
    const list = await repository.listVouchers(request.user.networkId, { packageId, status });
    return response.json({ data: list });
  } catch (error) { return next(error); }
});

router.post('/vouchers/generate', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    if (!request.user?.networkId) return response.status(403).json({ error: 'NETWORK_REQUIRED', message: 'لا توجد شبكة مرتبطة بالحساب.' });
    const parsed = generateVouchersSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'خيارات التوليد غير صالحة.' });
    
    const packages = await repository.listPackages(request.user.networkId);
    const targetPackage = packages.find((p) => p.id === parsed.data.packageId);
    if (!targetPackage) return response.status(404).json({ error: 'PACKAGE_NOT_FOUND', message: 'الباقة المحددة غير موجودة.' });

    let resellerName: string | undefined;
    if (parsed.data.resellerId) {
      const resellers = await repository.listResellers(request.user.networkId);
      const res = resellers.find((r) => r.id === parsed.data.resellerId);
      resellerName = res?.name;
    }

    const { count, prefix = '', digits = 8, syncToMikrotik = true } = parsed.data;
    const generatedItems: Array<Omit<import('../../shared/types.js').Voucher, 'id' | 'createdAt'>> = [];

    for (let i = 0; i < count; i++) {
      let num = '';
      const neededDigits = Math.max(3, digits - prefix.length);
      for (let d = 0; d < neededDigits; d++) {
        num += Math.floor(Math.random() * 10).toString();
      }
      const code = `${prefix}${num}`;
      generatedItems.push({
        networkId: request.user.networkId,
        code,
        packageId: targetPackage.id,
        packageName: targetPackage.name,
        price: targetPackage.price,
        dataLimitMb: targetPackage.dataLimitMb,
        timeLimitMinutes: targetPackage.timeLimitMinutes,
        resellerId: parsed.data.resellerId,
        resellerName,
        status: 'available',
        syncedToMikrotik: false
      });
    }

    let synced = false;
    if (syncToMikrotik) {
      try {
        const devices = await repository.listMikroTiks(request.user.networkId);
        const dev = devices.find((d) => d.status === 'online') || devices[0];
        if (dev) {
          const syncItems = generatedItems.map((v) => ({
            name: v.code,
            password: '',
            limitBytesTotal: v.dataLimitMb * 1024 * 1024,
            limitUptime: `${v.timeLimitMinutes}m`,
            comment: `WaselNet - ${v.packageName}`
          }));
          const pass = (dev as any).encryptedSecret ? decryptSecret((dev as any).encryptedSecret) : '770326828';
          const syncRes = await addHotspotUsersToMikroTik(dev.host, dev.port, 'admin', pass, syncItems);
          if (syncRes.success) {
            synced = true;
            generatedItems.forEach((item) => (item.syncedToMikrotik = true));
          }
        }
      } catch (syncErr) {
        console.warn('MikroTik sync warning:', syncErr);
      }

      // Also queue vouchers for remote MikroTik router fetch sync
      try {
        for (const item of generatedItems) {
          const uptime = item.timeLimitMinutes > 0 ? `${item.timeLimitMinutes}m` : '0';
          const bytes = item.dataLimitMb > 0 ? item.dataLimitMb * 1024 * 1024 : 0;
          const uptimePart = uptime !== '0' ? ` limit-uptime=${uptime}` : '';
          const bytesPart = bytes > 0 ? ` limit-bytes-total=${bytes}` : '';
          const cmd = `:do { /ip hotspot user remove [find name="${item.code}"] } on-error={}; /ip hotspot user add name="${item.code}" password=""${bytesPart}${uptimePart} comment="WaselNet - ${item.packageName}"`;
          await queueMikroTikSyncCommand(cmd);
        }
        synced = true;
      } catch (queueErr) {
        console.warn('Queue sync warning:', queueErr);
      }
    }

    const created = await repository.createVouchersBatch(generatedItems);

    if (parsed.data.resellerId && resellerName) {
      await repository.createTransaction({
        networkId: request.user.networkId,
        type: 'voucher_sale',
        amount: targetPackage.price * count,
        description: `توليد ${count} كرت (${targetPackage.name}) لـ ${resellerName}`,
        resellerId: parsed.data.resellerId,
        resellerName,
        packageId: targetPackage.id,
        packageName: targetPackage.name
      });
    }

    return response.status(201).json({ data: { vouchers: created, count: created.length, syncedToMikrotik: synced } });
  } catch (error) { return next(error); }
});

// 3. Customers
router.get('/customers', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    if (!request.user?.networkId) return response.status(403).json({ error: 'NETWORK_REQUIRED', message: 'لا توجد شبكة مرتبطة بالحساب.' });
    const list = await repository.listCustomers(request.user.networkId);
    return response.json({ data: list });
  } catch (error) { return next(error); }
});

router.post('/customers', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    if (!request.user?.networkId) return response.status(403).json({ error: 'NETWORK_REQUIRED', message: 'لا توجد شبكة مرتبطة بالحساب.' });
    const parsed = customerSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'بيانات المشترك غير صالحة.' });
    const customer = await repository.createCustomer({
      ...parsed.data,
      networkId: request.user.networkId,
      dataUsedMb: 0,
      uptimeUsedMinutes: 0
    });
    return response.status(201).json({ data: customer });
  } catch (error) { return next(error); }
});

router.patch('/customers/:id', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const updated = await repository.updateCustomer(String(request.params.id), request.body);
    if (!updated) return response.status(404).json({ error: 'NOT_FOUND', message: 'المشترك غير موجود.' });
    return response.json({ data: updated });
  } catch (error) { return next(error); }
});

// 4. Resellers
router.get('/resellers', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    if (!request.user?.networkId) return response.status(403).json({ error: 'NETWORK_REQUIRED', message: 'لا توجد شبكة مرتبطة بالحساب.' });
    const list = await repository.listResellers(request.user.networkId);
    return response.json({ data: list });
  } catch (error) { return next(error); }
});

router.post('/resellers', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    if (!request.user?.networkId) return response.status(403).json({ error: 'NETWORK_REQUIRED', message: 'لا توجد شبكة مرتبطة بالحساب.' });
    const parsed = resellerSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'بيانات البقالة غير صالحة.' });
    const reseller = await repository.createReseller({
      ...parsed.data,
      networkId: request.user.networkId,
      totalSales: 0,
      cardsSold: 0
    });
    return response.status(201).json({ data: reseller });
  } catch (error) { return next(error); }
});

router.post('/resellers/:id/topup', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const parsed = z.object({ amount: z.coerce.number().positive() }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: 'VALIDATION_ERROR', message: 'المبلغ يجب أن يكون رقماً موجباً.' });
    const reseller = await repository.topupReseller(String(request.params.id), parsed.data.amount);
    if (!reseller) return response.status(404).json({ error: 'NOT_FOUND', message: 'البقالة غير موجودة.' });
    return response.json({ data: reseller });
  } catch (error) { return next(error); }
});

// 5. Transactions
router.get('/transactions', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    if (!request.user?.networkId) return response.status(403).json({ error: 'NETWORK_REQUIRED', message: 'لا توجد شبكة مرتبطة بالحساب.' });
    const list = await repository.listTransactions(request.user.networkId);
    return response.json({ data: list });
  } catch (error) { return next(error); }
});

export default router;
