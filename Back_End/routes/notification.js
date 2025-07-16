require('dotenv').config();
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send member credentials SMS via Twilio
 * @param {string} phone - recipient phone number
 * @param {string} code - member code
 * @param {string} pass - member password
 */
async function sendSms(phone, code, pass) {
  return client.messages.create({
    body: `Your member credentials:\nCode: ${code}\nPassword: ${pass}`,
    from: twilioPhone,
    to: phone,
  });
}

/**
 * Send arbitrary SMS text via Twilio
 * @param {string} phone
 * @param {string} text
 */
async function sendCustomSms(phone, text) {
  return client.messages.create({
    body: text,
    from: twilioPhone,
    to: phone,
  });
}

/**
 * Send member credentials Email via Nodemailer
 * @param {string} email - recipient email
 * @param {string} code - member code
 * @param {string} pass - member password
 * @param {string} name - member name
 * @param {string} iki_name - Ikimina name
 * @param {string} location - location string
 */
async function sendEmail(email, code, pass, name, iki_name, location) {
  const mailOptions = {
    from: `"Ikimina Management System" <${process.env.SMTP_USER}>`,
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
  return transporter.sendMail(mailOptions);
}

/**
 * Send arbitrary email with custom subject and html content
 * @param {string} email
 * @param {string} subject
 * @param {string} htmlContent
 */
async function sendCustomEmail(email, subject, htmlContent) {
  return transporter.sendMail({
    from: `"Ikimina Management System" <${process.env.SMTP_USER}>`,
    to: email,
    subject,
    html: htmlContent,
  });
}

module.exports = {
  sendSms,
  sendCustomSms,
  sendEmail,
  sendCustomEmail,
};
