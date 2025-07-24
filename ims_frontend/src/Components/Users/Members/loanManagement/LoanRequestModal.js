import React, { useState } from 'react';
import axios from 'axios';
import '../../../CSS/LoanRequestModal.css';

function LoanRequestModal({
  memberId,
  roundId,
  allowedLoan,
  ikiminaInfo,
  totalAvailableAmount,
  onClose,
  onLoanRequested
}) {
  const [requestedAmount, setRequestedAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!roundId) {
      setError('Missing round information. Please try again later.');
      return;
    }

    if (!requestedAmount || isNaN(requestedAmount) || Number(requestedAmount) <= 0) {
      setError('Please enter a valid loan amount.');
      return;
    }

    if (Number(requestedAmount) > allowedLoan) {
      setError(`Requested amount exceeds your eligible limit of ${Number(allowedLoan).toLocaleString()} RWF`);
      return;
    }

    if (Number(requestedAmount) > totalAvailableAmount) {
      setError(`Requested amount exceeds group’s available funds of ${totalAvailableAmount.toLocaleString()} RWF`);
      return;
    }

    try {
      setSubmitting(true);

      await axios.post('http://localhost:5000/api/LoanManagementRoutes/requestNewLoan', {
        member_id: memberId,
        round_id: roundId,
        requested_amount: Number(requestedAmount)
      });

      alert('✅ Loan request submitted successfully!');
      onLoanRequested();
    } catch (err) {
      console.error('[LoanRequestModal] Error submitting request:', err);
      if (err.response && err.response.data) {
        const { message, ongoingLoan } = err.response.data;
        if (ongoingLoan) {
          const loanDetails = `
${message}

You currently have an active loan:
• Requested: ${Number(ongoingLoan.requested_amount).toLocaleString()} RWF
• Status: ${ongoingLoan.status}
• Due by: ${new Date(ongoingLoan.due_date).toLocaleDateString()}
          `;
          setError(loanDetails);
        } else {
          setError(message || 'Loan request failed.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="loan-modal-backdrop">
      <div className="loan-modal-container">
        <h2>Request New Loan</h2>

        <h3>Ikimina: {ikiminaInfo?.iki_name || 'N/A'}</h3>

        <p>
          <strong>Group Available Fund:</strong>{' '}
          {totalAvailableAmount.toLocaleString()} RWF
        </p>

        <p>
          <strong>Eligible Loan Amount:</strong>{' '}
          {Number(allowedLoan).toLocaleString()} RWF
        </p>

        <input
          type="number"
          className="loan-modal-input"
          placeholder="Enter loan amount"
          value={requestedAmount}
          onChange={e => setRequestedAmount(e.target.value)}
          min="0"
          max={Math.min(allowedLoan, totalAvailableAmount)}
        />

        {error && (
          <p className="loan-modal-error" style={{ whiteSpace: 'pre-line' }}>
            {error}
          </p>
        )}

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
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoanRequestModal;
