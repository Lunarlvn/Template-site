# 🚨 Discord Redirect URI Sorunu Çözümü

## ⚠️ SORUN: "Discord ile giriş başarısız"

### 🔧 ÇÖZÜM: Discord Developer Portal'da Redirect URI Güncelleme

## 📋 Adım Adım Çözüm:

### 1. Discord Developer Portal'a Gidin
- [Discord Developer Portal](https://discord.com/developers/applications)
- **Wagu botunuzu** seçin (Application ID: 1404538157508071485)

### 2. OAuth2 Ayarlarına Gidin
- Sol menüden **"OAuth2"** → **"General"** seçin

### 3. Redirect URI'leri Kontrol Edin
- **"Redirects"** bölümünde şu URI'ler olmalı:
  ```
  http://localhost:8080/auth/callback
  ```

### 4. Eski URI'leri Silin
- Eğer şunlar varsa SİLİN:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:5000/auth/callback`
  - `http://localhost:8080/auth/callback` (eski)

### 5. Yeni URI Ekleyin
- **"Add Redirect"** butonuna tıklayın
- Şu URI'yi yazın:
  ```
  http://localhost:8080/auth/callback
  ```
- **"Save Changes"** butonuna tıklayın

### 6. Test Edin
- `http://localhost:8080` adresine gidin
- "Discord ile Giriş" butonuna tıklayın
- Discord'da "Authorize" butonuna tıklayın

## 🎯 Önemli Notlar:

- ✅ **Client ID**: (Uygulama panelinizden alın)
- ✅ **Client Secret**: (Güvenli tutun — .env dosyanıza yerleştirin)
- ⚠️ **Redirect URI**: `http://localhost:8080/auth/callback` (Discord'da olmalı)

## 🚨 Hata Mesajları:

### "redirect_uri_mismatch"
- Discord'da Redirect URI'nin tam olarak eşleştiğinden emin olun
- `http://localhost:8080/auth/callback` (tam olarak bu)

### "access_denied"
- Discord'da "Authorize" butonuna tıkladığınızdan emin olun
- "Cancel" butonuna basmayın

### "invalid_client"
- Client Secret'ın doğru olduğundan emin olun
- Boşluk veya fazladan karakter olmamalı
