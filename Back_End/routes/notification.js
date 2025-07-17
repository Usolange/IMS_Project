require('dotenv').config();
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const {
  TWILIO_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
} = process.env;

const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: SMTP_PORT === '465', // secure for SMTPS
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

async function sendSms(phone, code, pass) {
  try {
    return await client.messages.create({
      body: `Your member credentials:\nCode: ${code}\nPassword: ${pass}`,
      from: TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (err) {
    console.error('sendSms error:', err);
    throw err;
  }
}

async function sendCustomSms(phone, text) {
  try {
    return await client.messages.create({
      body: text,
      from: TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (err) {
    console.error('sendCustomSms error:', err);
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
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('sendEmail error:', err);
    throw err;
  }
}

async function sendCustomEmail(email, subject, htmlContent) {
  try {
    return await transporter.sendMail({
      from: `"Ikimina Management System" <${SMTP_USER}>`,
      to: email,
      subject,
      html: htmlContent,
    });
  } catch (err) {
    console.error('sendCustomEmail error:', err);
    throw err;
  }
}

module.exports = {
  sendSms,
  sendCustomSms,
  sendEmail,
  sendCustomEmail,
};
