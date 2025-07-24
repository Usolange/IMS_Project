import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoanRequestModal from './LoanRequestModal';
import LoanPaymentModal from './LoanPaymentModal';
import '../../../CSS/LoanDashboard.css';

function LoanDashboard() {
  const [memberId, setMemberId] = useState(null);
  const [loans, setLoans] = useState([]);
  const [allowedLoan, setAllowedLoan] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingAllowedLoan, setLoadingAllowedLoan] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [payModal, setPayModal] = useState({ visible: false, loan: null });
  const [ikiminaInfo, setIkiminaInfo] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [groupAvailableMoney, setGroupAvailableMoney] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user?.id) {
          setMemberId(user.id);
        } else {
          setError('User ID not found in local storage.');
          setLoading(false);
          setLoadingAllowedLoan(false);
        }
      } catch {
        setError('Failed to parse user info from local storage.');
        setLoading(false);
        setLoadingAllowedLoan(false);
      }
    } else {
      setError('User not logged in.');
      setLoading(false);
      setLoadingAllowedLoan(false);
    }
  }, []);

  useEffect(() => {
    if (!memberId) return;

    async function fetchAllData() {
      try {
        setLoading(true);
        setLoadingAllowedLoan(true);
        setError('');

        const [loansRes, allowedLoanRes, ikiminaRes, roundRes, moneyRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/loanPredictionRoutes/selectLoans/${memberId}`),
          axios.get(`http://localhost:5000/api/loanPredictionRoutes/predictedAllowedLoan/${memberId}`),
          axios.get(`http://localhost:5000/api/LoanManagementRoutes/ikimina/info?member_id=${memberId}`),
          axios.get(`http://localhost:5000/api/LoanManagementRoutes/ikimina_rounds/active?member_id=${memberId}`),
          axios.get(`http://localhost:5000/api/LoanManagementRoutes/ikimina_rounds/groupAvailableMoney?member_id=${memberId}`)
        ]);

        setLoans(loansRes.data.loans || []);
        setAllowedLoan(allowedLoanRes.data.allowedLoan ?? 0);
        setIkiminaInfo(ikiminaRes.data.ikimina || null);
        setCurrentRound(roundRes.data.round || null);
        setGroupAvailableMoney(moneyRes.data.data.group_available_money ?? 0);

      } catch (err) {
        console.error('[LoanDashboard] Error:', err);
        setError('Failed to fetch dashboard data.');
        setAllowedLoan(0);
        setLoans([]);
        setIkiminaInfo(null);
        setCurrentRound(null);
        setGroupAvailableMoney(0);
      } finally {
        setLoading(false);
        setLoadingAllowedLoan(false);
      }
    }

    fetchAllData();
  }, [memberId]);

  const refreshLoans = () => {
    axios.get(`http://localhost:5000/api/loanPredictionRoutes/selectLoans/${memberId}`)
      .then(res => setLoans(res.data.loans || []))
      .catch(() => { });
  };

  return (
    <div className="loan-dashboard-container">
      <h1>My Loans</h1>

      <div className="loan-dashboard-allowed-loan">
        {loadingAllowedLoan ? (
          <p>Loading your eligible loan amount...</p>
        ) : (
          <p>Your predicted eligible loan amount is: <strong>{allowedLoan.toFixed(2)}</strong> RWF</p>
        )}
        {groupAvailableMoney !== null && (
          <p>🪙 Group Available Fund: <strong>{groupAvailableMoney.toLocaleString()} RWF</strong></p>
        )}
      </div>

      {loading && <p>Loading loans...</p>}
      {error && <p className="loan-dashboard-error">{error}</p>}
      {!loading && loans.length === 0 && <p>No loans found.</p>}

      {loans.length > 0 && (
        <table className="loan-dashboard-table">
          <thead>
            <tr>
              <th>Requested</th>
              <th>Approved</th>
              <th>Status</th>
              <th>Request Date</th>
              <th>Due Date</th>
              <th>Interest %</th>
              <th>Total Repayable</th>
              <th>Interest Paid</th>
              <th>Amount Repaid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <LoanRow
                key={loan.loan_id}
                loan={loan}
                onPay={() => setPayModal({ visible: true, loan })}
              />
            ))}
          </tbody>
        </table>
      )}

      <button
        onClick={() => setModalOpen(true)}
        className="loan-dashboard-request-btn"
        disabled={!currentRound || !ikiminaInfo}
      >
        Request New Loan
      </button>

      {modalOpen && currentRound && ikiminaInfo && (
        <LoanRequestModal
          memberId={memberId}
          allowedLoan={allowedLoan}
          roundId={currentRound.round_id}
          ikiminaInfo={ikiminaInfo}
          totalAvailableAmount={groupAvailableMoney}
          onClose={() => setModalOpen(false)}
          onLoanRequested={refreshLoans}
        />
      )}

      {payModal.visible && payModal.loan && (
        <LoanPaymentModal
          loan={payModal.loan}
          memberId={memberId}
          onClose={() => setPayModal({ visible: false, loan: null })}
          onPaymentSuccess={refreshLoans}
        />
      )}
    </div>
  );
}

function LoanRow({ loan, onPay }) {
  const [interestPaid, setInterestPaid] = useState(0);
  const [amountRepaid, setAmountRepaid] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoadingDetails(true);
        const [interestRes, repayRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/loanPredictionRoutes/loanInterest/${loan.loan_id}`),
          axios.get(`http://localhost:5000/api/loanPredictionRoutes/loanRepayments/${loan.loan_id}`),
        ]);
        setInterestPaid(
          interestRes.data.interests.filter(i => i.is_paid).reduce((s, i) => s + i.interest_amount, 0)
        );
        setAmountRepaid(
          repayRes.data.repayments.reduce((s, r) => s + r.amount_paid, 0)
        );
      } catch {
        setInterestPaid(0);
        setAmountRepaid(0);
      } finally {
        setLoadingDetails(false);
      }
    }
    fetchDetails();
  }, [loan.loan_id]);

  const isFullyPaid = loan.total_repayable <= (interestPaid + amountRepaid);

  const formatAmount = amount =>
    amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-';

  return (
    <tr>
      <td>{formatAmount(loan.requested_amount)}</td>
      <td>{formatAmount(loan.approved_amount)}</td>
      <td>{loan.status}</td>
      <td>{new Date(loan.request_date).toLocaleDateString()}</td>
      <td>{loan.due_date ? new Date(loan.due_date).toLocaleDateString() : '-'}</td>
      <td>{loan.interest_rate}</td>
      <td>{formatAmount(loan.total_repayable)}</td>
      <td>{formatAmount(interestPaid)}</td>
      <td>{formatAmount(amountRepaid)}</td>
      <td>
        <button
          className="pay-loan-btn"
          onClick={onPay}
          disabled={isFullyPaid || loadingDetails}
          title={isFullyPaid ? 'Loan fully paid' : loadingDetails ? 'Loading...' : 'Make a payment'}
        >
          Pay
        </button>
      </td>
    </tr>
  );
}

export default LoanDashboard;
