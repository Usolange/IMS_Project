import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../CSS/LoanRequestModal.css';

function LoanRequestModal({ memberId, onClose, onLoanRequested }) {
  const [modalData, setModalData] = useState(null);
  const [eligibleLoanAmount, setEligibleLoanAmount] = useState(0);
  const [requestedAmount, setRequestedAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchModalData() {
      try {
        setLoading(true);
        const res = await axios.get(`/api/loanPredictionRoutes/modalInput/${memberId}`);
        if (res.data) {
          setModalData(res.data.data);
          const eligible = runYourMLModel(res.data.data);
          setEligibleLoanAmount(eligible);
        }
      } catch {
        setError('Failed to fetch loan eligibility.');
      } finally {
        setLoading(false);
      }
    }
    fetchModalData();
  }, [memberId]);

  // Dummy ML model logic (replace with your real one or API call)
  function runYourMLModel(data) {
    return data?.total_current_saving ? data.total_current_saving * 0.5 : 0;
  }

  const handleSubmit = async () => {
    setError('');
    if (!requestedAmount || isNaN(requestedAmount) || Number(requestedAmount) <= 0) {
      setError('Please enter a valid loan amount.');
      return;
    }
    if (Number(requestedAmount) > eligibleLoanAmount) {
      setError(`Requested amount exceeds eligible limit of ${eligibleLoanAmount.toFixed(2)} RWF`);
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/loans', {
        member_id: memberId,
        round_id: modalData.round_id,
        requested_amount: Number(requestedAmount),
      });
      alert('Loan request submitted successfully!');
      onLoanRequested();
    } catch {
      setError('Failed to submit loan request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loan-modal-backdrop">
        <div className="loan-modal-container loan-modal-loading">
          Loading loan eligibility...
        </div>
      </div>
    );
  }

  return (
    <div className="loan-modal-backdrop">
      <div className="loan-modal-container">
        <h2>Request New Loan</h2>
        <p><b>Eligible Loan Amount:</b> {eligibleLoanAmount.toFixed(2)} RWF</p>
        <input
          type="number"
          className="loan-modal-input"
          placeholder="Enter loan amount"
          value={requestedAmount}
          onChange={e => setRequestedAmount(e.target.value)}
          min="0"
          max={eligibleLoanAmount}
        />
        {error && <p className="loan-modal-error">{error}</p>}
        <div className="loan-modal-buttons">
          <button
            className="loan-modal-button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            className="loan-modal-button loan-modal-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoanRequestModal;
