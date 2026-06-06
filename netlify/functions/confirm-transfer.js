// REMAP Academy — Confirm Transfer & Send Invoice
// Chamada pelo backoffice quando confirmas recebimento de transferência bancária
// Env vars: RESEND_API_KEY, JSONBIN_API_KEY, JSONBIN_BIN_ID
// POST body: { orderId, secret }  (secret = ADMIN_SECRET env var)

const { processInvoice } = require('./send-invoice');
const { createMemberAndSendCredentials } = require('./create-member');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Verificar autenticação simples
  if (body.secret !== process.env.ADMIN_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const binId  = process.env.JSONBIN_BIN_ID;
  const apiKey = process.env.JSONBIN_API_KEY;

  // Ir buscar o pedido pendente do JSONBin
  const r = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
    headers: { 'X-Master-Key': apiKey }
  });
  const data = await r.json();
  const record = data.record || {};
  const pending = (record.pending_transfers || []);
  const order = pending.find(o => o.id === body.orderId);

  if (!order) {
    return { statusCode: 404, body: 'Order not found' };
  }

  try {
    const { invoiceNumber } = await processInvoice({
      customer: order.customer,
      curso:    order.curso,
      formato:  order.formato,
      subtotal: order.subtotal,
      vatRate:  order.vatRate,
      lang:     order.lang,
      paymentMethod: 'transfer',
    });

    // Marcar como confirmado
    const updated = pending.map(o =>
      o.id === body.orderId
        ? { ...o, status: 'confirmed', invoiceNumber, confirmedAt: new Date().toISOString() }
        : o
    );
    await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': apiKey },
      body: JSON.stringify({ ...record, pending_transfers: updated })
    });

    // Criar membro e enviar credenciais de acesso
    await createMemberAndSendCredentials({
      nome:    order.customer.name,
      email:   order.customer.email,
      tel:     order.customer.tel || '',
      curso:   order.curso,
      formato: order.formato,
      lang:    order.lang,
    });

    console.log(`Transfer confirmed, invoice ${invoiceNumber} sent, member created`);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, invoiceNumber })
    };

  } catch (err) {
    console.error('Confirm transfer error:', err.message);
    return { statusCode: 500, body: err.message };
  }
};
