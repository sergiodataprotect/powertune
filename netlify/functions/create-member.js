// REMAP Academy — Create Member + Send Credentials
// Chamada por: confirm-transfer.js e send-welcome-email.js (Stripe)
// Env vars: RESEND_API_KEY, JSONBIN_API_KEY, JSONBIN_BIN_ID

const SELLER_EMAIL = 'info@remapacademy.pt';
const FROM_EMAIL   = 'REMAP Academy <invoices@remapacademy.pt>';
const JSONBIN_BASE = 'https://api.jsonbin.io/v3';

// ─── Gerar password legível ───────────────────────────────────────────────────
function generatePassword() {
  const adjectives = ['Turbo','Boost','Power','Motor','Speed','Drive','Fuze','Nitro','Shift','Torque'];
  const nouns      = ['Remap','Tuner','Dyno','Stage','Flash','Chip','ECU','Map','Rev','Code'];
  const adj  = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num  = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}${num}`;
}

// ─── Criar utilizador no JSONBin ──────────────────────────────────────────────
async function createUserInDB({ nome, email, tel, curso, formato, password }) {
  const binId  = process.env.JSONBIN_BIN_ID;
  const apiKey = process.env.JSONBIN_API_KEY;

  const r = await fetch(`${JSONBIN_BASE}/b/${binId}/latest`, {
    headers: { 'X-Master-Key': apiKey }
  });
  const data = await r.json();
  const record = data.record || {};
  const users = record.users || [];

  // Verificar se já existe
  const existing = users.find(u => u.email === email);
  if (existing) {
    // Actualizar curso se necessário (upgrade para advanced)
    if (curso === 'advanced' && existing.curso !== 'advanced') {
      existing.curso = 'advanced';
      await fetch(`${JSONBIN_BASE}/b/${binId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Master-Key': apiKey },
        body: JSON.stringify({ ...record, users })
      });
    }
    return { user: existing, isNew: false };
  }

  // Determinar acesso: advanced → advanced (inclui essential), essential → essential
  const newUser = {
    id:       `u_${Date.now()}`,
    nome,
    email,
    tel:      tel || '',
    password,
    curso,   // 'essential' ou 'advanced'
    formato,
    estado:   'active',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await fetch(`${JSONBIN_BASE}/b/${binId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': apiKey },
    body: JSON.stringify({ ...record, users })
  });

  return { user: newUser, isNew: true };
}

// ─── Enviar email com credenciais ─────────────────────────────────────────────
async function sendCredentialsEmail({ nome, email, curso, formato, password, lang }) {
  const isEn = lang === 'en';
  const accentColor = curso === 'advanced' ? '#F36308' : '#0BABDD';

  const courseLabel = {
    essential: 'REMAP Start',
    advanced:  'REMAP Pro',
  }[curso] || curso;

  const accessModules = curso === 'advanced'
    ? (isEn ? 'REMAP Start + REMAP Pro (all modules)' : 'REMAP Start + REMAP Pro (todos os módulos)')
    : (isEn ? 'REMAP Start (modules 1–5)' : 'REMAP Start (módulos 1–5)');

  const subject = isEn
    ? `Your REMAP Academy access credentials — ${courseLabel}`
    : `As tuas credenciais de acesso REMAP Academy — ${courseLabel}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#1a1a1a;margin:0;padding:0;background:#f5f5f5">
<div style="max-width:600px;margin:0 auto;background:#fff">
  <div style="background:#141213;padding:28px 40px;text-align:center">
    <img src="https://remapacademy.pt/assets/logo.jpg" alt="REMAP Academy" style="height:65px;width:auto" onerror="this.style.display='none'">
  </div>
  <div style="background:${accentColor};padding:24px 40px;text-align:center">
    <div style="font-size:32px;margin-bottom:6px">🔐</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">${isEn ? 'Your access is ready!' : 'O teu acesso está pronto!'}</h1>
    <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:13px">${isEn ? 'Payment confirmed — ' : 'Pagamento confirmado — '}${courseLabel}</p>
  </div>
  <div style="padding:32px 40px">
    <p style="font-size:15px;margin:0 0 20px">${isEn ? `Dear <strong>${nome}</strong>,` : `Olá <strong>${nome}</strong>,`}</p>
    <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.7">${isEn
      ? 'Your payment has been confirmed. Below are your login credentials to access the members area.'
      : 'O teu pagamento foi confirmado. Abaixo encontras as tuas credenciais de acesso à área de membros.'
    }</p>

    <!-- Credenciais -->
    <div style="background:#f0f9ff;border:2px solid ${accentColor};border-radius:12px;padding:24px;margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:16px;text-align:center">${isEn ? 'Login Credentials' : 'Credenciais de Acesso'}</div>
      <div style="margin-bottom:14px">
        <div style="font-size:11px;color:#888;margin-bottom:4px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Username / Email</div>
        <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:12px 16px;font-family:monospace;font-size:15px;font-weight:600;color:#1a1a1a">${email}</div>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:11px;color:#888;margin-bottom:4px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Password</div>
        <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:12px 16px;font-family:monospace;font-size:18px;font-weight:700;color:${accentColor};letter-spacing:.05em">${password}</div>
      </div>
      <div style="text-align:center">
        <a href="https://remapacademy.pt/membros/" style="display:inline-block;background:${accentColor};color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px">${isEn ? '→ Access Members Area' : '→ Aceder à Área de Membros'}</a>
      </div>
    </div>

    <!-- Acesso -->
    <div style="background:#f9f9f9;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #eee">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:10px">${isEn ? 'Your Access' : 'O Teu Acesso'}</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#444;margin-bottom:6px">
        <span style="color:${accentColor};font-weight:700">✓</span>
        <span>${accessModules}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#444">
        <span style="color:${accentColor};font-weight:700">✓</span>
        <span>${isEn ? 'Lifetime access — no expiry' : 'Acesso vitalício — sem prazo de expiração'}</span>
      </div>
    </div>

    <div style="background:#fff9f0;border-left:3px solid ${accentColor};border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px;font-size:13px;color:#555;line-height:1.6">
      <strong>${isEn ? '⚠️ Keep safe:' : '⚠️ Guarda em segurança:'}</strong>
      ${isEn
        ? ' Do not share your credentials. You can change your password in the members area settings.'
        : ' Não partilhes as tuas credenciais. Podes alterar a password nas definições da área de membros.'}
    </div>

    <div style="text-align:center;padding:16px;background:#f9f9f9;border-radius:10px">
      <p style="font-size:13px;color:#666;margin:0 0 6px">${isEn ? 'Need help? We are here.' : 'Precisas de ajuda? Estamos aqui.'}</p>
      <a href="mailto:info@remapacademy.pt" style="color:${accentColor};font-weight:700;font-size:14px;text-decoration:none">info@remapacademy.pt</a>
      <span style="color:#ccc;margin:0 8px">·</span>
      <a href="https://wa.me/351939056565" style="color:${accentColor};font-weight:700;font-size:14px;text-decoration:none">+351 939 056 565</a>
    </div>
  </div>
  <div style="background:#141213;padding:18px 40px;text-align:center">
    <p style="color:rgba(255,255,255,.3);font-size:11px;margin:0">REMAP Academy · remapacademy.pt · info@remapacademy.pt</p>
  </div>
</div>
</body></html>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to:   [email],
      bcc:  [SELLER_EMAIL],
      subject,
      html,
    }),
  });
  const result = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(result));
  return result;
}

// ─── Exportar função principal ────────────────────────────────────────────────
async function createMemberAndSendCredentials({ nome, email, tel, curso, formato, lang }) {
  // Só para cursos (não consultoria)
  if (curso === 'consult1' || curso === 'consult4') return { skipped: true };

  const password = generatePassword();
  const { user, isNew } = await createUserInDB({ nome, email, tel, curso, formato, password });

  // Se já existia, usa a password existente (não sobrescreve)
  const finalPassword = isNew ? password : user.password;

  await sendCredentialsEmail({ nome, email, curso, formato, password: finalPassword, lang });

  return { ok: true, isNew, userId: user.id };
}

module.exports = { createMemberAndSendCredentials };
