# TED Üniversitesi Ders Seçim Sistemi

Bu uygulama, TED Üniversitesi öğrencilerinin ders programlarını oluşturmalarına yardımcı olmak için geliştirilmiş bir web uygulamasıdır.

## Özellikler

- Ders arama ve filtreleme
- Haftalık program görüntüleme
- Otomatik kombinasyon oluşturma
- Çakışma kontrolü
- Öğretim üyesi ve section bazlı filtreleme
- Boş zaman dilimi bloklaması
- Klavye kısayolları ile kolay navigasyon

## Kurulum

1. Gerekli paketleri yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm start
```

3. Production build oluşturun:
```bash
npm run build
```

## Deployment

Production build'i oluşturduktan sonra `build` klasöründeki dosyaları web sunucunuza yükleyin.

### Gereksinimler

- Node.js 14.0.0 veya üzeri
- npm 6.0.0 veya üzeri

### Dosya Yapısı

- `public/` - Statik dosyalar
  - `Courses.csv` - Ders verileri
  - `index.html` - Ana HTML dosyası
- `src/` - Kaynak kodlar
  - `App.jsx` - Ana uygulama bileşeni
  - `index.js` - Giriş noktası

## Klavye Kısayolları

- `←` (Sol Ok): Önceki kombinasyon
- `→` (Sağ Ok): Sonraki kombinasyon
- `Alt + R`: Tüm dersleri kaldır
