// REMAP Academy — Send Welcome Email
// Chamada por: obrigado.html (Stripe) e checkout.html (cripto/transferência)
// Env vars: RESEND_API_KEY, STRIPE_SECRET_KEY

const SELLER_EMAIL = 'info@remapacademy.pt';
const FROM_EMAIL   = 'REMAP Academy <invoices@remapacademy.pt>';
const LOGO_BASE64  =  + logo_data + ;

const COURSE_NAMES = {
  essential: { pres: 'REMAP Start — Presencial (2 dias)', online: 'REMAP Start — Online' },
  advanced:  { pres: 'REMAP Pro — Presencial (4 dias)',   online: 'REMAP Pro — Online'   },
  consult4:  { pres: 'Pack 4 Sessões',                    online: 'Pack 4 Sessões'       },
  consult1:  { pres: 'Sessão Única',                      online: 'Sessão Única'         },
};

const CONSULTING_INCLUDES = {
  en: ['1-hour private session with expert trainer', 'Voice or video call', 'Technical support on your specific case'],
  pt: ['Sessão privada de 1h com o formador especialista', 'Chamada de voz ou vídeo', 'Apoio técnico no teu caso específico'],
};

const COURSE_INCLUDES = {
  essential: {
    pres: { en: ['2-day intensive in-person training', 'All materials included', 'REMAP Academy certificate', '30-day free consulting'], pt: ['2 dias de formação presencial intensiva', 'Todos os materiais incluídos', 'Certificado REMAP Academy', '30 dias de consultoria gratuita'] },
    online: { en: ['Lifetime access to video lessons', '30+ HD video lessons', 'Practice training files', 'Digital certificate', 'Technical support via dedicated channel'], pt: ['Acesso vitalício às vídeo-aulas', '+30 aulas em vídeo HD', 'Ficheiros de treino para praticar', 'Certificado digital', 'Suporte técnico via canal dedicado'] },
  },
  advanced: {
    pres: { en: ['4-day intensive training (includes Essential)', 'All materials included', 'REMAP Academy Advanced certificate', '60-day priority consulting'], pt: ['4 dias de formação (inclui Essential)', 'Todos os materiais incluídos', 'Certificado REMAP Academy Advanced', '60 dias de consultoria prioritária'] },
    online: { en: ['Lifetime access (Essential + Advanced)', '60+ HD video lessons', 'Advanced practice files', 'Digital Advanced certificate', 'Priority technical support'], pt: ['Acesso vitalício (Essential + Advanced)', '+60 aulas em vídeo HD', 'Ficheiros de treino avançados', 'Certificado digital Advanced', 'Suporte técnico prioritário'] },
  },
};

