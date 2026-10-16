# Salon

TV’ye bağlı bilgisayarda çalışan, telefonların QR kodla kumandaya dönüştüğü Türkçe aile oyun salonu. 12 oyun ve 1–8 oyuncu; çizim, okçu, voleybol ve hokey oyunlarında en az 2 oyuncu gerekir.

## 0.3 sürümünde yeni

- **Mini Golf:** Üç parkurda herkes kendi topuyla aynı anda oynar. Telefonda çekip bırak veya yön/güç kaydırıcılarıyla vur; az vuruşla deliğe girerek yüksek puan kazan.
- **Köstebek Avı:** TV ve telefonda aynı dokuz yuva. Köstebeklere dokun, altın hedefleri yakala, çiçekleri koru. Her oyuncu aynı hedeften bir kez puan alabilir.
- Her iki oyun da 1–8 oyuncuyu, mola vermeyi ve yeniden bağlanmayı destekler. 3D geliştirmesi şimdilik ertelendi.

## 0.2 sürümünde yeni

- **Plaj Voleybolu:** 2–8 kişi, otomatik iki takım, telefondan yatay hareket ve zıplama. İlk 7 sayı veya süre sonunda yüksek skor kazanır.
- **Buz Hokeyi:** 2–8 kişi, kaygan hareket, disk çarpışmaları ve iki kale. Telefon kumandasıyla kayarak diske vurulur.
- **Nehir Devriyesi:** River Raid esintili ilerleyen nehir, tank/uçak hedefleri, kıyı çarpışmaları ve ortak kalkanlar. Herkes kendi uçağını kaydırır; ateş otomatiktir.
- **Renk Hafızası:** TV’deki renk/şekil sırasını telefondan tekrar etme. Herkes aynı anda oynar, yanlış yapan sonraki seride yeniden katılır.
- TV’den **duraklat / devam et**, tüm oyuncuların bağlantısı kesilince otomatik mola, sapan ve okçuda ayarlanabilir açı/güç.
- Oyun sayısı ve kategoriler katalogdan otomatik oluşur; **Spor** kategorisi eklendi.

Güncellemeden sonra açık sunucuyu durdurup `npm start` ile yeniden başlatın; TV ve telefon sayfalarını yenileyin. Sunucunun yeniden başlaması eski odaları kapatır.

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
| Nehir Devriyesi | 1–8 | 2 dakika | Uçağı kaydır; kıyılardan ve düşman atışlarından kaç. |
| Renk Hafızası | 1–8 | 2 dakika | Gösterilen renk/şekil sırasını dört düğmeyle tekrar et. |
| Plaj Voleybolu | 2–8 | 2 dakika | Konumunu kaydırıcıyla ayarla, düğmeyle zıpla. |
| Buz Hokeyi | 2–8 | 2 dakika | Dokunmatik çubukla kayarak diske vur. |
| Mini Golf | 1–8 | En fazla 2,5 dakika | Topu ters yöne çekip bırak veya yön/güç ayarla. |
| Köstebek Avı | 1–8 | 90 saniye | Dokuz yuvada beliren hedeflere dokun. |

Sapan ve okçuda atış yapılmazsa sıra 16 saniyede geçer. Çizimde her görev 40 saniye sürer; herkes bildiğinde çizer değişir. Denge puanları ortak takım puanıdır. Diğer oyunlarda tur sonunda en yüksek puan kazanır. Takım olarak oynamak için bir telefonu paylaşabilir ve takım adı girebilirsiniz.

Voleybol ve hokeyde katılım sırasına göre oyuncular dönüşümlü olarak mavi/mercan takımlara ayrılır. Tek sayıda oyuncuda takımlar bir kişi farklı olur. Takım arkadaşlarının puanı aynıdır; ilk 7 sayı/gol maçı bitirir, süre bitiminde beraberlik mümkündür. Her sayıdan sonra kısa bir hazırlık süresi vardır. Hokey basitleştirilmiş arcade kuralları kullanır; ofsayt ve ceza sistemi yoktur.

