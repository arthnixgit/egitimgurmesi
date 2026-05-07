# Eğitim Gurmesi Akademi - Rol ve Yetki Matrisi

## Amaç

Bu belge, admin panelindeki dört temel rolün erişim sınırlarını tanımlar:

1. `super-admin`
2. `admin`
3. `accounting`
4. `technician`

Bu matris başlangıç için kilitlenmiştir. Ekran bazlı istisnalar daha sonra genişletilebilir.

## Genel Kurallar

1. `super-admin` tüm yetkilere sahiptir.
2. `admin` günlük işletme ve içerik yönetimini yürütür.
3. `accounting` finansal kayıtları görür ve mali işlemleri yönetir, içerik ve sistem ayarlarını değiştirmez.
4. `technician` teknik ayarlar, içerik altyapısı ve entegrasyon sağlığını yönetir, finansal onay vermez.
5. Hiçbir rol, kendi rolünü veya daha yüksek rolü izinsiz yükseltemez.
6. Kritik işlemler audit log'a yazılır.

## Yetki Matrisi

| Modül / İşlem | super-admin | admin | accounting | technician |
|---|---|---|---|---|
| Dashboard görüntüleme | Evet | Evet | Evet | Evet |
| Genel site ayarları görüntüleme | Evet | Evet | Hayır | Evet |
| Genel site ayarları düzenleme | Evet | Sınırlı | Hayır | Evet |
| Ana sayfa kartları ve banner yönetimi | Evet | Evet | Hayır | Hayır |
| CMS sayfaları düzenleme | Evet | Evet | Hayır | Hayır |
| Ürün oluşturma | Evet | Evet | Hayır | Hayır |
| Ürün düzenleme | Evet | Evet | Hayır | Hayır |
| Ürün pasife alma | Evet | Evet | Hayır | Hayır |
| Fiyat güncelleme | Evet | Evet | Görür | Hayır |
| Kampanya ve kupon oluşturma | Evet | Evet | Görür | Hayır |
| Kupon pasife alma | Evet | Evet | Sınırlı | Hayır |
| Siparişleri görüntüleme | Evet | Evet | Evet | Sınırlı |
| Sipariş notu ekleme | Evet | Evet | Evet | Sınırlı |
| Sipariş durumu güncelleme | Evet | Evet | Sınırlı | Hayır |
| Ödeme kayıtlarını görüntüleme | Evet | Evet | Evet | Sınırlı |
| Ödeme uzlaştırma / reconciliation | Evet | Hayır | Evet | Hayır |
| Refund / iade işlemi başlatma | Evet | Hayır | Evet | Hayır |
| Muhasebe raporu dışa aktarma | Evet | Hayır | Evet | Hayır |
| Kullanıcıları görüntüleme | Evet | Evet | Evet | Sınırlı |
| Kullanıcı profili güncelleme | Evet | Evet | Hayır | Hayır |
| Kullanıcı erişimi askıya alma | Evet | Evet | Hayır | Hayır |
| Kurs / modül / ders oluşturma | Evet | Evet | Hayır | Evet |
| Video varlıklarını yükleme veya bağlama | Evet | Evet | Hayır | Evet |
| İçerik yayın açma / kapama | Evet | Evet | Hayır | Evet |
| Koçluk yönlendirme kayıtlarını görüntüleme | Evet | Evet | Evet | Evet |
| Unikazan entegrasyon sağlığını görüntüleme | Evet | Sınırlı | Hayır | Evet |
| Webhook loglarını görüntüleme | Evet | Hayır | Hayır | Evet |
| API / entegrasyon secret yönetimi | Evet | Hayır | Hayır | Evet |
| WhatsApp lead ekranını görüntüleme | Evet | Evet | Görür | Evet |
| WhatsApp lead dışa aktarma | Evet | Evet | Evet | Hayır |
| Personel kullanıcı oluşturma | Evet | Hayır | Hayır | Hayır |
| Rol atama veya değiştirme | Evet | Hayır | Hayır | Hayır |
| Audit log görüntüleme | Evet | Sınırlı | Sınırlı | Sınırlı |
| Sistem bakım modunu açma | Evet | Hayır | Hayır | Evet |

## Rol Açıklamaları

### super-admin

Kapsam:

1. Tüm iş birimlerinin son karar verici rolü
2. Rol ve yetki sistemi yönetimi
3. Finans, sistem ve içerik üzerinde tam kontrol
4. Secret, entegrasyon ve bakım yönetimi

### admin

Kapsam:

1. Günlük operasyon
2. Ürün, kampanya, CMS ve kullanıcı yönetimi
3. Sipariş operasyonu
4. İçerik yayını ve eğitim ürünlerinin görünürlüğü

Sınır:

1. Secret yönetemez
2. Muhasebe mutasyonları yapamaz
3. Personel rolü veremez

### accounting

Kapsam:

1. Ödeme kayıtları
2. Tahsilat ve uzlaştırma
3. İade süreci
4. Finansal raporlama

Sınır:

1. İçerik ve CMS düzenleyemez
2. Ürün yapısını değiştiremez
3. Sistem veya entegrasyon ayarlarını yönetemez

### technician

Kapsam:

1. Entegrasyon sağlığı
2. Video altyapısı
3. Teknik loglar ve webhook izleme
4. Sistem ayarlarının teknik kısmı
5. Bakım, cache ve altyapı ile ilgili operasyon ekranları

Sınır:

1. Ödeme onayı vermez
2. İade yapmaz
3. Finansal veriler üzerinde mutasyon yapmaz
4. Rol dağıtımı yapmaz

## Başlangıçta Ayrı Tutulacak Admin Bölümleri

1. İçerik ve pazarlama
2. Katalog ve ürün yönetimi
3. Sipariş ve ödeme operasyonu
4. LMS içerik yönetimi
5. Lead ve iletişim
6. Entegrasyon ve sistem sağlığı
7. Personel ve yetki yönetimi
8. Audit ve log kayıtları

## Uygulama Notları

1. Bu yapı RBAC olarak uygulanacak.
2. Gerektiğinde modül bazlı izinler ayrıca açılabilecek.
3. `Sınırlı` işaretli alanlar ekran seviyesinde daha dar izne çevrilecek.
