const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const distDir = path.join(__dirname, 'dist');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const setStaticCacheHeaders = (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') {
    res.setHeader('Cache-Control', 'no-cache');
    return;
  }

  const imageLikeExt = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.gif', '.ico']);
  const fontExt = new Set(['.woff', '.woff2', '.ttf', '.otf']);

  if (imageLikeExt.has(ext) || fontExt.has(ext)) {
    res.setHeader('Cache-Control', 'public, max-age=2592000');
    return;
  }

  if (ext === '.css' || ext === '.js' || ext === '.mjs') {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
};

app.use(express.static(distDir, { setHeaders: setStaticCacheHeaders }));

const requireEnv = (key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required env: ${key}`);
  }
  return process.env[key];
};

const buildTransporter = () => {
  const host = requireEnv('SMTP_HOST');
  const portValue = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
  const user = requireEnv('SMTP_USER');
  const pass = requireEnv('SMTP_PASS');

  return nodemailer.createTransport({
    host,
    port: portValue,
    secure,
    auth: { user, pass }
  });
};

app.post('/api/quote', async (req, res) => {
  const { name, phone, email, service_type, details } = req.body || {};

  if (!name || !phone) {
    return res.status(400).json({ ok: false, message: 'Missing required fields' });
  }

  let transporter;
  try {
    transporter = buildTransporter();
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
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
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Send failed' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