Nehir Devriyesi'nde 6 kalkan ortaktır. Kıyı veya düşman atışı bir kalkan götürür; isabet alan oyuncu 2 saniye korunur. Hedefler 10 puan kazandırır. Etap bittiğinde bir kalkan geri gelir (en fazla 6); kalkanlar biterse tur sona erer. Sonuç ekranında ortak puan ve her oyuncunun katkısı gösterilir.

Renk Hafızası'nda seri 2 renkle başlar ve en fazla 8 renge uzar. Gösterim sırasında düğmeler kilitlidir. Tam doğru seri, uzunluğunun 10 katı puan getirir; hata veya süre aşımı yalnızca o seriyi sonlandırır. Renklerin yanında şekiller ve sayılar da kullanılır. Tam cevap dizisi telefonlara gönderilmez.

Mini Golf'te her parkur için 45 saniye ve en fazla 8 vuruş vardır. Top durmadan yeni vuruş yapılamaz. İlk vuruşta deliğe girmek 80 puan getirir; her ek vuruş ödülü 10 azaltır, sekizinci vuruş 10 puandır. Deliğe giremeyen o parkurdan puan alamaz. Bağlı oyuncular tamamladığında sonraki parkura geçilir. Toplar birbirine çarpmaz; üç parkurun toplam puanı kazananı belirler.

Köstebek Avı'nda normal hedef 10, altın hedef 25 puan verir. Çiçeğe dokunmak 5 puan götürür; puan sıfırın altına düşmez. Hedefler zamanla hızlanır. Aynı hedefe tekrar dokunmak puan kazandırmaz; bir oyuncunun vurması diğer oyuncuların hakkını tüketmez.

## Bağlantı ve cihazlar

- QR kod bilgisayarın yerel ağ adresini içerir. Birden çok ağ arayüzü varsa QR altındaki menüden telefonların erişebildiği Wi-Fi/Ethernet adresini seçin. VPN veya sanal ağ adresi çalışmayabilir.
- Telefonların tarayıcısında `localhost` kullanmayın; bu adres telefonun kendisidir.
- Bağlantı açılmıyorsa bilgisayar güvenlik duvarında Node.js için yerel ağ erişimine izin verin. Misafir Wi-Fi ağlarında cihazların birbirine erişimi kapalı olabilir.
- Tarayıcı yenilendiğinde oyuncu adı, rengi ve aktif turdaki puanı aynı cihazda korunur. Saklama izni olmayan tarayıcı modlarında yeniden katılım gerekebilir.
- TV bağlantısı veya turdaki tüm oyuncuların bağlantısı kesilince oyun duraklar. Bağlantı geri geldiğinde süre kaldığı yerden devam eder; sonradan katılan izleyici tek başına turu ilerletmez.
- TV’deki **Duraklat** düğmesiyle mola verilebilir. Mola sırasında atış, çizim, hareket, hafıza ve servis süreleri ilerlemez; telefon girdileri işlenmez. **Devam et** ile oyun sürer.
- Tur sırasında gelen yeni oyuncu sonraki oyunda katılır. Lobide bağlantısı kesilen oyuncunun yanındaki × düğmesi o yeri boşaltır.
- Hareket sensörü için tarayıcı güvenli bağlantı (HTTPS) ve bazı cihazlarda kullanıcı izni ister. Varsayılan yerel HTTP kurulumunda dokunmatik kumanda kullanılır. Sensör desteği güvenli bağlantı üzerinden erişildiğinde etkinleştirilebilir; bu sürüm HTTPS kurulumunu içermez.
- Kamera tabanlı hazine avı henüz eklenmedi. Şu an kamera yalnızca telefonun kendi QR okuyucusu olarak kullanılır.

## Testler

```sh
npm run check
npm test
```

