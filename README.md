# Salon

TV’ye bağlı bilgisayarda çalışan, telefonların QR kodla kumandaya dönüştüğü Türkçe aile oyun salonu. 18 oyun ve 1–8 oyuncu; çizim, okçu, voleybol, hokey ve tenis oyunlarında en az 2 oyuncu gerekir.

## 0.5 sürümünde yeni

Mevcut 16 oyun korunur. **3D Oyunlar** kategorisinde iki ayrı sürüm bulunur:

- **3D Bilardo:** Three.js ile ışık/gölge ve perspektifli masa; Rapier ile küre çarpışmaları, sürtünme, bant sekmeleri ve ceplere düşme. Telefon kumandası yön ve güç kaydırıcılarını kullanır.
- **3D Araba Yarışı:** 1–8 kişi, her oyuncuya TV’de ayrı takip kamerası. 600 metrelik kıvrımlı pist, dört kontrol noktası, ortak araç çarpışmaları, engeller ve bariyerler. Rapier’in dört tekerlekli raycast araç denetleyicisi süspansiyon, çekiş, motor ve fren hesaplarını yapar. Gaz ve viraj yardımı otomatik; telefonda konum, fren, turbo, iki saniye geri gitme ve son etaba dönme vardır.

Yeni bağımlılıkları almak için güncellemeden sonra `npm ci` çalıştırın, sunucuyu yeniden başlatın ve tüm ekranları yenileyin. 3D görüntü için bilgisayar tarayıcısında **WebGL 2** ve donanım hızlandırma gerekir. Telefonlar normal kumanda sayfasını kullanır; Three.js yalnızca TV’de 3D oyun açıldığında yüklenir. Three.js dosyaları yerel sunucudan gelir; CDN gerektirmez. Görüntü başlatılamazsa açıklama gösterilir ve klasik oyunlar kullanılabilir.

## 0.4 sürümünde yeni

- **Salon Rallisi:** 1–8 oyuncu için bölünmüş ekran, üç tur, ortak trafik düzeni, otomatik gaz, açılıp kapanan fren ve turbo. Trafiğe çarpmak geçici olarak yavaşlatır; kimse elenmez.
- **Cep Bilardosu:** 1–8 oyuncu sırayla aynı masada oynar. Yön/güç ayarı, TV’de nişan çizgisi, top çarpışmaları, altı cep ve beyaz top faulü.
- **Kort Tenisi:** 2–8 oyunculu iki takım. Yukarı/aşağı konum, vuruş yönü ve zamanlanmış güçlü vuruş; yakındaki top otomatik karşılanır.
- **Lazer Galerisi:** 1–8 oyunculu, 2D perspektifli atış galerisi. Telefon ekranından nişan alma, hareketli hedefler, beş atışlık enerji ve dolum süresi. Serbest dolaşılan bir 3D FPS değildir; lazer oyunu 2D olarak korunur.

## 0.3 sürümünde yeni

- **Mini Golf:** Üç parkurda herkes kendi topuyla aynı anda oynar. Telefonda çekip bırak veya yön/güç kaydırıcılarıyla vur; az vuruşla deliğe girerek yüksek puan kazan.
- **Köstebek Avı:** TV ve telefonda aynı dokuz yuva. Köstebeklere dokun, altın hedefleri yakala, çiçekleri koru. Her oyuncu aynı hedeften bir kez puan alabilir.
- Her iki oyun da 1–8 oyuncuyu, mola vermeyi ve yeniden bağlanmayı destekler. Bu sürümde oyunlar 2D olarak sunulmuştu; 0.5 ile bilardo ve yarış için ayrı 3D seçenekler eklendi.

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
| Salon Rallisi | 1–8 | En fazla 90 saniye | Direksiyonu kaydır, fren ve turbo düğmelerini kullan. |
| Cep Bilardosu | 1–8 | 3 dakika | Sıran gelince yön ve güç ayarlayıp beyaz topa vur. |
| Kort Tenisi | 2–8 | 2 dakika | Konumu ve vuruş yönünü kaydır; güçlü vuruş yap. |
| Lazer Galerisi | 1–8 | 90 saniye | Hedefe dokunarak nişan al, lazer düğmesine bas. |
| 3D Bilardo | 1–8 | 3 dakika | Sırayla yön ve güç ayarla, fizik motorundaki beyaz topa vur. |
| 3D Araba Yarışı | 1–8 | En fazla 2 dakika | Konumunu seç; fren, turbo, geri gitme ve kurtarma düğmelerini kullan. |

