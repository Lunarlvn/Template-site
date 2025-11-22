# Discord OAuth2 Kurulum Rehberi

## 🤖 Mevcut Botunuzu Kullanma

### 1. Botunuzun Bilgilerini Alın
- [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin
- **Mevcut botunuzu** seçin (Wagu bot)
- "General Information" bölümünden "Application ID"yi kopyalayın
- Bu ID'yi `script.js` dosyasındaki `DISCORD_CLIENT_ID` değişkenine yapıştırın

### 2. OAuth2 Ayarları ✅ TAMAMLANDI
- Sol menüden "OAuth2" > "General" seçin
- "Redirects" bölümüne şu URL'yi ekleyin:
  ```
  http://localhost:3000/auth/callback
  ```
  ✅ **Bu URL zaten eklendi!**

### 3. Production için Domain Ayarlama
- İleride domain'inizi kullanmak için:
  ```
  https://yourdomain.com/auth/callback
  ```
  - `script.js` dosyasındaki `DISCORD_REDIRECT_URI` değişkenini güncelleyin

### 3. Bot Permissions (Opsiyonel)
- Eğer bot komutları kullanmak istiyorsanız, botunuzun gerekli izinleri olduğundan emin olun
- "Bot" sekmesinden gerekli izinleri kontrol edin

## 🚀 Backend Kurulumu (Opsiyonel)

### Node.js Backend Örneği
```javascript
const express = require('express');
const axios = require('axios');

app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    
    try {
        // Exchange code for token
        const response = await axios.post('https://discord.com/api/oauth2/token', {
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI
        });
        
        const { access_token } = response.data;
        
        // Get user info
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        
        // Store user session
        req.session.user = userResponse.data;
        res.redirect('/');
        
    } catch (error) {
        res.redirect('/?error=discord_auth_failed');
    }
});
```

## 🔒 Güvenlik Notları

1. **Client Secret'ı asla frontend'de kullanmayın**
2. **HTTPS kullanın** (production'da)
3. **State parameter** ekleyin (CSRF koruması için)
4. **Token'ları güvenli şekilde saklayın**

## 📝 Kullanım

1. **Mevcut botunuzun Application ID'sini alın**
2. **Client ID'yi `script.js`'e ekleyin**
3. **Redirect URI'yi ayarlayın**
4. **Backend kurulumu yapın (opsiyonel)**
5. **Test edin!**

## 🎯 Avantajlar

- ✅ **Ayrı uygulama oluşturmaya gerek yok**
- ✅ **Mevcut botunuzla entegrasyon**
- ✅ **Tek bir Discord uygulaması**
- ✅ **Daha basit yönetim**
- ✅ **Bot komutları ile entegrasyon mümkün**

## 🎯 Özellikler

- ✅ Discord OAuth2 girişi
- ✅ Kullanıcı profil görüntüleme
- ✅ Oturum yönetimi
- ✅ Güvenli çıkış
- ✅ Responsive tasarım
- ✅ Bildirim sistemi
