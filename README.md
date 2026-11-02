# WaselNet SaaS

منصة SaaS متعددة المستأجرين لإدارة شبكات Wi-Fi التي تعمل مستقبلًا مع MikroTik Hotspot.

## المرحلة الأولى

- واجهة Web عربية RTL متجاوبة.
- Landing page تسويقية مختصرة.
- تسجيل صاحب الشبكة وتسجيل الدخول.
- إنشاء شبكة مرتبطة بصاحب الحساب.
- Dashboard تقرأ بيانات الشبكة الفعلية من Firestore وتعرض أصفارًا حقيقية عند الفراغ.
- API مستقل يعمل مع Firebase Admin وOTP عبر مزود SMS.
- قواعد Firestore أساسية لعزل المستأجرين.
- طبقة `MikroTikService` كحد فاصل دون تفعيل MikroTik بعد.

## التشغيل

```bash
npm install
npm run dev
```

- الواجهة: `http://localhost:5173`
- API health check: `http://localhost:4000/api/health`

Firebase Admin وFirestore وOTP مفعّلة من خلال `.env` وملف Service Account على الخادم فقط. لا يتم تضمين الأسرار في الواجهة.

## قرارات المرحلة الأولى

- لا يرسل العميل `networkId` كمصدر ثقة. الخادم يستخرجه من هوية الجلسة/المستخدم.
- كل وثيقة تشغيلية تحمل `networkId`، مع قواعد Firestore تمنع القراءة والكتابة خارج شبكة المستخدم.
- معاملات التسجيل وتسجيل الدخول تتم عبر OTP من API، بينما لا تُوضع مفاتيح Admin أو SMS في الواجهة.
- Device Verification وAccounting وMikroTik تحتاج بيانات الربط الخارجية قبل تشغيلها فعليًا.

## خارطة الطريق

1. Identity وNetwork onboarding.
2. Customer + OTP عبر مزود SMS قابل للتبديل.
3. Device verification وسياسات الأجهزة.
4. Packages وSubscriptions وLedger للتعبئة.
5. Reseller/Baqala وصلاحياته.
6. Accounting ingestion واستهلاك البيانات.
7. MikroTik adapters: API/RADIUS/Accounting.