Sapan ve okçuda atış yapılmazsa sıra 16 saniyede geçer. Çizimde her görev 40 saniye sürer; herkes bildiğinde çizer değişir. Denge puanları ortak takım puanıdır. Diğer oyunlarda tur sonunda en yüksek puan kazanır. Takım olarak oynamak için bir telefonu paylaşabilir ve takım adı girebilirsiniz.

Voleybol ve hokeyde katılım sırasına göre oyuncular dönüşümlü olarak mavi/mercan takımlara ayrılır. Tek sayıda oyuncuda takımlar bir kişi farklı olur. Takım arkadaşlarının puanı aynıdır; ilk 7 sayı/gol maçı bitirir, süre bitiminde beraberlik mümkündür. Her sayıdan sonra kısa bir hazırlık süresi vardır. Hokey basitleştirilmiş arcade kuralları kullanır; ofsayt ve ceza sistemi yoktur.

Nehir Devriyesi'nde 6 kalkan ortaktır. Kıyı veya düşman atışı bir kalkan götürür; isabet alan oyuncu 2 saniye korunur. Hedefler 10 puan kazandırır. Etap bittiğinde bir kalkan geri gelir (en fazla 6); kalkanlar biterse tur sona erer. Sonuç ekranında ortak puan ve her oyuncunun katkısı gösterilir.

Renk Hafızası'nda seri 2 renkle başlar ve en fazla 8 renge uzar. Gösterim sırasında düğmeler kilitlidir. Tam doğru seri, uzunluğunun 10 katı puan getirir; hata veya süre aşımı yalnızca o seriyi sonlandırır. Renklerin yanında şekiller ve sayılar da kullanılır. Tam cevap dizisi telefonlara gönderilmez.

Mini Golf'te her parkur için 45 saniye ve en fazla 8 vuruş vardır. Top durmadan yeni vuruş yapılamaz. İlk vuruşta deliğe girmek 80 puan getirir; her ek vuruş ödülü 10 azaltır, sekizinci vuruş 10 puandır. Deliğe giremeyen o parkurdan puan alamaz. Bağlı oyuncular tamamladığında sonraki parkura geçilir. Toplar birbirine çarpmaz; üç parkurun toplam puanı kazananı belirler.

Köstebek Avı'nda normal hedef 10, altın hedef 25 puan verir. Çiçeğe dokunmak 5 puan götürür; puan sıfırın altına düşmez. Hedefler zamanla hızlanır. Aynı hedefe tekrar dokunmak puan kazandırmaz; bir oyuncunun vurması diğer oyuncuların hakkını tüketmez.

Salon Rallisi'nde 3000 metre üç turu tamamlar. Bitiren oyuncular sırasıyla 4000, 3900, 3800… puan alır; aynı anda bitirenler aynı sırayı ve puanı paylaşır. Süre dolunca bitiremeyenlere gittikleri metre kadar puan verilir. İlk finişten sonra diğerlerine en fazla 12 saniye kalır. Turbo 1,5 saniye sürer ve 6 saniyede yeniden hazır olur. Oyuncuların araçları birbirine çarpmaz; herkes aynı engel düzeninde kendi yolunu sürer. Bağlantısı kesilen aracın ilerlemesi durur.

Cep Bilardosu'nda standart sekiz top grupları yerine altı renkli top kullanılır. Her renkli top 10 puandır. Beyaz topun cebe girmesi 5 puan götürür (en az sıfır) ve sırayı geçirir; beyaz top masada boş bir konuma döner. Faulsüz top sokan oyuncu yeniden vurur. Toplar durmadan vuruş yapılamaz. Her nişan sırası 20 saniyedir; bağlantısı kesilen oyuncu atlanır. Masadaki renkli toplar bitince yeni dizilim kurulur. Eşit puanda beraberlik vardır.

