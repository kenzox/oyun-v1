# Salon

TV’ye bağlı bilgisayarda çalışan, telefonların QR kodla kumandaya dönüştüğü Türkçe aile oyun salonu. 1–8 oyuncu; çizim ve okçu oyunlarında en az 2 oyuncu gerekir.

## Başlatma

Node.js 22 veya üzeri gerekir. Proje klasöründe:

```sh
npm ci
npm start
```

1. Bilgisayarda **http://localhost:3000** adresini açın; TV’ye yansıtın.
2. **Oda oluştur** düğmesine basın.
3. Telefonları bilgisayarla aynı Wi-Fi ağına bağlayın ve TV’deki QR kodu okutun.
4. Telefonlarda isim ve karakter seçin. TV’den oyunu seçip **Oyunu başlat** düğmesine basın.
5. TV’deki **⛶** düğmesi tam ekranı açar.

Telefon gerektirmeyen bir deneme için TV’deki katılım bağlantısını aynı bilgisayarda ayrı bir tarayıcı profili veya gizli pencerede açabilirsiniz. Farklı oyuncular için ayrı profiller gerekir; aynı tarayıcı depolaması oyuncu kimliğini korur.

Geliştirmede sunucu dosyalarını otomatik yeniden yüklemek için `npm run dev` kullanın. İstemci dosyası değişince tarayıcıyı yenileyin. Sunucu yeniden başladığında açık odalar sıfırlanır.

Farklı port: `PORT=3001 npm start`.

## Oyunlar

| Oyun | Oyuncu | Süre | Kumanda |
| --- | --- | --- | --- |
| Sapan Savaşları | 1–8 | 2 dakika | Topu geriye çekip bırak; açı ve güç atışa dönüşür. |
| Okçu Arenası | 2–8 | 90 saniye | Sırayla açı ve güç ayarla; rakibe isabet ettir. |
| Yılan Yarışı | 1–8 | 90 saniye | Yön tuşlarıyla elma topla; çarpınca yeniden doğ. |
| Raket Kapışması | 1–8 | 90 saniye | Kendi sahandaki raketi kaydır, tuğlaları kır. |
| Karalama Kapışması | 2–8 | 3 dakika | Gizli kelimeyi çiz; diğer oyuncular tahmin yazsın. |
| Denge Ekibi | 1–8 | 90 saniye | Ortak topu dokunmatik kumandayla hedefe götür. |

Sapan ve okçuda atış yapılmazsa sıra 16 saniyede geçer. Çizimde her görev 40 saniye sürer; herkes bildiğinde çizer değişir. Denge puanları ortak takım puanıdır. Diğer oyunlarda tur sonunda en yüksek puan kazanır. Takım olarak oynamak için bir telefonu paylaşabilir ve takım adı girebilirsiniz.

## Bağlantı ve cihazlar

- QR kod bilgisayarın yerel ağ adresini içerir. Birden çok ağ arayüzü varsa QR altındaki menüden telefonların erişebildiği Wi-Fi/Ethernet adresini seçin. VPN veya sanal ağ adresi çalışmayabilir.
- Telefonların tarayıcısında `localhost` kullanmayın; bu adres telefonun kendisidir.
- Bağlantı açılmıyorsa bilgisayar güvenlik duvarında Node.js için yerel ağ erişimine izin verin. Misafir Wi-Fi ağlarında cihazların birbirine erişimi kapalı olabilir.
- Tarayıcı yenilendiğinde oyuncu adı, rengi ve aktif turdaki puanı aynı cihazda korunur. Saklama izni olmayan tarayıcı modlarında yeniden katılım gerekebilir.
- TV bağlantısı kesilince oyun duraklar. TV geri bağlanınca süre kaldığı yerden devam eder.
- Tur sırasında gelen yeni oyuncu sonraki oyunda katılır. Lobide bağlantısı kesilen oyuncunun yanındaki × düğmesi o yeri boşaltır.
- Hareket sensörü için tarayıcı güvenli bağlantı (HTTPS) ve bazı cihazlarda kullanıcı izni ister. Varsayılan yerel HTTP kurulumunda dokunmatik kumanda kullanılır. Sensör desteği güvenli bağlantı üzerinden erişildiğinde etkinleştirilebilir; bu sürüm HTTPS kurulumunu içermez.
- Kamera tabanlı hazine avı henüz eklenmedi. Şu an kamera yalnızca telefonun kendi QR okuyucusu olarak kullanılır.

## Testler

```sh
npm run check
npm test
```

Oyun motoru testleri; puanlama, 8 oyuncu, sıra süresi, bağlantısı kesilen oyuncular, gizli kelimenin korunması, çizim yetkisi, Türkçe tahmin eşleştirmesi ve fizik çarpışmalarını kapsar.

Gerçek tarayıcılarla TV + iki telefon akışı:

```sh
npx playwright install chromium
npm run test:e2e
```

Test sunucuyu otomatik başlatır. Yüklü Chrome’u kullanmak için macOS örneği:

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e
```

İlk geliştirme ortamında port açma ve tarayıcı çalıştırma kısıtlı olduğundan gerçek ağ/tarayıcı testi tamamlanamadı. Gerçek telefonlarla sensör hissi, gecikme ve ekran uyumu ayrıca denenmelidir.

## Yapı ve ilk sürümün sınırları

- `server/index.js`: Express, Socket.IO, odalar, QR kodlar, kimlik ve bağlantı yönetimi.
- `server/games.js`: Sunucuda çalışan oyun kuralları ve fizik; 30 Hz simülasyon, 15 Hz durum yayını.
- `public/app.js`: TV lobisi, telefon katılımı, kumandalar ve sonuç ekranı.
- `public/render.js`: SVG oyun çizimleri ve Canvas oyun ekranları.
- `public/style.css`: TV ve telefon düzenleri.

Oyunlar özgün çizimler kullanan ilk oynanabilir sürümlerdir. Sapan basitleştirilmiş balistik atış ve blok yok etme mantığı kullanır; tam bir rijit cisim/yıkım simülasyonu değildir. Ses, kalıcı turnuva geçmişi, otomatik karma turnuva, kamera oyunu ve özel HTTPS kurulumu henüz yoktur.

Odalar ve puanlar yalnızca bellekte tutulur; uygulama yeniden başladığında silinir. Hesap veya bulut servisi gerekmez. Yazı tipleri internet varsa Google Fonts’tan yüklenir; çevrimdışı sistem yazı tipleriyle devam eder. Sunucu aile içi yerel ağ kullanımına yöneliktir; genel internete açılmak için tasarlanmamıştır.
