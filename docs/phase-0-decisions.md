# Eğitim Gurmesi Akademi - Faz 0 Karar Kaydı

## Durum

Bu belge, proje başlangıcında kilitlenen ürün, mimari ve operasyon kararlarını içerir.

Durum işaretleri:

1. `Kilitli` - proje iskeleti buna göre kurulacak
2. `Bekliyor` - müşteri veya operasyon kararı gerekiyor
3. `Varsayılan` - aksi söylenene kadar uygulanacak tercih

## 1. Platform Kimliği

1. Marka adı: `Eğitim Gurmesi Akademi` - `Kilitli`
2. Platform dili: `Türkçe` - `Kilitli`
3. Hedef kitle: ağırlıklı olarak lise ve sınav hazırlık öğrencileri - `Kilitli`
4. Marka tonlaması: güven veren, modern, satış odaklı ama akademik ciddiyeti koruyan - `Kilitli`

## 2. Ürün ve Satış Kapsamı

1. Kayıtlı video eğitim paketleri satılacak - `Kilitli`
2. Koçluk paketleri satılacak - `Kilitli`
3. Karma paketler desteklenecek şekilde veri modeli kurulacak - `Kilitli`
4. İleride yeni ürün türleri eklenebilecek şekilde ürün modeli modüler kurulacak - `Kilitli`

## 3. Sistem Sahipliği

1. Ana platform bizim sistemimiz olacak - `Kilitli`
2. Kullanıcı kaydı ve girişi bizim sistemimizde olacak - `Kilitli`
3. LMS bizim sistemimizde olacak - `Kilitli`
4. Sipariş kayıtları ve finansal izler bizim sistemimizde tutulacak - `Kilitli`
5. Admin paneli tamamen bizim sistemimizde olacak - `Kilitli`

## 4. Unikazan Entegrasyon Sınırı

1. Unikazan yalnızca koçluk paketi ödeme yönlendirmesi için kullanılacak - `Kilitli`
2. Unikazan, platformun ana auth veya öğrenci paneli sağlayıcısı olmayacak - `Kilitli`
3. Unikazan entegrasyonu server-side adaptör üzerinden yürütülecek - `Kilitli`
4. Koçluk ürünleri sistemde `provider = unikazan` mantığıyla işaretlenecek - `Kilitli`
5. Unikazan'dan bağımsız yerel sipariş kaydı oluşturulacak - `Kilitli`
6. Başarılı ödeme doğrulaması için webhook veya sorgulanabilir dış sipariş durumu gerekecek - `Bekliyor`

## 5. Domain Ayrımı

1. Public site ayrı alanda çalışacak - `Kilitli`
2. Admin paneli ayrı subdomain veya domain üzerinden çalışacak - `Kilitli`
3. Önerilen yapı:
   - `www.<alanadi>`
   - `yonetim.<alanadi>`
   - `api.<alanadi>`
   - `cdn.<alanadi>` - `Varsayılan`
4. Kesin domain henüz paylaşılmadı - `Bekliyor`

## 6. Önerilen Teknoloji Yığını

1. Monorepo: `npm workspaces + Turbo` - `Kilitli`
2. Public frontend: `Next.js` - `Kilitli`
3. Admin frontend: `Next.js` - `Kilitli`
4. Backend API: `NestJS` - `Kilitli`
5. Veritabanı: `PostgreSQL` - `Kilitli`
6. ORM: `Prisma` - `Kilitli`
7. Cache ve kuyruk: `Redis` - `Varsayılan`
8. Ortak UI paketi: `packages/ui` - `Kilitli`
9. Ortak config paketi: `packages/config-*` - `Varsayılan`

## 7. Kimlik Doğrulama ve Güvenlik

1. Kullanıcı ve personel oturumları ayrı güvenlik mantığıyla yönetilecek - `Kilitli`
2. Admin giriş akışı public kullanıcı girişinden ayrılacak - `Kilitli`
3. Rol tabanlı yetki sistemi kurulacak - `Kilitli`
4. Audit log tüm kritik admin işlemlerinde zorunlu olacak - `Kilitli`
5. Secret değerler sadece server-side tutulacak - `Kilitli`

## 8. LMS ve İçerik Yönetimi

1. Ders, modül, video, materyal ve erişim hakları bizim veritabanımızda tutulacak - `Kilitli`
2. Video oynatma korumalı erişimle kurulacak - `Kilitli`
3. İçerik yayınlama ve gizleme admin panelinden yönetilecek - `Kilitli`
4. Video sağlayıcısı henüz seçilmedi - `Bekliyor`
5. Öneri önceliği: `Mux` veya erişim kontrollü eşdeğer servis - `Varsayılan`

## 9. Ödeme Mimarisi

1. Video paketleri ve yerel ürünler için kendi ödeme altyapımız kullanılacak - `Kilitli`
2. Koçluk ödemeleri Unikazan'a yönlendirilecek - `Kilitli`
3. Tüm ödemeler için yerel sipariş numarası tutulacak - `Kilitli`
4. Yerel ödeme sağlayıcısı henüz seçilmedi - `Bekliyor`
5. Minimum ödeme kayıtları:
   - sipariş
   - ödeme denemesi
   - dış sağlayıcı referansı
   - callback/verifikasyon izi - `Kilitli`

## 10. WhatsApp Stratejisi

1. İlk sürümde tıklanabilir WhatsApp butonu olacak - `Kilitli`
2. İlk sürümde lead kaydı veritabanına yazılacak - `Kilitli`
3. Tam resmi WhatsApp API entegrasyonu ilk sürüm için zorunlu değil - `Varsayılan`
4. Kullanılacak resmi numara henüz paylaşılmadı - `Bekliyor`

## 11. İçerik ve Pazarlama Sayfaları

1. Ana sayfa satış odaklı olacak - `Kilitli`
2. Paket detay sayfaları dönüşüm odaklı olacak - `Kilitli`
3. SEO amaçlı Türkçe açıklayıcı içerik blokları bulunacak - `Kilitli`
4. Referans alınan sitenin birebir kopyası yapılmayacak - `Kilitli`
5. Renk ve enerji markaya uyarlanarak yakın tutulacak - `Kilitli`

## 12. Altyapı ve Operasyon

1. Geliştirme, staging ve production ayrımı olacak - `Kilitli`
2. Veritabanı migration disiplini zorunlu olacak - `Kilitli`
3. Monitoring ve hata takibi kurulacak - `Kilitli`
4. Yedekleme stratejisi production öncesi tanımlanacak - `Kilitli`

## 13. Bu Aşamada Kullanıcıdan Gerekli Bilgiler

Bu maddeler scaffold işlemini durdurmaz, ama gerçek entegrasyon ve canlı kurgu için gereklidir:

1. Kesin ana domain
2. Local ödeme sağlayıcısı tercihi
3. Video barındırma tercihi
4. Kullanılacak SMTP veya transactional email servisi
5. WhatsApp numarası
6. Unikazan'ın webhook veya sipariş doğrulama cevabı

## 14. Bu Belgede Kilitlenen Varsayılanlar

Bu kararlar yeni bilgi gelene kadar doğrudan uygulanacaktır:

1. Stack: Next.js + NestJS + PostgreSQL + Prisma + Redis
2. Monorepo: npm workspaces + Turbo
3. Admin domain: `yonetim.<alanadi>`
4. API domain: `api.<alanadi>`
5. İlk sürüm WhatsApp: click-to-chat + lead tracking
6. Video provider default adayı: Mux
