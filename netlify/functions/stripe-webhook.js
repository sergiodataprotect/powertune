// REMAP Academy — Stripe Webhook
// Env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, JSONBIN_API_KEY, JSONBIN_BIN_ID
// Regista em: dashboard.stripe.com/webhooks → endpoint: https://remapacademy.pt/.netlify/functions/stripe-webhook
// Evento: checkout.session.completed

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { processInvoice } = require('./send-invoice');

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'ignored' };
  }

  const session = stripeEvent.data.object;
  const meta = session.metadata || {};

  // Cripto: sem fatura
  if (meta.payment_type === 'cripto') {
    return { statusCode: 200, body: 'no invoice for crypto' };
  }

  // Calcular IVA a partir dos dados da sessão
  const total    = session.amount_total / 100;
  const vatRate  = parseFloat(meta.vat_rate || '0');
  const subtotal = vatRate > 0
    ? Math.round(total / (1 + vatRate / 100) * 100) / 100
    : total;

  const customer = {
    name:    meta.nome    || session.customer_details?.name || 'Customer',
    email:   session.customer_details?.email || meta.email || '',
    company: meta.empresa || '',
    nif:     meta.nif     || '',
    country: session.customer_details?.address?.country || '',
  };

  try {
    const { invoiceNumber } = await processInvoice({
      customer,
      curso:         meta.curso   || 'essential',
      formato:       meta.formato || 'pres',
      subtotal,
      vatRate,
      lang:          meta.lang    || 'en',
      paymentMethod: 'stripe',
    });
    console.log(`Invoice ${invoiceNumber} sent to ${customer.email}`);
    return { statusCode: 200, body: `Invoice ${invoiceNumber} sent` };
  } catch (err) {
    console.error('Invoice error:', err.message);
    return { statusCode: 500, body: err.message };
  }
};
