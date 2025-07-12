import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function LoanPredictionForm({ userData }) {
  const [formData, setFormData] = useState({
    saving_times_per_period: '',
    total_current_saving: '',
    completed_saving_cycles: '',
    user_savings_made: '',
    user_joined_year: '',
    ikimina_created_year: '',
    user_age: '',
    has_guardian: 0,
    employment_status: '',
    saving_frequency: '',
    recent_loan_payment_status: '',
    model_choice: 'Random Forest'
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Prefill if userData is passed
  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        total_current_saving: userData.savings ?? '',
        user_joined_year: userData.joinYear ?? '',
        ikimina_created_year: userData.ikiminaYear ?? '',
        user_age: userData.age ?? '',
        has_guardian: userData.hasGuardian ?? 0,
        employment_status: userData.employmentStatus ?? '',
        saving_frequency: userData.savingFrequency ?? '',
        recent_loan_payment_status: 'Good',
        saving_times_per_period: 3,
        completed_saving_cycles: 10,
        user_savings_made: 9
      }));
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);

    // Basic validation
    const requiredFields = [
      'saving_times_per_period',
      'total_current_saving',
      'completed_saving_cycles',
      'user_savings_made',
      'user_joined_year',
      'ikimina_created_year',
      'user_age',
      'has_guardian',
      'employment_status',
      'saving_frequency',
      'recent_loan_payment_status',
      'model_choice'
    ];

    const missing = requiredFields.filter(field => formData[field] === '' || formData[field] === null);
    if (missing.length > 0) {
      setError(`Please fill all fields: ${missing.join(', ')}`);
      return;
    }

    try {
      const res = await axios.post('/loan/predict', formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3">
      {/* All inputs like before, unchanged */}
      {/* ... input fields here (omitted for brevity) ... */}

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Predict Loan
      </button>

      {result && (
        <div className="mt-4 text-green-600 font-bold">
          {result.message}
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-600">
          <strong>Error:</strong> {error}
        </div>
      )}
    </form>
  );
}
