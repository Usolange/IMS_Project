require('dotenv').config();
const nodemailer = require('nodemailer');
const axios = require('axios');

const {
  MISTA_API_TOKEN,
  MISTA_SENDER_ID,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
} = process.env;

// === Nodemailer Setup ===
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: SMTP_PORT === '465', // secure for SMTPS
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

// === Mista.io SMS Sender ===
async function sendSms(phone, code, pass) {
  const message = `Your member credentials:\nCode: ${code}\nPassword: ${pass}`;
  const formattedPhone = phone.startsWith('+') ? phone : `+25${phone}`;
  try {
    const response = await axios.post(
      'https://api.mista.io/sms',
      {
        to: formattedPhone,
        sender_id: MISTA_SENDER_ID || 'Ikimina',
        message: message,
        type: 'plain',
      },
      {
        headers: {
          Authorization: `Bearer ${MISTA_API_TOKEN}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`✅ SMS sent to ${formattedPhone}`, response.data);
    return response.data;
  } catch (err) {
    console.error('❌ sendSms error:', err.response?.data || err.message);
    throw err;
  }
}

async function sendCustomSms(phone, text) {
  const formattedPhone = phone.startsWith('+') ? phone : `+25${phone}`;
  try {
    const response = await axios.post(
      'https://api.mista.io/sms',
      {
        to: formattedPhone,
        sender_id: MISTA_SENDER_ID || 'Ikimina',
        message: text,
        type: 'plain',
      },
      {
        headers: {
          Authorization: `Bearer ${MISTA_API_TOKEN}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`✅ Custom SMS sent to ${formattedPhone}`, response.data);
    return response.data;
  } catch (err) {
    console.error('❌ sendCustomSms error:', err.response?.data || err.message);
    throw err;
  }
}

async function sendEmail(email, code, pass, name, iki_name, location) {
  const mailOptions = {
    from: `"Ikimina Management System" <${SMTP_USER}>`,
    to: email,
    subject: 'Your Member Access Credentials',
    html: `
      <p>Hello ${name},</p>
      <p>Your registration on Ikimina <strong>${iki_name}</strong> located at <strong>${location}</strong> has been successful.</p>
      <p>Your member credentials are:</p>
      <ul>
        <li><strong>Code:</strong> ${code}</li>
        <li><strong>Password:</strong> ${pass}</li>
      </ul>
      <p>Please keep them safe.</p>
      <br/>
      <p>– Manage your Savings, reports and finances</p>
    `,
  };
  try {
    const response = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}`);
    return response;
  } catch (err) {
    console.error('❌ sendEmail error:', err.message || err);
    throw err;
  }
}

async function sendCustomEmail(email, subject, htmlContent) {
  const mailOptions = {
    from: `"Ikimina Management System" <${SMTP_USER}>`,
    to: email,
    subject,
    html: htmlContent,
  };
  try {
    const response = await transporter.sendMail(mailOptions);
    console.log(`✅ Custom Email sent to ${email}`);
    return response;
  } catch (err) {
    console.error('❌ sendCustomEmail error:', err.message || err);
    throw err;
  }
}

module.exports = {
  sendSms,
  sendCustomSms,
  sendEmail,
  sendCustomEmail,
};
