# إجازاتي — v1.1.0

منصة شخصية لإدارة الإجازات، متزامنة بين الأجهزة، مع حساب مالك وإدارة مستخدمين ونظام Beta → Production.

## ما تم ربطه بالفعل
- Supabase Project: `itcbahydyqhlybofcyuh`
- Auth: Email + Password
- Database: جداول `ejazati_*`
- RLS: مفعّل على جميع جداول إجازاتي
- Frontend key: Supabase Publishable Key فقط (آمن للواجهة)
- App version: `1.1.0`

## مهم جدًا: أول حساب
أول حساب يسجل الدخول إلى إجازاتي سيُفعّل تلقائيًا كـ **Owner** لمرة واحدة فقط.
لذلك أنشئ حسابك أنت أولًا قبل مشاركة رابط التطبيق.

## Cloudflare Workers
المشروع مجهز وفق Workers Static Assets:

- `wrangler.jsonc`
- `public/` ملفات التطبيق
- Preview URLs مفعّلة
- `beta` يمكن رفعه كـ Preview Alias
- `main` هو Production

### تشغيل محلي
```bash
npm install
npm run dev
```

### رفع Beta
```bash
npm run beta
```

### نشر Production
```bash
npm run deploy
```

Cloudflare Preview URLs تسمح لك بتجربة الإصدار قبل الإنتاج.

## الربط مع GitHub + Cloudflare
1. أنشئ Repository باسم `ejazati`.
2. ارفع محتويات هذه الحزمة.
3. في Cloudflare: Workers & Pages → Create → Import a repository.
4. اختر مستودع `ejazati`.
5. استخدم `main` كفرع Production.
6. اجعل التطوير على فرع `beta`.
7. جرّب رابط Preview الخاص بـ beta.
8. بعد موافقتك، ادمج `beta` إلى `main` لينشر الإصدار للمستخدمين.

## تحديث المستخدمين
Service Worker لا يستبدل النسخة النشطة مباشرة. عند وصول Service Worker جديد يظهر داخل التطبيق:
**تحديث جديد جاهز → تحديث الآن / نسخة احتياطية / لاحقًا**

هذا يسمح للمستخدم بأخذ نسخة احتياطية قبل تفعيل التحديث على جهازه.

## استرجاع كلمة المرور
بعد معرفة رابط Cloudflare النهائي، أضفه في:
Supabase → Authentication → URL Configuration → Redirect URLs

مثال:
`https://ejazati.<your-subdomain>.workers.dev/**`

## الأمان
لا يوجد Service Role Key أو Cloudflare API Token داخل المستودع.
الواجهة تحتوي فقط على Supabase Publishable Key، وهو مصمم للاستخدام في الواجهة مع RLS.

## Security review
Supabase RLS is enabled on all Ejazati tables. The one-time `ejazati_claim_owner()` SECURITY DEFINER RPC is intentional and restricted to authenticated users; it succeeds only while no owner exists. Also enable Supabase leaked-password protection in Auth settings when available.
