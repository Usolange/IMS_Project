import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../CSS/LoanPaymentModal.css';

function LoanPaymentModal({ loan, memberId, onClose, onPaymentSuccess }) {
  const [paymentType, setPaymentType] = useState('loan_and_interest');
  const [phone, setPhone] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [remainingLoan, setRemainingLoan] = useState(null);
  const [loadingRemaining, setLoadingRemaining] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchRemainingLoan() {
      try {
        setLoadingRemaining(true);
        const res = await axios.get(`http://localhost:5000/api/LoanManagementRoutes/remainingLoan/${loan.loan_id}`);
        setRemainingLoan(res.data.remainingLoan);
      } catch (err) {
        setRemainingLoan(null);
        setError('Failed to fetch remaining loan amount.');
      } finally {
        setLoadingRemaining(false);
      }
    }

    fetchRemainingLoan();
  }, [loan.loan_id]);

  const handlePayment = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    if (!loan.loan_id || loan.loan_id <= 0) {
      setError('Invalid loan ID. Cannot proceed with payment.');
      setSubmitting(false);
      return;
    }

    if (loadingRemaining) {
      setError('Please wait until remaining amount is loaded.');
      setSubmitting(false);
      return;
    }

    const remaining = remainingLoan ?? 0;

    if ((paymentType === 'loan_only' || paymentType === 'loan_and_interest') && partialAmount) {
      const amt = parseFloat(partialAmount);
      if (isNaN(amt) || amt <= 0) {
        setError('Please enter a valid positive amount.');
        setSubmitting(false);
        return;
      }
      if (amt > remaining) {
        setError(`Payment cannot exceed remaining balance (${remaining.toFixed(2)} RWF).`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const response = await axios.post('http://localhost:5000/api/LoanManagementRoutes/payLoan', {
        loan_id: loan.loan_id,
        member_id: memberId,
        phone_used: phone || loan.phone_disbursed_to,
        paymentType: paymentType,
        partial_amount: partialAmount ? parseFloat(partialAmount) : undefined,
      });

      if (response.data.success) {
        setSuccess('✅ Payment submitted successfully!');
        onPaymentSuccess();
        setTimeout(() => onClose(), 1200);
      } else {
        setError(response.data.message || 'Payment failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="loan-modal-backdrop">
      <div className="loan-modal-container">
        <h2>Loan Payment</h2>
        <p><strong>Loan ID:</strong> {loan.loan_id}</p>
        <p><strong>Total Repayable:</strong> {loan.total_repayable?.toLocaleString()} RWF</p>

        {loadingRemaining ? (
          <p>Loading remaining loan amount...</p>
        ) : (
          <p><strong>Remaining Loan:</strong> {remainingLoan?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF</p>
        )}

        <label>Select Payment Type:</label>
        <select value={paymentType} onChange={e => setPaymentType(e.target.value)}>
          <option value="loan_and_interest">Loan + Interest</option>
          <option value="interest_only">Interest Only</option>
          <option value="loan_only">Loan Only</option>
        </select>

        {(paymentType === 'loan_only' || paymentType === 'loan_and_interest') && (
          <>
            <label>Partial Amount (leave empty to pay full remaining):</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={partialAmount}
              onChange={e => setPartialAmount(e.target.value)}
              placeholder={`Max: ${remainingLoan?.toFixed(2) ?? '0.00'}`}
              disabled={loadingRemaining}
            />
          </>
        )}

        <label>Phone Number (optional):</label>
        <input
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder={`Default: ${loan.phone_disbursed_to}`}
        />

        {error && <p className="loan-modal-error">{error}</p>}
        {success && <p className="loan-modal-success">{success}</p>}

        <div className="loan-modal-buttons">
          <button
            className="loan-modal-button"
            onClick={handlePayment}
            disabled={submitting || loadingRemaining}
          >
            {submitting ? 'Processing...' : 'Submit Payment'}
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

export default LoanPaymentModal;
