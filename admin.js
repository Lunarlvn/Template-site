// Simple admin panel JS
async function api(path, opts = {}){
  opts.headers = opts.headers || {};
  const token = localStorage.getItem('discord_token');
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(path, opts);
  return res.json();
}

async function initAdmin(){
  const user = JSON.parse(localStorage.getItem('discord_user') || 'null');
  if (!user) {
    document.getElementById('servers-list').innerHTML = '<p>Lütfen giriş yapın.</p>';
    return;
  }
  document.getElementById('admin-user').textContent = user.username;

  // fetch servers
  const serversResp = await api('/api/my-servers');
  if (serversResp.error) {
    // If the server returned unauthorized or no_token, prompt re-login
    const details = serversResp.details || '';
    if (serversResp.error === 'no_token' || (typeof details === 'string' && details.includes('401')) || (details && details.message && details.message.includes('401'))) {
      document.getElementById('servers-list').innerHTML = `<p>Sunucular alınamadı: Yetkilendirme gerekiyor. Lütfen tekrar giriş yapın.</p><p><button class="btn btn-primary" onclick="window.location.href='/auth/login'">Tekrar giriş yap</button></p>`;
      return;
    }

    document.getElementById('servers-list').innerHTML = `<p>Sunucular alınamadı. Hata: ${serversResp.error}${serversResp.details?(' - '+JSON.stringify(serversResp.details)):''}</p>`;
    return;
  }

  const list = document.getElementById('servers-list');
  list.innerHTML = '';
  serversResp.servers.forEach(s => {
    const el = document.createElement('div');
    el.className = 'feature-card';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'space-between';
    el.style.marginBottom = '1rem';
    // show bot presence badge
    const botBadge = s.botPresent ? '<span style="color:#10b981;font-weight:600;margin-left:8px;">Bot mevcut</span>' : '<span style="color:#f97316;font-weight:600;margin-left:8px;">Bot yok</span>';
    el.innerHTML = `<div style="display:flex;align-items:center;gap:1rem;"><img src="${s.icon?`https://cdn.discordapp.com/icons/${s.id}/${s.icon}.png?size=64`:'/favicon.ico'}" style="width:48px;height:48px;border-radius:8px;"/><div><strong>${s.name}</strong>${botBadge}<div style="font-size:12px;color:#9ca3af;">Sunucu ID: ${s.id}</div></div></div><button class="btn btn-primary" onclick="openServer('${s.id}','${s.name}', ${s.botPresent})">Ayarlar</button>`;
    list.appendChild(el);
  });
}

let currentGuild = null;
let currentSettings = null;
let dirty = false;

async function openServer(id, name, botPresent=true){
  currentGuild = id;
  document.getElementById('server-title').textContent = name;
  document.getElementById('server-settings').style.display = 'block';

  // load mock channels
  const ch = await api(`/api/guild-channels?guildId=${encodeURIComponent(id)}`);
  const options = ch.channels.filter(c=>c.type==='text').map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('welcome-channel').innerHTML = options;
  document.getElementById('log-channel').innerHTML = options;
  document.getElementById('ticket-channel').innerHTML = options;

  // load existing settings
  const sres = await api(`/api/get-settings?guildId=${encodeURIComponent(id)}`);
  currentSettings = sres.settings || { welcomeEnabled: false, welcomeChannel: null, logChannel: null, ticketChannel: null };
  document.getElementById('toggle-welcome').checked = !!currentSettings.welcomeEnabled;
  document.getElementById('welcome-channel').value = currentSettings.welcomeChannel || '';
  document.getElementById('log-channel').value = currentSettings.logChannel || '';
  document.getElementById('ticket-channel').value = currentSettings.ticketChannel || '';

  setDirty(false);
  // If bot is not present, show a helpful notice but allow saving (settings will apply when bot is added)
  const saveBtn = document.getElementById('save-btn');
  saveBtn.disabled = false;
  if (!botPresent) {
    saveBtn.title = 'Bot bu sunucuda değil; ayarlar kaydedilebilir ancak bot eklendiğinde uygulanacaktır.';
    document.getElementById('save-bar').innerHTML = 'Uyarı: Bot bu sunucuda değil. Ayarlar kaydedilebilir; ancak bot eklendiğinde uygulanacaktır.';
    // show the bar only if there are unsaved changes
    document.getElementById('save-bar').style.display = dirty ? 'block' : 'none';
  } else {
    saveBtn.title = '';
    document.getElementById('save-bar').innerHTML = 'Değişiklikler kaydedilmedi. Kaydetmek ister misiniz? <button id="save-btn" class="btn btn-primary" style="margin-left:1rem;">Kaydet</button>';
    document.getElementById('save-bar').style.display = dirty ? 'block' : 'none';
  }
}

function setDirty(v){ dirty = v; document.getElementById('save-bar').style.display = v ? 'block' : 'none'; }

// UI events
document.addEventListener('DOMContentLoaded', function(){
  initAdmin();
  document.getElementById('toggle-welcome').addEventListener('change', function(e){
    document.getElementById('channel-chooser').style.display = e.target.checked ? 'block':'none';
    setDirty(true);
  });
  ['welcome-channel','log-channel','ticket-channel'].forEach(id=>{
    document.getElementById(id).addEventListener('change',()=>setDirty(true));
  });
  document.getElementById('save-btn').addEventListener('click', async function(){
    const settings = {
      welcomeEnabled: document.getElementById('toggle-welcome').checked,
      welcomeChannel: document.getElementById('welcome-channel').value,
      logChannel: document.getElementById('log-channel').value,
      ticketChannel: document.getElementById('ticket-channel').value
    };
    const res = await api('/api/save-settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ guildId: currentGuild, settings }) });
    if (res.ok) {
      setDirty(false);
      if (res.botPresent) alert('Ayarlar kaydedildi ve botta uygulandı.');
      else alert('Ayarlar kaydedildi. Bot bu sunucuda olmadığı için ayarlar bot eklendiğinde uygulanacaktır.');
    } else {
      alert('Kaydetme başarısız: '+(res.error||'unknown'));
    }
  });
});
