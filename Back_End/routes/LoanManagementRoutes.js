const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');

// Helper: get iki_id by member_id from members_info
async function getIkiIdByMemberId(memberId) {
  await poolConnect;
  const request = pool.request();
  request.input('memberId', sql.Int, memberId);
  const result = await request.query('SELECT iki_id FROM members_info WHERE member_id = @memberId');
  if (result.recordset.length === 0) return null;
  return result.recordset[0].iki_id;
}

// GET /ikimina/info?member_id=123
router.get('/ikimina/info', async (req, res) => {
  const memberId = parseInt(req.query.member_id);
  if (!memberId) return res.status(400).json({ message: 'Missing or invalid member_id' });

  try {
    const ikiId = await getIkiIdByMemberId(memberId);
    if (!ikiId) return res.status(404).json({ message: 'Member or Ikimina not found' });

    await poolConnect;
    const request = pool.request();
    request.input('ikiId', sql.Int, ikiId);
    const result = await request.query('SELECT * FROM ikimina_info WHERE iki_id = @ikiId');
    if (result.recordset.length === 0) return res.status(404).json({ message: 'Ikimina info not found' });

    res.json({ ikimina: result.recordset[0] });
  } catch (error) {
    console.error('Failed to fetch Ikimina info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /ikimina_rounds/active?member_id=123
router.get('/ikimina_rounds/active', async (req, res) => {
  const memberId = parseInt(req.query.member_id);
  if (!memberId) return res.status(400).json({ message: 'Missing or invalid member_id' });

  try {
    const ikiId = await getIkiIdByMemberId(memberId);
    if (!ikiId) return res.status(404).json({ message: 'Member or Ikimina not found' });

    await poolConnect;
    const request = pool.request();
    request.input('roundStatus', sql.VarChar(50), 'active');
    request.input('ikiId', sql.Int, ikiId);
    // SQL Server: TOP 1 + ORDER BY to get latest active round
    const result = await request.query(`
      SELECT TOP 1 * FROM ikimina_rounds
      WHERE round_status = @roundStatus AND iki_id = @ikiId
      ORDER BY round_id DESC
    `);

    if (result.recordset.length === 0) return res.status(404).json({ message: 'No active round found' });

    res.json({ round: result.recordset[0] });
  } catch (error) {
    console.error('Failed to fetch active round:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /ikimina_rounds/groupAvailableMoney?member_id=123
router.get('/ikimina_rounds/groupAvailableMoney', async (req, res) => {
  const memberId = parseInt(req.query.member_id);
  if (!memberId) return res.status(400).json({ message: 'Missing or invalid member_id' });

  try {
    await poolConnect;

    // STEP 1: Get iki_id
    let request = pool.request();
    request.input('memberId', sql.Int, memberId);
    let result = await request.query('SELECT iki_id FROM members_info WHERE member_id = @memberId');
    if (result.recordset.length === 0) return res.status(404).json({ message: 'Ikimina not found for member' });
    const iki_id = result.recordset[0].iki_id;

    // STEP 2: Get active round_id for this ikimina
    request = pool.request();
    request.input('ikiId', sql.Int, iki_id);
    request.input('roundStatus', sql.VarChar(50), 'active');
    result = await request.query(`
      SELECT TOP 1 round_id FROM ikimina_rounds
      WHERE iki_id = @ikiId AND round_status = @roundStatus
      ORDER BY round_id DESC
    `);
    if (result.recordset.length === 0) return res.status(404).json({ message: 'Active round not found for Ikimina' });
    const round_id = result.recordset[0].round_id;

    // STEP 3: Calculate totals - note your columns and tables from your schema
    request = pool.request();
    request.input('ikiId', sql.Int, iki_id);
    request.input('roundId', sql.Int, round_id);

    const totalsQuery = `
     SELECT
  (SELECT ISNULL(SUM(msa.saved_amount), 0)
   FROM member_saving_activities msa
   INNER JOIN ikimina_saving_slots iss ON msa.slot_id = iss.slot_id
   WHERE iss.iki_id = @ikiId AND iss.round_id = @roundId) AS total_savings,

  (SELECT ISNULL(SUM(pl.penalty_amount), 0)
   FROM penalty_logs pl
   INNER JOIN member_saving_activities msa ON pl.save_id = msa.save_id
   INNER JOIN ikimina_saving_slots iss ON msa.slot_id = iss.slot_id
   WHERE pl.iki_id = @ikiId AND pl.is_paid = 1 AND iss.round_id = @roundId) AS total_paid_penalties,

  (SELECT ISNULL(SUM(li.interest_amount), 0)
   FROM loan_interest li
   INNER JOIN loans l ON li.loan_id = l.loan_id
   WHERE l.iki_id = @ikiId AND li.is_paid = 1 AND l.round_id = @roundId) AS total_interest_paid,

  (SELECT ISNULL(SUM(l.approved_amount), 0)
   FROM loans l
   WHERE l.iki_id = @ikiId AND l.round_id = @roundId AND l.status IN ('approved', 'disbursed')) AS total_disbursed_loans
 `;

    result = await request.query(totalsQuery);
    const totals = result.recordset[0];

    // STEP 4: Compute group available money
    const group_available_money =
      totals.total_savings + totals.total_paid_penalties + totals.total_interest_paid - totals.total_disbursed_loans;

    res.json({
      success: true,
      data: {
        iki_id,
        round_id,
        ...totals,
        group_available_money
      }
    });
  } catch (err) {
    console.error('Error fetching group available money:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// POST /api/loans/requestNewLoan
router.post('/requestNewLoan', async (req, res) => {
  const { member_id, round_id, requested_amount } = req.body;
  if (!member_id || !round_id || !requested_amount) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await poolConnect;

    // Step 1: Check if member already has an ongoing loan
    let request = pool.request();
    request.input('memberId', sql.Int, member_id);
    const existingLoanRes = await request.query(`
      SELECT loan_id FROM loans
      WHERE member_id = @memberId
        AND status IN ('approved', 'disbursed')
        AND repayment_completed_date IS NULL
    `);

    if (existingLoanRes.recordset.length > 0) {
      return res.status(400).json({
        message: 'You already have an ongoing loan. Repay it before requesting a new one.'
      });
    }

    // Step 2: Get member info and ikimina ID
    request = pool.request();
    request.input('memberId', sql.Int, member_id);
    const memberRes = await request.query(`
      SELECT iki_id FROM members_info WHERE member_id = @memberId
    `);
    if (memberRes.recordset.length === 0)
      return res.status(404).json({ message: 'Member not found' });
    const iki_id = memberRes.recordset[0].iki_id;

    // Step 3: Get interest rate for this round
    request = pool.request();
    request.input('ikiId', sql.Int, iki_id);
    request.input('roundId', sql.Int, round_id);
    const ruleRes = await request.query(`
      SELECT TOP 1 interest_rate_percent
      FROM ikimina_saving_rules
      WHERE iki_id = @ikiId AND round_id = @roundId
    `);
    const interestRate = ruleRes.recordset[0]?.interest_rate_percent || 0;

    // Step 4: Calculate repayable info
    const approved_amount = requested_amount;
    const total_repayable = requested_amount + (requested_amount * interestRate / 100);
    const requestDate = new Date();
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1); // 1 month later

    // Step 5: Insert loan into loans table
    request = pool.request();
    request.input('member_id', sql.Int, member_id);
    request.input('iki_id', sql.Int, iki_id);
    request.input('round_id', sql.Int, round_id);
    request.input('requested_amount', sql.Decimal(9, 0), requested_amount);
    request.input('approved_amount', sql.Decimal(9, 1), approved_amount);
    request.input('interest_rate', sql.Decimal(5, 1), interestRate);
    request.input('total_repayable', sql.Decimal(9, 1), total_repayable);
    request.input('status', sql.VarChar(20), 'approved');
    request.input('request_date', sql.DateTime, requestDate);
    request.input('approval_date', sql.DateTime, requestDate);
    request.input('due_date', sql.DateTime, dueDate);
    await request.query(`
      INSERT INTO loans (member_id, iki_id, round_id, requested_amount, approved_amount, interest_rate, total_repayable, status, request_date, approval_date, due_date)
      VALUES (@member_id, @iki_id, @round_id, @requested_amount, @approved_amount, @interest_rate, @total_repayable, @status, @request_date, @approval_date, @due_date)
    `);

    // Step 6: Get last inserted loan ID
    const loanIdRes = await pool.request().query('SELECT TOP 1 loan_id FROM loans ORDER BY loan_id DESC');
    const loan_id = loanIdRes.recordset[0].loan_id;

    // Step 7: Create monthly interest
    const interest_amount = requested_amount * (interestRate / 100);
    const interestDue = new Date(requestDate);
    interestDue.setMonth(interestDue.getMonth() + 1);

    request = pool.request();
    request.input('loan_id', sql.Int, loan_id);
    request.input('interest_rate', sql.Decimal(5, 0), interestRate);
    request.input('interest_amount', sql.Decimal(9, 0), interest_amount);
    request.input('calculated_on_date', sql.DateTime, requestDate);
    request.input('due_date', sql.DateTime, interestDue);
    request.input('is_paid', sql.Bit, 0);
    request.input('created_at', sql.DateTime, new Date());
    await request.query(`
      INSERT INTO loan_interest (loan_id, interest_rate, interest_amount, calculated_on_date, due_date, is_paid, created_at)
      VALUES (@loan_id, @interest_rate, @interest_amount, @calculated_on_date, @due_date, @is_paid, @created_at)
    `);

    res.status(201).json({ message: 'Loan requested and approved', loan_id });
  } catch (err) {
    console.error('[Loan API] Loan creation failed:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// POST /api/LoanManagementRoutes/payLoan
router.post('/payLoan', async (req, res) => {
  const { loan_id, member_id, paymentType, phone_used, partial_amount } = req.body;

  if (!loan_id || !member_id || !paymentType) {
    return res.status(400).json({ message: 'Missing required payment info.' });
  }

  try {
    await poolConnect;
    const now = new Date();

    // Fetch loan info
    const loanRes = await pool.request()
      .input('loan_id', sql.Int, loan_id)
      .query('SELECT * FROM loans WHERE loan_id = @loan_id');
    const loan = loanRes.recordset[0];
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    // Calculate total amount already paid on the loan
    const paymentsRes = await pool.request()
      .input('loan_id', sql.Int, loan_id)
      .query('SELECT ISNULL(SUM(amount_paid), 0) AS total_paid FROM loan_repayments WHERE loan_id = @loan_id');
    const totalPaid = paymentsRes.recordset[0]?.total_paid || 0;

    // Get member phone number
    const memberPhoneRes = await pool.request()
      .input('member_id', sql.Int, member_id)
      .query(`SELECT member_phone_number FROM members_info WHERE member_id = @member_id`);
    const actualPhone = phone_used || memberPhoneRes.recordset[0]?.member_phone_number || null;

    // Fetch unpaid interest
    const interestRes = await pool.request()
      .input('loan_id', sql.Int, loan_id)
      .query(`SELECT TOP 1 * FROM loan_interest WHERE loan_id = @loan_id AND is_paid = 0 ORDER BY due_date ASC`);
    const unpaidInterest = interestRes.recordset[0];
    const interestAmount = unpaidInterest?.interest_amount ?? 0;

    let payAmount = 0;
    let isFullLoanPaid = false;
    let updateLoan = false;

    if (paymentType === 'loan_and_interest') {
      payAmount = loan.total_repayable - totalPaid; // pay remaining balance
      if (payAmount <= 0) {
        return res.status(400).json({ message: 'Loan already fully paid.' });
      }
      isFullLoanPaid = true;
      updateLoan = true;
    } else if (paymentType === 'interest_only') {
      if (!unpaidInterest) return res.status(400).json({ message: 'No unpaid interest found.' });
      payAmount = interestAmount;
    } else if (paymentType === 'loan_only') {
      if (!unpaidInterest || unpaidInterest.is_paid === 1) {
        // Interest already paid; allow full or partial loan payment
        const remainingLoanPrincipal = loan.total_repayable - interestAmount - totalPaid;
        if (remainingLoanPrincipal <= 0) {
          return res.status(400).json({ message: 'Loan principal already fully paid.' });
        }
        if (partial_amount) {
          if (partial_amount > remainingLoanPrincipal) {
            return res.status(400).json({ message: `Partial payment exceeds remaining loan principal (${remainingLoanPrincipal.toFixed(2)}).` });
          }
          payAmount = partial_amount;
          if (partial_amount >= remainingLoanPrincipal) {
            isFullLoanPaid = true;
            updateLoan = true;
          }
        } else {
          payAmount = remainingLoanPrincipal;
          isFullLoanPaid = true;
          updateLoan = true;
        }
      } else {
        return res.status(403).json({ message: 'Interest must be fully paid before loan-only payment.' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid payment type.' });
    }

    // Determine timing_status for loan_repayments insert
    let repaymentTimingStatus = 'on_time';
    if (loan.due_date) {
      repaymentTimingStatus = new Date(loan.due_date) < now ? 'late' : 'on_time';
    }

    // Insert payment record
    await pool.request()
      .input('loan_id', sql.Int, loan_id)
      .input('member_id', sql.Int, member_id)
      .input('amount_paid', sql.Decimal(9, 2), payAmount)
      .input('payment_method', sql.VarChar(20), 'mobile')
      .input('phone_used', sql.VarChar(20), actualPhone)
      .input('payment_date', sql.DateTime, now)
      .input('is_full_payment', sql.Bit, isFullLoanPaid ? 1 : 0)
      .input('created_at', sql.DateTime, now)
      .input('payment_status', sql.VarChar(20), 'paid')
      .input('timing_status', sql.VarChar(20), repaymentTimingStatus)
      .query(`
        INSERT INTO loan_repayments
        (loan_id, member_id, amount_paid, payment_method, phone_used, payment_date,
         is_full_payment, created_at, payment_status, timing_status)
        VALUES (@loan_id, @member_id, @amount_paid, @payment_method, @phone_used, @payment_date,
         @is_full_payment, @created_at, @payment_status, @timing_status)
      `);

    // Mark interest paid if applicable
    if (paymentType.includes('interest') && unpaidInterest) {
      const interestTimingStatus = new Date(unpaidInterest.due_date) < now ? 'late' : 'on_time';
      await pool.request()
        .input('interest_id', sql.Int, unpaidInterest.interest_id)
        .input('paid_date', sql.DateTime, now)
        .input('is_paid', sql.Bit, 1)
        .input('payment_status', sql.VarChar(20), 'paid')
        .input('timing_status', sql.VarChar(20), interestTimingStatus)
        .query(`
          UPDATE loan_interest
          SET is_paid = @is_paid, paid_date = @paid_date,
              payment_status = @payment_status, timing_status = @timing_status
          WHERE interest_id = @interest_id
        `);
    }

    // Update loan as repaid if fully paid
    if (updateLoan) {
      await pool.request()
        .input('loan_id', sql.Int, loan_id)
        .input('status', sql.VarChar(20), 'repaid')
        .input('repayment_completed_date', sql.DateTime, now)
        .query(`
          UPDATE loans
          SET status = @status,
              repayment_completed_date = @repayment_completed_date
          WHERE loan_id = @loan_id
        `);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment recorded successfully.',
      remaining_loan: Math.max(loan.total_repayable - totalPaid - payAmount, 0)
    });

  } catch (err) {
    console.error('[payLoan API] Error:', err.stack);
    return res.status(500).json({ message: 'Payment failed.', error: err.message });
  }
});


// GET /api/LoanManagementRoutes/loanInterest/:loan_id
router.get('/loanInterest/:loan_id', async (req, res) => {
  const loan_id = parseInt(req.params.loan_id);
  if (!loan_id) return res.status(400).json({ message: 'Loan ID required.' });

  try {
    await poolConnect;
    const result = await pool.request()
      .input('loan_id', sql.Int, loan_id)
      .query('SELECT TOP 1 interest_amount FROM loan_interest WHERE loan_id = @loan_id AND is_paid = 0 ORDER BY due_date ASC');
    const amount = result.recordset[0]?.interest_amount || 0;
    return res.status(200).json({ interestAmount: amount });
  } catch (err) {
    console.error('[loanInterest GET] Error:', err);
    return res.status(500).json({ message: 'Failed to fetch interest.' });
  }
});

// GET /api/LoanManagementRoutes/remainingLoan/:loan_id
router.get('/remainingLoan/:loan_id', async (req, res) => {
  const loan_id = parseInt(req.params.loan_id);
  if (!loan_id) return res.status(400).json({ message: 'Loan ID required.' });

  try {
    await poolConnect;

    // Fetch total repayable from loans table
    const loanResult = await pool.request()
      .input('loan_id', sql.Int, loan_id)
      .query('SELECT total_repayable FROM loans WHERE loan_id = @loan_id');
    if (!loanResult.recordset.length) {
      return res.status(404).json({ message: 'Loan not found.' });
    }
    const totalRepayable = loanResult.recordset[0].total_repayable;

    // Sum of amount_paid from loan_repayments for this loan
    const repaymentResult = await pool.request()
      .input('loan_id', sql.Int, loan_id)
      .query('SELECT ISNULL(SUM(amount_paid), 0) as total_repaid FROM loan_repayments WHERE loan_id = @loan_id');
    const totalRepaid = repaymentResult.recordset[0].total_repaid;

    const remainingLoan = totalRepayable - totalRepaid;

    return res.status(200).json({ remainingLoan: remainingLoan > 0 ? remainingLoan : 0 });

  } catch (err) {
    console.error('[remainingLoan GET] Error:', err);
    return res.status(500).json({ message: 'Failed to fetch remaining loan amount.' });
  }
});



module.exports = router;
