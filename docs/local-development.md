# Eğitim Gurmesi Akademi - Yerel Geliştirme Kurulumu

## Amaç

Bu kurulum, proje hostinge taşınmadan önce tüm temel geliştirme akışını yerel ortamda çalıştırmak için hazırlanmıştır.

## Kullanılan Yerel Servisler

1. PostgreSQL
2. Redis
3. Web uygulaması
4. Admin uygulaması
5. API uygulaması

## Hazır Dosyalar

1. Ortam değişkenleri örneği: `.env.example`
2. Yerel servis orkestrasyonu: `docker-compose.local.yml`
3. Veritabanı şeması: `packages/db/prisma/schema.prisma`
4. İlk migration: `packages/db/prisma/migrations/20260507_init/migration.sql`

## Not

Bu makine üzerinde `docker` kurulu olmadığı için container'lar burada başlatılmadı. Dosyalar hazırlandı, ama servisleri çalıştırmak için Docker Desktop veya eşdeğer kurulum gerekecek.

## Önerilen Kurulum Adımları

1. `.env.example` dosyasını `.env` olarak kopyalayın
2. `.env` içinde özellikle şu değerleri doldurun:

```bash
AUTH_SECRET=...
BOOTSTRAP_ADMIN_SECRET=...
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/v1
```

3. Docker kuruluysa şu komutu çalıştırın:

```bash
npm run infra:up
```

4. Prisma şemasını doğrulayın:

```bash
npm run db:validate
```

5. Prisma client üretin:

```bash
npm run db:generate
```

6. İlk migration'ı uygulayın:

```bash
npm run db:migrate
```

7. Varsayılan rol ve yetkileri seed edin:

```bash
npm run db:seed
```

8. API uygulamasını başlatın:

```bash
npm run dev:api
```

9. Web uygulamasını başlatın:

```bash
npm run dev:web
```

10. Admin uygulamasını başlatın:

```bash
npm run dev:admin
```

## Varsayılan Yerel Portlar

1. Web: `http://localhost:3000`
2. Admin: `http://localhost:3001`
3. API: `http://localhost:4000`
4. PostgreSQL: `localhost:5432`
5. Redis: `localhost:6379`

## Bu Aşamada Beklenen Sonuç

1. Local veritabanı ayağa kalkar
2. Prisma client üretilebilir
3. Çekirdek veri modeli migration'a hazır hale gelir
4. Web, admin ve API iskeleti yerel makinede birlikte geliştirilebilir
5. `/kurulum` ekranı üzerinden ilk super-admin hesabı oluşturulabilir
