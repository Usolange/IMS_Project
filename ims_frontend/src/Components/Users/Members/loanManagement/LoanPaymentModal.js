import React, { useState } from 'react';
import axios from 'axios';
import '../../../CSS/LoanPaymentModal.css';

function LoanPaymentModal({ loan, memberId, onClose, onPaymentSuccess }) {
  const [paymentType, setPaymentType] = useState('loan_and_interest');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePayment = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/LoanManagementRoutes/payLoan', {
        loan_id: loan.loan_id,
        member_id: memberId,
        phone_used: phone || loan.phone_disbursed_to,
        paymentType: paymentType 
      });

      if (response.data.success) {
        setSuccess('✅ Payment submitted successfully!');
        onPaymentSuccess();
        setTimeout(() => onClose(), 1200);
      } else {
        setError(response.data.message || 'Payment failed.');
      }
    } catch (err) {
      console.error('[LoanPaymentModal] Error:', err);
      setError('Failed to process payment.');
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

        <label>Select Payment Type:</label>
        <select value={paymentType} onChange={e => setPaymentType(e.target.value)}>
          <option value="loan_and_interest">Loan + Interest</option>
          <option value="interest_only">Interest Only</option>
          <option value="loan_only">Loan Only</option>
        </select>

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
            disabled={submitting}
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
