const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const PAYPACK_BASE_URL = 'https://payments.paypack.rw/api';
const PAYPACK_CLIENT_ID = process.env.PAYPACK_CLIENT_ID;
const PAYPACK_CLIENT_SECRET = process.env.PAYPACK_CLIENT_SECRET;

let accessToken = null;
let refreshToken = null;
let tokenExpiry = null;

// Get access token or return cached if valid
async function getAccessToken() {
  const now = Date.now();
  if (accessToken && tokenExpiry && now < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      `${PAYPACK_BASE_URL}/auth/agents/authorize`,
      {
        client_id: PAYPACK_CLIENT_ID,
        client_secret: PAYPACK_CLIENT_SECRET,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    accessToken = response.data.access;
    refreshToken = response.data.refresh;
    tokenExpiry = now + 14 * 60 * 1000; // Cache for 14 minutes
    return accessToken;
  } catch (err) {
    console.error('❌ Error fetching access token:', err.response?.data || err.message);
    throw err;
  }
}

// Refresh access token using refresh token
async function refreshAccessToken() {
  try {
    const response = await axios.get(
      `${PAYPACK_BASE_URL}/auth/agents/refresh/${refreshToken}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    accessToken = response.data.access;
    refreshToken = response.data.refresh;
    tokenExpiry = Date.now() + 14 * 60 * 1000;
    return accessToken;
  } catch (err) {
    console.error('❌ Failed to refresh token:', err.response?.data || err.message);
    throw err;
  }
}

// Cashin (deposit) request
async function cashin({ amount, phone, idempotencyKey = uuidv4() }) {
  const token = await getAccessToken();

  try {
    const response = await axios.post(
      `${PAYPACK_BASE_URL}/transactions/cashin`,
      {
        amount,
        number: phone,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error('❌ Error in cashin:', err.response?.data || err.message);
    throw err;
  }
}

// Cashout (withdraw) request
async function cashout({ amount, phone, idempotencyKey = uuidv4() }) {
  const token = await getAccessToken();

  try {
    const response = await axios.post(
      `${PAYPACK_BASE_URL}/transactions/cashout`,
      {
        amount,
        number: phone,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error('❌ Error in cashout:', err.response?.data || err.message);
    throw err;
  }
}

// Get transaction status by reference key
async function getTransactionStatus(referenceKey) {
  const token = await getAccessToken();

  try {
    const response = await axios.get(
      `${PAYPACK_BASE_URL}/transactions/find/${referenceKey}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error('❌ Error checking transaction status:', err.response?.data || err.message);
    throw err;
  }
}

// Get transaction events by reference and phone
async function getTransactionEvents({ referenceKey, phone }) {
  const token = await getAccessToken();

  try {
    const response = await axios.get(
      `${PAYPACK_BASE_URL}/events/transactions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        params: {
          ref: referenceKey,
          kind: 'CASHIN',
          client: phone,
        },
      }
    );

    return response.data; // contains array of event transactions
  } catch (err) {
    console.error('❌ Error fetching transaction events:', err.response?.data || err.message);
    throw err;
  }
}



module.exports = {
  cashin,
  cashout,
  getTransactionStatus,
  getTransactionEvents,
  getAccessToken,
  refreshAccessToken,
};
