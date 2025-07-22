const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');
const dayjs = require('dayjs');

// Utility: Run SQL with parameters
async function runQuery(query, params = []) {
  await poolConnect;
  const request = pool.request();
  params.forEach(({ name, type, value }) => {
    request.input(name, type, value);
  });
  const result = await request.query(query);
  return result.recordset;
}

// Endpoint: Get loan input features for a member and store them
router.get('/loanModelInputs/:member_id', async (req, res) => {
  const member_id = parseInt(req.params.member_id);
  if (!member_id) return res.status(400).json({ message: 'Invalid member_id' });

  try {
    // 1. Fetch member and ikimina info
    const memberQuery = `
      SELECT m.member_id, m.iki_id, m.joined_at, m.gnid,
             i.created_at AS ikimina_created_at,
             i.numberOfEvents,
             fc.f_category
      FROM members_info m
      JOIN ikimina_info i ON m.iki_id = i.iki_id
      JOIN frequency_category_info fc ON i.dayOfEvent = fc.f_id
      WHERE m.member_id = @member_id
    `;
    const [member] = await runQuery(memberQuery, [
      { name: 'member_id', type: sql.Int, value: member_id }
    ]);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    const { iki_id, joined_at, gnid, f_category, numberOfEvents, ikimina_created_at } = member;
    const currentYear = new Date().getFullYear();
    const joinedYear = new Date(joined_at).getFullYear();
    const createdYear = new Date(ikimina_created_at).getFullYear();

    // 2. Get latest round and its status
    const [round] = await runQuery(`
      SELECT TOP 1 round_id, round_status, start_date
      FROM ikimina_rounds
      WHERE iki_id = @iki_id
      ORDER BY start_date DESC
    `, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);

    if (!round) return res.status(404).json({ message: 'No round found for this member' });

    const { round_id, round_status } = round;

    // 3. Cycles
    const [cycles] = await runQuery(`
      SELECT
        COUNT(*) AS total_saving_cycles,
        SUM(CASE WHEN slot_date <= GETDATE() THEN 1 ELSE 0 END) AS completed_saving_cycles
      FROM ikimina_saving_slots
      WHERE round_id = @round_id
    `, [{ name: 'round_id', type: sql.Int, value: round_id }]);

    // 4. Savings
    const [savingStats] = await runQuery(`
      SELECT
        COUNT(*) AS user_savings_made,
        ISNULL(SUM(saved_amount), 0) AS total_current_saving
      FROM member_saving_activities
      WHERE round_id = @round_id AND member_id = @member_id AND status = 'success'
    `, [
      { name: 'round_id', type: sql.Int, value: round_id },
      { name: 'member_id', type: sql.Int, value: member_id }
    ]);

    // 5. Covered rounds
    const [roundsCovered] = await runQuery(`
      SELECT COUNT(*) AS covered_rounds
      FROM ikimina_rounds
      WHERE iki_id = @iki_id AND round_status IN ('completed', 'closed')
    `, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);

    // 6. Member rounds
    const [memberRounds] = await runQuery(`
      SELECT COUNT(*) AS member_rounds
      FROM ikimina_rounds
      WHERE iki_id = @iki_id AND round_status IN ('completed', 'closed') AND start_date >= @joined_at
    `, [
      { name: 'iki_id', type: sql.Int, value: iki_id },
      { name: 'joined_at', type: sql.DateTime, value: joined_at }
    ]);

    // 7. Mock repayment status logic
    const repaymentStatus = 'Good';

    // 8. Saving status rating
    const ratio = cycles.completed_saving_cycles > 0
      ? savingStats.user_savings_made / cycles.completed_saving_cycles
      : 0;

    let savingStatus = 'Poor';
    if (ratio === 1) savingStatus = 'Excellent';
    else if (ratio >= 0.8) savingStatus = 'Better';
    else if (ratio >= 0.6) savingStatus = 'Good';
    else if (ratio >= 0.4) savingStatus = 'Bad';

    // Final object
    const inputData = {
      member_id,
      round_id,
      saving_frequency: f_category,
      saving_times_per_period: numberOfEvents,
      total_saving_cycles: cycles.total_saving_cycles || 0,
      completed_saving_cycles: cycles.completed_saving_cycles || 0,
      user_savings_made: savingStats.user_savings_made || 0,
      total_current_saving: savingStats.total_current_saving || 0,
      ikimina_created_year: createdYear,
      coverd_rounds: roundsCovered.covered_rounds,
      member_round: memberRounds.member_rounds,
      recent_loan_payment_status: repaymentStatus,
      saving_status: savingStatus,
      has_guardian: !!gnid
    };

    // 9. Check if data exists already for this member + round
    const [existing] = await runQuery(`
      SELECT id FROM loan_prediction_data
      WHERE member_id = @member_id AND round_id = @round_id
    `, [
      { name: 'member_id', type: sql.Int, value: member_id },
      { name: 'round_id', type: sql.Int, value: round_id }
    ]);

    if (['completed', 'closed'].includes(round_status) && existing) {
      return res.status(403).json({ message: 'Round completed. Data is final.', data: inputData });
    }

    const params = [
      { name: 'member_id', type: sql.Int, value: inputData.member_id },
      { name: 'round_id', type: sql.Int, value: inputData.round_id },
      { name: 'saving_frequency', type: sql.VarChar, value: inputData.saving_frequency },
      { name: 'saving_times_per_period', type: sql.Int, value: inputData.saving_times_per_period },
      { name: 'total_saving_cycles', type: sql.Int, value: inputData.total_saving_cycles },
      { name: 'completed_saving_cycles', type: sql.Int, value: inputData.completed_saving_cycles },
      { name: 'user_savings_made', type: sql.Int, value: inputData.user_savings_made },
      { name: 'total_current_saving', type: sql.Decimal(18, 2), value: inputData.total_current_saving },
      { name: 'ikimina_created_year', type: sql.Int, value: inputData.ikimina_created_year },
      { name: 'coverd_rounds', type: sql.Int, value: inputData.coverd_rounds },
      { name: 'member_round', type: sql.Int, value: inputData.member_round },
      { name: 'recent_loan_payment_status', type: sql.VarChar, value: inputData.recent_loan_payment_status },
      { name: 'saving_status', type: sql.VarChar, value: inputData.saving_status },
      { name: 'has_guardian', type: sql.Bit, value: inputData.has_guardian },
    ];

    if (existing) {
      // Update existing record (only for active round)
      const updateQuery = `
        UPDATE loan_prediction_data SET
          saving_frequency = @saving_frequency,
          saving_times_per_period = @saving_times_per_period,
          total_saving_cycles = @total_saving_cycles,
          completed_saving_cycles = @completed_saving_cycles,
          user_savings_made = @user_savings_made,
          total_current_saving = @total_current_saving,
          ikimina_created_year = @ikimina_created_year,
          coverd_rounds = @coverd_rounds,
          member_round = @member_round,
          recent_loan_payment_status = @recent_loan_payment_status,
          saving_status = @saving_status,
          has_guardian = @has_guardian
        WHERE member_id = @member_id AND round_id = @round_id
      `;
      await runQuery(updateQuery, params);
    } else {
      // Insert new record
      const insertQuery = `
        INSERT INTO loan_prediction_data (
          member_id, round_id, saving_frequency, saving_times_per_period,
          total_saving_cycles, completed_saving_cycles, user_savings_made,
          total_current_saving, ikimina_created_year, coverd_rounds,
          member_round, recent_loan_payment_status, saving_status, has_guardian
        )
        VALUES (
          @member_id, @round_id, @saving_frequency, @saving_times_per_period,
          @total_saving_cycles, @completed_saving_cycles, @user_savings_made,
          @total_current_saving, @ikimina_created_year, @coverd_rounds,
          @member_round, @recent_loan_payment_status, @saving_status, @has_guardian
        )
      `;
      await runQuery(insertQuery, params);
    }

    res.json({ message: 'Loan prediction data recorded successfully.', data: inputData });

  } catch (err) {
    console.error('loanModelInputs error:', err);
    res.status(500).json({ message: 'Failed to process member loan inputs' });
  }
});


module.exports = router;