Kort Tenisi'nde oyuncular dönüşümlü olarak iki takıma ayrılır. İlk 7 sayı maçı bitirir; süre sonunda beraberlik mümkündür. Üst/alt çizgi dışına atan takım sayı kaybeder; arka çizgiden geçen topu karşılayamayan takım da sayı kaybeder. Güçlü vuruş 0,4 saniyelik bir zamanlama aralığı sağlar ve 0,9 saniyede yeniden kullanılabilir. Basitleştirilmiş arcade tenisi kullanılır; servis hatası, set ve 15/30/40 sistemi yoktur.

Lazer Galerisi'nde drone 10, altın hedef 25 puandır. Yeşil kalkana isabet 5 puan götürür (en az sıfır). Her hedefe her oyuncu bir kez puan alabilir; başkasının atışı hakkını tüketmez. Atış aralığı en az 0,3 saniyedir. Beş atıştan sonra 1,2 saniyelik otomatik dolum olur; elle erken dolum da yapılabilir. Telefon dokunmatiğine alternatif olarak yatay/dikey nişan kaydırıcıları vardır.

3D Bilardo'da altı renkli topun her biri 10 puan verir; beyaz top 5 puan götürür ve sırayı geçirir. Faulsüz top sokunca sıra korunur. Toplar durmadan yeniden vurulamaz; nişan için 20 saniye vardır. Masada tüm renkli toplar bitince yeniden dizilir. Klasik oyundan ayrı Rapier dünyası kullanır. Bu sürümde falso ve ıstakanın dikey açısı yoktur; sürtünme ve yuvarlanma direnci oyun için ayarlanmıştır.

3D yarışta 150, 300, 450 ve 600 metre kontrol noktaları sırayla geçilir. Bitirenler sırasıyla 1000, 990, 980… puan alır; aynı anda bitirenler aynı sırayı paylaşır. Bitiremeyenlere mesafeleri kadar puan verilir. İlk finişten sonra en fazla 12 saniye kalır. Turbo 1,5 saniye sürer ve 6 saniyede yenilenir. Geri gitme iki saniyelik motor ters yönüdür; kurtarma son geçilmiş kontrol noktasının gerisine taşır. Araçların devrilmesi kısıtlanmıştır ve direksiyon yardımı vardır; tam araç simülatörü değildir. Sekiz kamerada görüntü performansı bilgisayara göre değişir.

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

100 test; puanlama, 8 oyuncu, sıra süresi, bağlantısı kesilen oyuncular, gizli kelime/renk dizisi, çizim yetkisi, Türkçe tahmin eşleştirmesi, gol/sayı kuralları, nehir sınırları, golf çarpışmaları ve parkur geçişleri, köstebek hedeflerinin süresi ve tekrar vuruş koruması, yarış finiş sırası/beraberlikleri, bilardo faulleri ve sıra yönetimi, tenis çizgi dışı kuralları, lazer dolumu ve hedef hakkı, Rapier temasları/cepleri/süspansiyonu/freni, 3D kontrol noktaları, fizik belleğinin serbest bırakılması, sahne geometrisi ve ağ görüntüsü yumuşatma, mola ve çizim işlevlerinin herkese açık oyun durumuyla çağrılmasını kapsar. Canvas test taklidi ve Three.js sahne nesnesi testleri gerçek GPU çizimini veya görsel görünümü doğrulamaz.

Gerçek tarayıcılarla TV + iki telefon akışı:

```sh
npx playwright install chromium
npm run test:e2e
```

