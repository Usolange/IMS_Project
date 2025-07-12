const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/predict', async (req, res) => {
  try {
    // Forward request body to Flask API
    const response = await axios.post('http://localhost:5000/predict', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Loan prediction error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Loan prediction service failed' });
  }
});

module.exports = router;