55 test; puanlama, 8 oyuncu, sıra süresi, bağlantısı kesilen oyuncular, gizli kelime/renk dizisi, çizim yetkisi, Türkçe tahmin eşleştirmesi, gol/sayı kuralları, nehir sınırları, golf çarpışmaları ve parkur geçişleri, köstebek hedeflerinin süresi ve tekrar vuruş koruması, mola ve çizim işlevlerinin herkese açık oyun durumuyla çağrılmasını kapsar. Canvas işlevleri için kullanılan test taklidi gerçek tarayıcıdaki görsel görünümü doğrulamaz.

Gerçek tarayıcılarla TV + iki telefon akışı:

```sh
npx playwright install chromium
npm run test:e2e
```

Test ayrı bir sunucuyu **3100** portunda otomatik başlatır; 3000 portundaki aile oturumuna bağlanmaz. Katalogdaki tüm oyunların açılmasını, iki telefonla katılmayı, yeniden bağlanmayı, mola davranışını ve yeni kumandaları kontrol eder. Yüklü Chrome’u kullanmak için macOS örneği:

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e
```

İlk geliştirme ortamında port açma ve tarayıcı çalıştırma kısıtlı olduğundan gerçek ağ/tarayıcı testi tamamlanamadı. Gerçek telefonlarla sensör hissi, gecikme ve ekran uyumu ayrıca denenmelidir.

## Yapı ve ilk sürümün sınırları

- `server/index.js`: Express, Socket.IO, odalar, QR kodlar, kimlik ve bağlantı yönetimi.
- `server/games.js`: Sunucuda çalışan oyun kuralları ve fizik; 30 Hz simülasyon, 15 Hz durum yayını.
- `server/extra-games.js`: Nehir Devriyesi ve Renk Hafızası.
- `server/court-games.js`: Voleybol/hokey takımları, çarpışmalar, servis ve gol kuralları.
- `server/golf.js`, `server/moles.js`: Mini Golf ve Köstebek Avı kuralları.
- `server/session.js`: Mola, yeniden bağlantı ve tur bitişi.
- `public/game-geometry.js`: TV çizimi ve sunucu çarpışmaları için ortak nehir geometrisi.
- `public/golf-courses.js`: TV çizimi ve sunucu fiziği için ortak golf parkurları.
- `public/app.js`: TV lobisi, telefon katılımı, kumandalar ve sonuç ekranı.
- `public/render.js`: SVG oyun çizimleri ve Canvas oyun ekranları.
- `public/casual-render.js`: Golf ve köstebek oyunlarının çizimleri.
- `public/style.css`: TV ve telefon düzenleri.

Oyunlar özgün çizimler kullanan ilk oynanabilir sürümlerdir. Sapan basitleştirilmiş balistik atış ve blok yok etme mantığı kullanır; tam bir rijit cisim/yıkım simülasyonu değildir. Ses, kalıcı turnuva geçmişi, otomatik karma turnuva, kamera oyunu ve özel HTTPS kurulumu henüz yoktur.

Mevcut oyunlar 2D Canvas ile çizilir. 3D geliştirmesi şimdilik ertelendi. QR/oda/kumanda protokolü ileride 3D oyunlarda da kullanılabilir; bunun için TV tarafına WebGL çizimi, gerekiyorsa 3D fizik ve akıcı görüntü için durumlar arası geçiş eklenmelidir. Performans bilgisayarın ekran kartı ve yerel ağ gecikmesiyle gerçek cihazlarda değerlendirilmelidir.

Odalar ve puanlar yalnızca bellekte tutulur; uygulama yeniden başladığında silinir. Hesap veya bulut servisi gerekmez. Yazı tipleri internet varsa Google Fonts’tan yüklenir; çevrimdışı sistem yazı tipleriyle devam eder. Sunucu aile içi yerel ağ kullanımına yöneliktir; genel internete açılmak için tasarlanmamıştır.
