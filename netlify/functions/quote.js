const nodemailer = require('nodemailer');

const buildTransporter = () => {
  const host = process.env.SMTP_HOST;
  const portValue = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Missing SMTP config');
  }

  return nodemailer.createTransport({
    host,
    port: portValue,
    secure,
    auth: { user, pass }
  });
};

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' } };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, message: 'Method Not Allowed' });
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { ok: false, message: 'Invalid JSON body' });
  }

  const { name, phone, email, service_type, details } = payload;
  if (!name || !phone) {
    return json(400, { ok: false, message: 'Missing required fields' });
  }

  let transporter;
  try {
    transporter = buildTransporter();
  } catch (err) {
    return json(500, { ok: false, message: err.message || 'SMTP config error' });
  }

  const mailTo = process.env.MAIL_TO || 'cleannesssales@gmail.com';
  const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER;
  const replyTo = email || undefined;

  const subject = `ขอใบเสนอราคา - ${name}`;
  const text = [
    `ชื่อผู้ติดต่อ: ${name}`,
    `เบอร์โทร: ${phone}`,
    `อีเมล: ${email || '-'}`,
    `ประเภทบริการ: ${service_type || '-'}`,
    `รายละเอียดพื้นที่/งาน: ${details || '-'}`
  ].join('\n');

  const html = `
    <h2>ขอใบเสนอราคา</h2>
    <table cellpadding="6" cellspacing="0" border="0">
      <tr><td><strong>ชื่อผู้ติดต่อ</strong></td><td>${name}</td></tr>
      <tr><td><strong>เบอร์โทร</strong></td><td>${phone}</td></tr>
      <tr><td><strong>อีเมล</strong></td><td>${email || '-'}</td></tr>
      <tr><td><strong>ประเภทบริการ</strong></td><td>${service_type || '-'}</td></tr>
      <tr><td><strong>รายละเอียดพื้นที่/งาน</strong></td><td>${details || '-'}</td></tr>
    </table>
  `;

  try {
    await transporter.sendMail({
      to: mailTo,
      from: mailFrom,
      replyTo,
      subject,
      text,
      html
    });
    return json(200, { ok: true });
  } catch {
    return json(500, { ok: false, message: 'Send failed' });
  }
};