function buildWelcomeHTML({ nome, email, curso, formato, total, paymentMethod, lang }) {
  const isEn = lang === 'en';
  const courseLabel = (COURSE_NAMES[curso] || COURSE_NAMES.essential)[formato] || `${curso}`;
  const isConsult = curso === 'consult1' || curso === 'consult4';

  const includes = isConsult
    ? (isEn ? CONSULTING_INCLUDES.en : CONSULTING_INCLUDES.pt)
    : ((COURSE_INCLUDES[curso] || COURSE_INCLUDES.essential)[formato] || {})[isEn ? 'en' : 'pt'] || [];

  const paymentLabel = {
    stripe: isEn ? 'Card / MB WAY / Multibanco' : 'Cartão / MB WAY / Multibanco',
    transfer: isEn ? 'Bank Transfer (pending confirmation)' : 'Transferência Bancária (aguarda confirmação)',
    cripto: isEn ? 'Cryptocurrency (pending confirmation)' : 'Criptomoeda (aguarda confirmação)',
  }[paymentMethod] || paymentMethod;

  const nextSteps = paymentMethod === 'stripe'
    ? (isEn
        ? ['You will receive login credentials for the members area by email', 'Check your spam folder if you don't receive it within 24h', 'Contact us at info@remapacademy.pt for any questions']
        : ['Receberás as credenciais de acesso à área de membros por email', 'Verifica o spam se não receberes em 24h', 'Contacta-nos em info@remapacademy.pt para qualquer dúvida'])
    : (isEn
        ? ['Send your payment proof to info@remapacademy.pt', 'Your enrolment will be activated after payment confirmation', 'You will receive access credentials once confirmed']
        : ['Envia o comprovativo de pagamento para info@remapacademy.pt', 'A tua inscrição será activada após confirmação do pagamento', 'Receberás as credenciais de acesso após confirmação']);

  const fmt = v => '€' + Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const accentColor = (curso === 'advanced') ? '#F36308' : '#0BABDD';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;color:#1a1a1a;margin:0;padding:0;background:#f5f5f5">
<div style="max-width:600px;margin:0 auto;background:#fff">

  <!-- Header -->
  <div style="background:#141213;padding:32px 40px;text-align:center">
    <img src="${LOGO_BASE64}" alt="REMAP Academy" style="height:70px;width:auto">
  </div>

  <!-- Hero -->
  <div style="background:${accentColor};padding:32px 40px;text-align:center">
    <div style="font-size:40px;margin-bottom:8px">🎉</div>
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">${isEn ? 'Welcome to REMAP Academy!' : 'Bem-vindo à REMAP Academy!'}</h1>
    <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:15px">${isEn ? `Your enrolment in <strong>${courseLabel}</strong> has been received.` : `A tua inscrição em <strong>${courseLabel}</strong> foi recebida.`}</p>
  </div>

  <!-- Body -->
  <div style="padding:36px 40px">
    <p style="font-size:15px;margin:0 0 24px">${isEn ? `Dear <strong>${nome}</strong>,` : `Olá <strong>${nome}</strong>,`}</p>
    <p style="font-size:14px;color:#555;margin:0 0 28px;line-height:1.7">${isEn
      ? `Thank you for choosing REMAP Academy. ${paymentMethod === 'stripe' ? 'Your payment has been confirmed and your enrolment is now active.' : 'Your enrolment has been received and is pending payment confirmation.'}`
      : `Obrigado por escolheres a REMAP Academy. ${paymentMethod === 'stripe' ? 'O teu pagamento foi confirmado e a tua inscrição está activa.' : 'A tua inscrição foi recebida e aguarda confirmação de pagamento.'}`
    }</p>

    <!-- Order summary -->
    <div style="background:#f9f9f9;border-radius:10px;padding:20px 24px;margin-bottom:28px;border:1px solid #eee">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:14px">${isEn ? 'Order Summary' : 'Resumo da Inscrição'}</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:14px;color:#333">${courseLabel}</span>
        <span style="font-size:14px;font-weight:700">${fmt(total)}</span>
      </div>
      <div style="border-top:1px solid #eee;margin:10px 0;padding-top:10px;display:flex;justify-content:space-between">
        <span style="font-size:12px;color:#888">${isEn ? 'Payment method' : 'Método de pagamento'}</span>
        <span style="font-size:12px;color:#555">${paymentLabel}</span>
      </div>
    </div>

    <!-- What's included -->
    ${includes.length ? `
    <div style="margin-bottom:28px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:12px">${isEn ? "What's included" : 'O que está incluído'}</div>
      ${includes.map(item => `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px"><span style="color:${accentColor};font-size:16px;line-height:1.2">✓</span><span style="font-size:14px;color:#444;line-height:1.5">${item}</span></div>`).join('')}
    </div>` : ''}

    <!-- Next steps -->
    <div style="background:#fff9f0;border-left:3px solid ${accentColor};border-radius:0 8px 8px 0;padding:18px 20px;margin-bottom:28px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:12px">${isEn ? 'Next Steps' : 'Próximos Passos'}</div>
      ${nextSteps.map((s, i) => `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px"><span style="background:${accentColor};color:#fff;border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${i+1}</span><span style="font-size:13px;color:#444;line-height:1.5">${s}</span></div>`).join('')}
    </div>

    <!-- Contact -->
    <div style="text-align:center;padding:20px;background:#f9f9f9;border-radius:10px">
      <p style="font-size:13px;color:#666;margin:0 0 8px">${isEn ? 'Questions? We're here to help.' : 'Dúvidas? Estamos aqui para ajudar.'}</p>
      <a href="mailto:info@remapacademy.pt" style="color:${accentColor};font-weight:700;font-size:14px;text-decoration:none">info@remapacademy.pt</a>
      <span style="color:#ccc;margin:0 8px">·</span>
      <a href="https://wa.me/351939056565" style="color:${accentColor};font-weight:700;font-size:14px;text-decoration:none">+351 939 056 565</a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#141213;padding:20px 40px;text-align:center">
    <p style="color:rgba(255,255,255,.3);font-size:11px;margin:0">REMAP Academy · remapacademy.pt · info@remapacademy.pt</p>
    <p style="color:rgba(255,255,255,.2);font-size:10px;margin:6px 0 0">REMAP LLC · 30 North Gould Street, Ste R, Sheridan, Wyoming 82801, United States</p>
  </div>
</div>
</body></html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Se vier session_id, vai buscar detalhes ao Stripe
  if (body.sessionId) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    try {
      const session = await stripe.checkout.sessions.retrieve(body.sessionId);
      if (session.payment_status !== 'paid') {
        return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'not paid yet' }) };
      }
      const meta = session.metadata || {};
      body = {
        nome:          meta.nome || session.customer_details?.name || 'Cliente',
        email:         session.customer_details?.email || '',
        curso:         meta.curso   || 'essential',
        formato:       meta.formato || 'online',
        total:         (session.amount_total || 0) / 100,
        paymentMethod: 'stripe',
        lang:          meta.lang || 'pt',
      };
    } catch(err) {
      console.error('Stripe session error:', err.message);
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  const { nome, email, curso, formato, total, paymentMethod, lang } = body;
  if (!email) return { statusCode: 400, body: 'Missing email' };

  const isEn = lang === 'en';
  const courseLabel = (COURSE_NAMES[curso] || COURSE_NAMES.essential)[formato] || curso;

  const subject = isEn
    ? `Welcome to REMAP Academy — ${courseLabel}`
    : `Bem-vindo à REMAP Academy — ${courseLabel}`;

  const html = buildWelcomeHTML({ nome, email, curso, formato, total, paymentMethod, lang });

  try {
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
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, id: result.id }),
    };
  } catch(err) {
    console.error('Resend error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
