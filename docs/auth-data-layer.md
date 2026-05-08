# Eğitim Gurmesi Akademi - Auth ve Data Access Katmanı

## Bu Aşamada Tamamlananlar

1. `PrismaService` ile NestJS veritabanı erişim katmanı kuruldu
2. Repository yapısı açıldı:
   - kullanıcılar
   - personel kullanıcıları
   - auth session kayıtları
3. JWT tabanlı access ve refresh token akışı kuruldu
4. Refresh token rotation için kalıcı session tablosu eklendi
5. Kullanıcı kayıt ve giriş akışı kuruldu
6. Personel giriş akışı kuruldu
7. `me` ve `logout` endpoint'leri kuruldu
8. Varsayılan rol ve yetki seed mantığı eklendi
9. İlk super-admin bootstrap akışı kuruldu
10. Staff permission guard temeli kuruldu
11. Public ve admin auth ekranları API endpoint'lerine bağlandı

## Eklenen Ana Endpoint'ler

Taban prefix: `v1`

1. `POST /v1/auth/register`
2. `POST /v1/auth/login`
3. `POST /v1/auth/staff/login`
4. `POST /v1/auth/refresh`
5. `GET /v1/auth/me`
6. `POST /v1/auth/logout`
7. `GET /v1/staff/bootstrap-status`
8. `POST /v1/staff/bootstrap`
9. `GET /v1/staff/overview`

## Mevcut Davranış

1. Kullanıcı kaydında yerel kullanıcı, profil ve öğrenci profil verisi oluşturulur
2. Kayıttan sonra access ve refresh token üretilir
3. Refresh token veritabanında hashlenmiş biçimde saklanır
4. Personel girişinde roller ve permission anahtarları access token içine işlenir
5. Logout işlemi aktif session kaydını revoke eder
6. İlk kurulumda bootstrap secret ile ilk super-admin hesabı üretilebilir
7. Staff overview endpoint'i `dashboard.read` yetkisi ister

## Özellikle Henüz Yapılmayanlar

1. Email doğrulama akışı
2. Şifre sıfırlama endpoint'leri
3. Personel davet akışı
4. Cookie tabanlı auth taşıma
5. Gerçek migration çalıştırma
6. Daha geniş route bazlı permission uygulaması

## Bunun Anlamı

Temel auth omurgası hazırdır, ancak operasyonel auth özelliklerinin tamamı henüz bitmemiştir.

Bir sonraki mantıklı adımlar:

1. Email doğrulama ve şifre sıfırlama
2. Personel davet ve hesap tamamlama akışı
3. Cookie tabanlı auth sertleştirmesi
4. Daha geniş permission kapsamı
