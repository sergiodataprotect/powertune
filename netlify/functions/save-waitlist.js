// netlify/functions/save-waitlist.js
// Recebe um contacto da lista de espera e guarda no JSONBin

const JSONBIN_BASE = 'https://api.jsonbin.io/v3';

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const API_KEY = process.env.JSONBIN_API_KEY;
  const BIN_ID  = process.env.JSONBIN_BIN_ID;

  if (!API_KEY || !BIN_ID) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'JSONBin não configurado' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const { curso, nome, contacto } = body;
  if (!contacto) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Contacto obrigatório' }) };
  }

  try {
    // Ler bin actual
    const readRes = await fetch(`${JSONBIN_BASE}/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    if (!readRes.ok) throw new Error(`Leitura falhou: ${readRes.status}`);
    const data = await readRes.json();
    const record = data.record || {};

    // Adicionar à lista de espera
    const waitlist = Array.isArray(record.waitlist) ? record.waitlist : [];
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    waitlist.push({
      curso: curso || 'unknown',
      nome:  nome  || '',
      contacto,
      data: `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    });

    // Escrever bin actualizado
    const writeRes = await fetch(`${JSONBIN_BASE}/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify({ ...record, waitlist })
    });
    if (!writeRes.ok) throw new Error(`Escrita falhou: ${writeRes.status}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, total: waitlist.length })
    };

  } catch(e) {
    console.error('save-waitlist error:', e.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message })
    };
  }
};
