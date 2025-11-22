# 🔧 Discord OAuth2 Kurulum Adımları

## ⚠️ ÖNEMLİ: Client Secret Gerekli!

### 1. Discord Developer Portal'a Gidin
- [Discord Developer Portal](https://discord.com/developers/applications) 
- **Wagu botunuzu** seçin (Application ID: 1404538157508071485)

### 2. Client Secret'ı Alın
- Sol menüden **"OAuth2"** → **"General"** seçin
- **"Client Secret"** bölümünde **"Copy"** butonuna tıklayın
- Bu secret'ı kopyalayın

### 3. Redirect URI'yi Ekleyin
- Aynı sayfada **"Redirects"** bölümüne:
  ```
  http://localhost:8080/auth/callback
  ```
- **"Add Redirect"** butonuna tıklayın
- **"Save Changes"** butonuna tıklayın

### 4. Client Secret'ı güvenli şekilde ekleyin
Server kodunda secret'ı doğrudan yapıştırmak yerine `.env` dosyası kullanın. Proje kökünde bir `.env.example` dosyası bulunuyor — onu `.env` olarak kopyalayın ve değerleri doldurun:

```
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3000/auth/callback
```

Ardından sunucuyu yeniden başlatın:

```bash
npm start
```

## 🚨 Hata Çözümleri

### "access_denied" Hatası:
- Discord'da **"Authorize"** butonuna tıkladığınızdan emin olun
- Redirect URI'nin doğru olduğundan emin olun

### "invalid_client" Hatası:
- Client Secret'ın doğru kopyalandığından emin olun
- Boşluk veya fazladan karakter olmamalı

### "redirect_uri_mismatch" Hatası:
- Discord Developer Portal'da Redirect URI'nin tam olarak eşleştiğinden emin olun
- `http://localhost:8080/auth/callback` (tam olarak bu)

## ✅ Test Etmek İçin:
1. `http://localhost:8080` adresine gidin
2. "Discord ile Giriş" butonuna tıklayın
3. Discord'da "Authorize" butonuna tıklayın
4. Gerçek Discord bilgilerinizi görün!
