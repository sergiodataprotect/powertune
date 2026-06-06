// REMAP Academy — Stripe Checkout Function
// Netlify Function: netlify/functions/create-checkout.js
//
// Variável de ambiente necessária no Netlify:
//   STRIPE_SECRET_KEY = sk_test_... (test) ou sk_live_... (produção)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Apenas POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { priceId, email, nome, curso, formato, tel, nif, empresa, totalEur, lang } = body;

  if (!priceId || !email) {
    return { statusCode: 400, body: 'Missing priceId or email' };
  }

  // Determinar métodos de pagamento disponíveis
  // mb_way e multibanco só estão disponíveis para contas Stripe PT
  const paymentMethods = ['card', 'mb_way', 'multibanco'];

  // Metadata para referência interna (aparece no dashboard Stripe)
  const metadata = {
    curso,
    formato,
    nome: nome || '',
    tel:  tel  || '',
    nif:  nif  || '',
    empresa: empresa || '',
    total_eur: String(totalEur || ''),
    lang: lang || 'pt',
  };

  const isEn = lang === 'en';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethods,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email,
      metadata,
      // Páginas de retorno — ajusta o domínio se necessário
      success_url: 'https://remapacademy.pt/obrigado.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:  'https://remapacademy.pt/checkout.html',
      // Locale da página Stripe
      locale: isEn ? 'en' : 'pt',
      // Campos adicionais na página Stripe (nome e telefone)
      phone_number_collection: { enabled: true },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ url: session.url }),
    };

  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
