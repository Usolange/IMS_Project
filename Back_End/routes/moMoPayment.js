const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Config
const MOMO_BASE_URL = process.env.MOMO_BASE_URL;
const MOMO_API_USER = process.env.MOMO_API_USER;
const MOMO_API_KEY = process.env.MOMO_API_KEY;
const MOMO_SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY;
const MOMO_TARGET_ENV = process.env.MOMO_ENV || 'sandbox';

// Get access token
async function getAccessToken() {
  const response = await axios.post(
    `${MOMO_BASE_URL}/collection/token/`,
    {},
    {
      headers: {
        'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY,
        'Authorization': `Basic ${Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString('base64')}`
      }
    }
  );
  return response.data.access_token;
}

// Request payment
async function requestPayment({ amount, phone, currency = 'RWF', externalId = '', payerMessage = '', payeeNote = '' }) {
  const accessToken = await getAccessToken();
  const referenceId = uuidv4();

  const response = await axios.post(
    `${MOMO_BASE_URL}/collection/v1_0/requesttopay`,
    {
      amount: `${amount}`,
      currency,
      externalId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phone // e.g. 2507xxxxxxxx
      },
      payerMessage,
      payeeNote
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': MOMO_TARGET_ENV,
        'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  return referenceId;
}

// Poll for payment result
async function getPaymentStatus(referenceId) {
  const accessToken = await getAccessToken();

  const response = await axios.get(
    `${MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Target-Environment': MOMO_TARGET_ENV,
        'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY
      }
    }
  );

  return response.data; // { status: 'SUCCESSFUL' | 'FAILED' | 'PENDING', ... }
}

module.exports = { requestPayment, getPaymentStatus };