Test ayrı bir sunucuyu **3100** portunda otomatik başlatır; 3000 portundaki aile oturumuna bağlanmaz. Katalogdaki tüm oyunların açılmasını, iki telefonla katılmayı, yeniden bağlanmayı, mola davranışını ve yeni kumandaları kontrol eder. Yüklü Chrome’u kullanmak için macOS örneği:

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e
```

Bu geliştirme ortamında port açma ve Chrome başlatma kısıtları nedeniyle gerçek ağ/tarayıcı ve WebGL görüntü testi tamamlanamadı. Gerçek telefonlarla sensör hissi, gecikme ve ekran uyumu ayrıca denenmelidir.

## Yapı ve ilk sürümün sınırları

- `server/index.js`: Express, Socket.IO, odalar, QR kodlar, kimlik ve bağlantı yönetimi.
- `server/games.js`: Sunucuda çalışan oyun kuralları ve fizik; 30 Hz simülasyon, 15 Hz durum yayını.
- `server/extra-games.js`: Nehir Devriyesi ve Renk Hafızası.
- `server/court-games.js`: Voleybol/hokey takımları, çarpışmalar, servis ve gol kuralları.
- `server/golf.js`, `server/moles.js`: Mini Golf ve Köstebek Avı kuralları.
- `server/race.js`, `server/pool.js`, `server/tennis.js`, `server/laser.js`: Yarış, bilardo, tenis ve lazer kuralları.
- `server/physics.js`: Sunucuda Rapier başlatma, oyun başına fizik dünyası, 120 Hz sabit adımlar ve kaynak temizleme. Fizik nesneleri ağ verisine dahil edilmez.
- `server/pool3d.js`, `server/race3d.js`: Ayrı 3D oyun kuralları ve fizik denetleyicileri.
- `server/session.js`: Mola, yeniden bağlantı ve tur bitişi.
- `public/game-geometry.js`: TV çizimi ve sunucu çarpışmaları için ortak nehir geometrisi.
- `public/golf-courses.js`: TV çizimi ve sunucu fiziği için ortak golf parkurları.
- `public/app.js`: TV lobisi, telefon katılımı, kumandalar ve sonuç ekranı.
- `public/render.js`: SVG oyun çizimleri ve Canvas oyun ekranları.
- `public/casual-render.js`: Golf ve köstebek oyunlarının çizimleri.
- `public/arcade-rules.js`, `public/arcade-render.js`, `public/arcade-controls.js`: Yeni spor/aksiyon oyunlarının ortak geometrisi, çizimi ve telefon kumandaları.
- `public/three-rules.js`: Fizik ve çizimde ortak masa/pist geometrisi.
- `public/three-view.js`, `public/three-scenes.js`, `public/three-models.js`: Geç yüklenen Three.js çizimi, sahneler, bölünmüş kameralar ve GPU kaynaklarını kapatma.
- `public/three-snapshots.js`: 15 Hz sunucu durumları arasında 100 ms gecikmeli görüntü yumuşatma; bağlantı durunca tahmin yürütmez.
- `public/style.css`: TV ve telefon düzenleri.

Oyunlar özgün çizimler kullanan ilk oynanabilir sürümlerdir. Sapan basitleştirilmiş balistik atış ve blok yok etme mantığı kullanır; tam bir rijit cisim/yıkım simülasyonu değildir. Ses, kalıcı turnuva geçmişi, otomatik karma turnuva, kamera oyunu ve özel HTTPS kurulumu henüz yoktur.

Klasik 16 oyun 2D Canvas ile, iki yeni oyun Three.js ile çizilir. Aynı oda/QR/kumanda sistemi kullanılır. Fizik sunucuda kalır; telefonlara fizik motoru indirilmez. Sonuç, yeni tur, lobi, oda silinmesi ve sunucu kapanışında fizik kaynakları bırakılır; TV ekranı değişince WebGL sahnesi ve çizim döngüsü kapatılır. Gerçekçilik; seçilen fizik parametreleri ve oyun yardımlarıyla sınırlıdır. Gerçek cihazlarda gecikme, 4–8 kameralı performans ve görüntü uyumu denenmelidir.

Odalar ve puanlar yalnızca bellekte tutulur; uygulama yeniden başladığında silinir. Hesap veya bulut servisi gerekmez. Yazı tipleri internet varsa Google Fonts’tan yüklenir; çevrimdışı sistem yazı tipleriyle devam eder. Sunucu aile içi yerel ağ kullanımına yöneliktir; genel internete açılmak için tasarlanmamıştır.
