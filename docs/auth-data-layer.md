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

## Eklenen Ana Endpoint'ler

Taban prefix: `v1`

1. `POST /v1/auth/register`
2. `POST /v1/auth/login`
3. `POST /v1/auth/staff/login`
4. `POST /v1/auth/refresh`
5. `GET /v1/auth/me`
6. `POST /v1/auth/logout`

## Mevcut Davranış

1. Kullanıcı kaydında yerel kullanıcı, profil ve öğrenci profil verisi oluşturulur
2. Kayıttan sonra access ve refresh token üretilir
3. Refresh token veritabanında hashlenmiş biçimde saklanır
4. Personel girişinde roller ve permission anahtarları access token içine işlenir
5. Logout işlemi aktif session kaydını revoke eder

## Özellikle Henüz Yapılmayanlar

1. Email doğrulama akışı
2. Şifre sıfırlama endpoint'leri
3. Personel davet akışı
4. İlk super-admin hesap üretimi
5. Guard seviyesinde permission bazlı route koruması
6. Cookie tabanlı auth taşıma
7. Gerçek migration çalıştırma

## Bunun Anlamı

Temel auth omurgası hazırdır, ancak operasyonel auth özelliklerinin tamamı henüz bitmemiştir.

Bir sonraki mantıklı adımlar:

1. İlk migration ve seed
2. Personel bootstrap akışı
3. Permission guard'ları
4. Kullanıcı ve personel auth ekranlarının API'ye bağlanması
