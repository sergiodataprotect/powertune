// REMAP Academy — Save Pending Transfer
// Chamada pelo checkout quando pagamento é por transferência bancária
// Env vars: JSONBIN_API_KEY, JSONBIN_BIN_ID

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const binId  = process.env.JSONBIN_BIN_ID;
  const apiKey = process.env.JSONBIN_API_KEY;

  // Ir buscar o estado actual do bin
  const r = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
    headers: { 'X-Master-Key': apiKey }
  });
  const data = await r.json();
  const record = data.record || {};
  const pending = record.pending_transfers || [];

  // Criar novo pedido pendente
  const newOrder = {
    id:        `TRF-${Date.now()}`,
    status:    'pending',
    createdAt: new Date().toISOString(),
    customer: {
      name:    body.nome    || '',
      email:   body.email   || '',
      company: body.empresa || '',
      nif:     body.nif     || '',
      country: body.country || '',
    },
    curso:    body.curso    || 'essential',
    formato:  body.formato  || 'pres',
    subtotal: body.subtotal || 0,
    vatRate:  body.vatRate  || 0,
    total:    body.total    || 0,
    lang:     body.lang     || 'pt',
  };

  pending.push(newOrder);

  await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': apiKey },
    body: JSON.stringify({ ...record, pending_transfers: pending })
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true, orderId: newOrder.id })
  };
};
