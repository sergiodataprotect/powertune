// REMAP Academy — Stripe Checkout Function
// Env vars: STRIPE_SECRET_KEY, JSONBIN_API_KEY, JSONBIN_BIN_ID

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { priceId, email, nome, curso, formato, tel, nif, empresa, vatRate, subtotal, totalEur, lang } = body;

  if (!priceId || !email) {
    return { statusCode: 400, body: 'Missing priceId or email' };
  }

  const metadata = {
    curso:      curso     || '',
    formato:    formato   || '',
    nome:       nome      || '',
    tel:        tel       || '',
    nif:        nif       || '',
    empresa:    empresa   || '',
    vat_rate:   String(vatRate   || 0),
    subtotal:   String(subtotal  || totalEur || 0),
    total_eur:  String(totalEur  || 0),
    lang:       lang      || 'pt',
    payment_type: 'stripe',
  };

  const isEn = lang === 'en';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'mb_way', 'multibanco'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      customer_email: email,
      metadata,
      success_url: 'https://remapacademy.pt/obrigado.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:  'https://remapacademy.pt/checkout.html',
      locale: isEn ? 'en' : 'pt',
      phone_number_collection: { enabled: true },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
