// REMAP Academy — Send Payment Instructions Email
// Chamada pelo checkout imediatamente após o cliente confirmar cripto ou transferência
// Env vars: RESEND_API_KEY

const SELLER_EMAIL = 'info@remapacademy.pt';
const FROM_EMAIL   = 'REMAP Academy <invoices@remapacademy.pt>';

const WALLETS = {
  BTC:  '138n7gX37CXJSLwqtCkcQc9vdNZw7pf32r',
  ETH:  '0x09e4b47e46fc673b186f08e6c76e354373f55abe',
  USDT: 'THdoBgjDoFYQy3M6FQ9wQRzPASRzY4T6w6',
};

const BANK = {
  beneficiary: 'REMAP LLC',
  iban:        'DE34 2022 0800 0029 6821 40',
  swift:       'SXPYDEHH',
  bank:        'Banking Circle S.A.',
  country:     'Germany',
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { nome, email, curso, formato, pagamento, cryptoCoin, cryptoAmount, totalEur, lang } = body;
  const isEn = lang === 'en';

  const courseLabel = (() => {
    const map = {
      essential: { pres: 'REMAP Start — Presencial', online: 'REMAP Start — Online' },
      advanced:  { pres: 'REMAP Pro — Presencial',   online: 'REMAP Pro — Online'   },
      consult4:  { pres: 'Pack 4 Sessões',            online: 'Pack 4 Sessões'       },
      consult1:  { pres: 'Sessão Única',              online: 'Sessão Única'         },
    };
    return (map[curso] || map.essential)[formato] || `${curso} — ${formato}`;
  })();

  let subject, htmlBody, textBody;

  if (pagamento === 'cripto') {
    const wallet = WALLETS[cryptoCoin] || WALLETS.BTC;
    const coin   = cryptoCoin || 'BTC';

    subject = isEn
      ? `Payment instructions — ${courseLabel} — REMAP Academy`
      : `Instruções de pagamento — ${courseLabel} — REMAP Academy`;

    htmlBody = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:32px">
  <img src="https://remapacademy.pt/assets/logo.png" alt="REMAP Academy" style="height:60px;margin-bottom:24px" onerror="this.style.display='none'">
  <h2 style="color:#0BABDD;margin-bottom:4px">${isEn ? 'Payment Instructions' : 'Instruções de Pagamento'}</h2>
  <p style="color:#555;margin-top:0">${isEn ? 'Cryptocurrency' : 'Criptomoeda'} — ${coin}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
  <p>${isEn ? `Dear ${nome},` : `Olá ${nome},`}</p>
  <p>${isEn
    ? `Thank you for your enrolment in <strong>${courseLabel}</strong>. Please send the exact amount below to complete your registration.`
    : `Obrigado pela tua inscrição em <strong>${courseLabel}</strong>. Por favor envia o valor exacto abaixo para concluir o registo.`
  }</p>

  <div style="background:#fffbf0;border:1px solid #f59e0b;border-radius:8px;padding:20px;margin:20px 0">
    <div style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#92400e;margin-bottom:4px">${isEn ? 'Amount to send' : 'Valor a enviar'}</div>
      <div style="font-size:24px;font-weight:700;color:#1a1a1a">${cryptoAmount} ${coin}</div>
      <div style="font-size:12px;color:#92400e;margin-top:2px">(≈ €${totalEur} EUR ${isEn ? 'incl. 4% processing fee' : 'incl. 4% taxa de processamento'})</div>
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#92400e;margin-bottom:4px">${isEn ? 'Wallet address' : 'Endereço de carteira'} (${coin})</div>
      <div style="font-family:monospace;font-size:13px;background:#fff;border:1px solid #fcd34d;border-radius:4px;padding:10px;word-break:break-all">${wallet}</div>
    </div>
  </div>

  <div style="background:#f0f9ff;border:1px solid #0BABDD;border-radius:8px;padding:16px;margin:20px 0;font-size:13px">
    <strong>${isEn ? '⚠️ Important:' : '⚠️ Importante:'}</strong>
    ${isEn
      ? ` After sending, reply to this email or write to <strong>${SELLER_EMAIL}</strong> with:<br>• Your name<br>• Course: ${courseLabel}<br>• Transaction hash/ID<br><br>Your enrolment will be activated after blockchain confirmation.`
      : ` Após o envio, responde a este email ou escreve para <strong>${SELLER_EMAIL}</strong> com:<br>• O teu nome<br>• Curso: ${courseLabel}<br>• Hash/ID da transacção<br><br>A inscrição é activada após confirmação na blockchain.`
    }
  </div>

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="font-size:12px;color:#888">REMAP Academy · remapacademy.pt · ${SELLER_EMAIL}</p>
</body></html>`;

    textBody = isEn
      ? `Dear ${nome},\n\nThank you for your enrolment in ${courseLabel}.\n\nCRYPTO PAYMENT DETAILS\nAmount: ${cryptoAmount} ${coin}\nWallet (${coin}): ${wallet}\n\nAfter sending, email ${SELLER_EMAIL} with your name, course and transaction hash.\n\nREMAP Academy`
      : `Olá ${nome},\n\nObrigado pela tua inscrição em ${courseLabel}.\n\nDADOS DE PAGAMENTO CRIPTO\nValor: ${cryptoAmount} ${coin}\nCarteira (${coin}): ${wallet}\n\nApós o envio, escreve para ${SELLER_EMAIL} com o teu nome, curso e hash da transacção.\n\nREMAP Academy`;

  } else {
    // Transferência bancária
    subject = isEn
      ? `Payment instructions — ${courseLabel} — REMAP Academy`
      : `Instruções de pagamento — ${courseLabel} — REMAP Academy`;

    const eurFormatted = Number(totalEur).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    htmlBody = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:32px">
  <img src="https://remapacademy.pt/assets/logo.png" alt="REMAP Academy" style="height:60px;margin-bottom:24px" onerror="this.style.display='none'">
  <h2 style="color:#0BABDD;margin-bottom:4px">${isEn ? 'Payment Instructions' : 'Instruções de Pagamento'}</h2>
  <p style="color:#555;margin-top:0">${isEn ? 'Bank Transfer' : 'Transferência Bancária'} — SEPA</p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
  <p>${isEn ? `Dear ${nome},` : `Olá ${nome},`}</p>
  <p>${isEn
    ? `Thank you for your enrolment in <strong>${courseLabel}</strong>. Please transfer the exact amount below using the bank details provided.`
    : `Obrigado pela tua inscrição em <strong>${courseLabel}</strong>. Por favor efectua a transferência do valor exacto abaixo para os dados bancários indicados.`
  }</p>

  <div style="background:#f0f9ff;border:1px solid #0BABDD;border-radius:8px;padding:20px;margin:20px 0">
    <div style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#0369a1;margin-bottom:4px">${isEn ? 'Amount to transfer' : 'Valor a transferir'}</div>
      <div style="font-size:28px;font-weight:700;color:#1a1a1a">€${eurFormatted}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr><td style="padding:6px 0;color:#555;width:140px">${isEn ? 'Beneficiary' : 'Beneficiário'}</td><td style="padding:6px 0;font-weight:600">${BANK.beneficiary}</td></tr>
      <tr style="background:#e0f2fe"><td style="padding:6px 8px;color:#555">IBAN</td><td style="padding:6px 8px;font-family:monospace;font-weight:600;letter-spacing:.04em">${BANK.iban}</td></tr>
      <tr><td style="padding:6px 0;color:#555">SWIFT / BIC</td><td style="padding:6px 0;font-weight:600">${BANK.swift}</td></tr>
      <tr style="background:#e0f2fe"><td style="padding:6px 8px;color:#555">${isEn ? 'Bank' : 'Banco'}</td><td style="padding:6px 8px;font-weight:600">${BANK.bank}</td></tr>
      <tr><td style="padding:6px 0;color:#555">${isEn ? 'Country' : 'País'}</td><td style="padding:6px 0;font-weight:600">${BANK.country}</td></tr>
      <tr style="background:#e0f2fe"><td style="padding:6px 8px;color:#555">${isEn ? 'Reference' : 'Referência'}</td><td style="padding:6px 8px;font-weight:600">${nome} — ${courseLabel}</td></tr>
    </table>
  </div>

  <div style="background:#f0fdf4;border:1px solid #22c55e;border-radius:8px;padding:16px;margin:20px 0;font-size:13px">
    <strong>${isEn ? '⚠️ Important:' : '⚠️ Importante:'}</strong>
    ${isEn
      ? ` After the transfer, reply to this email or send the payment receipt to <strong>${SELLER_EMAIL}</strong> with:<br>• Your name<br>• Course: ${courseLabel}<br><br>Your enrolment and invoice will be sent after payment confirmation.`
      : ` Após a transferência, responde a este email ou envia o comprovativo para <strong>${SELLER_EMAIL}</strong> com:<br>• O teu nome<br>• Curso: ${courseLabel}<br><br>A inscrição e fatura são enviadas após confirmação do pagamento.`
    }
  </div>

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="font-size:12px;color:#888">REMAP Academy · remapacademy.pt · ${SELLER_EMAIL}</p>
</body></html>`;

    textBody = isEn
      ? `Dear ${nome},\n\nThank you for your enrolment in ${courseLabel}.\n\nBANK TRANSFER DETAILS\nAmount: €${eurFormatted}\nBeneficiary: ${BANK.beneficiary}\nIBAN: ${BANK.iban}\nSWIFT: ${BANK.swift}\nBank: ${BANK.bank}\nReference: ${nome} — ${courseLabel}\n\nAfter transfer, send receipt to ${SELLER_EMAIL}.\n\nREMAP Academy`
      : `Olá ${nome},\n\nObrigado pela tua inscrição em ${courseLabel}.\n\nDADOS BANCÁRIOS\nValor: €${eurFormatted}\nBeneficiário: ${BANK.beneficiary}\nIBAN: ${BANK.iban}\nSWIFT: ${BANK.swift}\nBanco: ${BANK.bank}\nReferência: ${nome} — ${courseLabel}\n\nApós transferência, envia comprovativo para ${SELLER_EMAIL}.\n\nREMAP Academy`;
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to:  [email],
        bcc: [SELLER_EMAIL],
        subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    const result = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(result));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, id: result.id }),
    };

  } catch (err) {
    console.error('Resend error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
