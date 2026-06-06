// REMAP Academy — Send Invoice Function
// Chamada por: webhook Stripe (pagamentos automáticos) e confirm-transfer (manual)
// Env vars necessárias: STRIPE_SECRET_KEY, RESEND_API_KEY, JSONBIN_API_KEY, JSONBIN_BIN_ID

const { buildInvoiceHTML, SELLER } = require('./invoice-utils');

// ─── Número de fatura sequencial ─────────────────────────────────────────────
async function getNextInvoiceNumber() {
  const binId  = process.env.JSONBIN_BIN_ID;
  const apiKey = process.env.JSONBIN_API_KEY;

  const r = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
    headers: { 'X-Master-Key': apiKey }
  });
  const data = await r.json();
  const record = data.record || {};
  const current = record.invoice_counter || 0;
  const next = current + 1;

  // Guardar o novo contador
  const updated = { ...record, invoice_counter: next };
  await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': apiKey },
    body: JSON.stringify(updated)
  });

  const year = new Date().getFullYear();
  return `REMAP-${year}-${String(next).padStart(4, '0')}`;
}

// ─── Converter HTML para PDF via API ─────────────────────────────────────────
async function htmlToPdfBase64(html) {
  // Usamos a API gratuita do Gotenberg (self-hosted) ou html-pdf-node
  // Alternativa simples: enviar o HTML directamente como anexo .html
  // Para PDF real precisamos de puppeteer — usamos html como fallback seguro
  return Buffer.from(html).toString('base64');
}

// ─── Enviar email via Resend ──────────────────────────────────────────────────
async function sendInvoiceEmail({ to, invoiceNumber, invoiceHtml, customerName, total, lang }) {
  const isEn = lang === 'en';
  const subject = isEn
    ? `Invoice ${invoiceNumber} — REMAP Academy`
    : `Fatura ${invoiceNumber} — REMAP Academy`;

  const bodyText = isEn
    ? `Dear ${customerName},\n\nThank you for your purchase. Please find your invoice ${invoiceNumber} attached.\n\nBest regards,\nREMAP Academy\ninfo@remapacademy.pt`
    : `Olá ${customerName},\n\nObrigado pela tua compra. Em anexo encontras a fatura ${invoiceNumber}.\n\nCom os melhores cumprimentos,\nREMAP Academy\ninfo@remapacademy.pt`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'REMAP Academy <invoices@remapacademy.pt>',
      to: [to],
      bcc: [SELLER.email],
      subject,
      text: bodyText,
      attachments: [{
        filename: `${invoiceNumber}.html`,
        content: Buffer.from(invoiceHtml).toString('base64'),
      }],
    }),
  });

  const result = await r.json();
  if (!r.ok) throw new Error(`Resend error: ${JSON.stringify(result)}`);
  return result;
}

// ─── Função principal exportada ───────────────────────────────────────────────
async function processInvoice({ customer, curso, formato, subtotal, vatRate, lang, paymentMethod }) {
  const vatAmount = Math.round(subtotal * vatRate) / 100;
  const total = vatRate > 0 ? Math.round((subtotal + vatAmount) * 100) / 100 : subtotal;

  const vatNote = vatRate === 0 && customer.nif
    ? 'Intra-EU B2B supply — VAT exempt under Art. 44 Directive 2006/112/EC (reverse charge)'
    : null;

  const courseNames = {
    essential: { pres: 'REMAP Start — In-person Training (2 days)', online: 'REMAP Start — Online Course (lifetime access)' },
    advanced:  { pres: 'REMAP Pro — In-person Training (4 days)',   online: 'REMAP Pro — Online Course (lifetime access)' },
    consult4:  { pres: 'Private Consulting — Pack 4 Sessions',       online: 'Private Consulting — Pack 4 Sessions' },
    consult1:  { pres: 'Private Consulting — Single Session',        online: 'Private Consulting — Single Session' },
  };
  const description = (courseNames[curso] || courseNames.essential)[formato] || `${curso} — ${formato}`;

  const invoiceNumber = await getNextInvoiceNumber();
  const invoiceHtml = buildInvoiceHTML({
    invoiceNumber,
    date: new Date().toISOString(),
    customer,
    lines: [{ description, unit_price: subtotal, amount: subtotal }],
    subtotal,
    vatRate,
    vatAmount,
    total,
    vatNote,
    lang,
  });

  await sendInvoiceEmail({
    to: customer.email,
    invoiceNumber,
    invoiceHtml,
    customerName: customer.name,
    total,
    lang,
  });

  return { invoiceNumber, total };
}

module.exports = { processInvoice };
