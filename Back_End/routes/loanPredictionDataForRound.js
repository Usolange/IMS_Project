const express = require('express');
const router = express.Router();
const { pool, sql, poolConnect } = require('../config/db');

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

async function evaluateRecentLoanStatus(member_id) {
  // console.log(`Evaluating recent loan status for member_id=${member_id}`);

  const loans = await runQuery(`
    SELECT l.loan_id, l.due_date
    FROM dbo.loans l
    JOIN dbo.ikimina_rounds r ON l.round_id = r.round_id
    WHERE l.member_id = @member_id
      AND l.status IN ('approved', 'disbursed')
      AND r.round_status IN ('active', 'completed')
  `, [{ name: 'member_id', type: sql.Int, value: member_id }]);

  // console.log(`Found ${loans.length} loans for member_id=${member_id}`);

  if (!loans.length) return 'NoLoans';

  let totalLoans = 0;
  let totalScore = 0;

  for (const loan of loans) {
    const { loan_id, due_date } = loan;
    totalLoans++;

    const repayments = await runQuery(`
      SELECT payment_date
      FROM loan_repayments
      WHERE loan_id = @loan_id
    `, [{ name: 'loan_id', type: sql.Int, value: loan_id }]);

    const interests = await runQuery(`
      SELECT timing_status
      FROM loan_interest
      WHERE loan_id = @loan_id
    `, [{ name: 'loan_id', type: sql.Int, value: loan_id }]);

    let onTimeRepayments = repayments.filter(r => new Date(r.payment_date) <= new Date(due_date)).length;
    let onTimeInterests = interests.filter(i => {
      const status = i.timing_status?.toLowerCase();
      return status === 'on time' || status === 'early';
    }).length;

    const totalPayments = repayments.length + interests.length;
    const totalOnTime = onTimeRepayments + onTimeInterests;
    const ratio = totalPayments > 0 ? totalOnTime / totalPayments : 0;

    let score = 1;
    if (ratio === 1) score = 5;
    else if (ratio >= 0.8) score = 4;
    else if (ratio >= 0.6) score = 3;
    else if (ratio >= 0.4) score = 2;

    totalScore += score;
  }

  const averageScore = totalScore / totalLoans;
  // console.log(`Average loan repayment score for member_id=${member_id}: ${averageScore}`);

  if (averageScore >= 4.5) return 'Excellent';
  if (averageScore >= 3.5) return 'Better';
  if (averageScore >= 2.5) return 'Good';
  if (averageScore >= 1.5) return 'Bad';
  return 'Poor';
}

// Status to int mapping
const statusMap = {
  'noloans': 0,
  'poor': 1,
  'bad': 2,
  'good': 3,
  'better': 4,
  'excellent': 5
};

async function loanPredictionDataForRound(iki_id, round_id) {
  try {
    await poolConnect;

    // console.log(`Starting loanPredictionDataForRound for iki_id=${iki_id}, round_id=${round_id}`);

    const members = await runQuery(
      `SELECT member_id FROM members_info WHERE iki_id = @iki_id`,
      [{ name: 'iki_id', type: sql.Int, value: iki_id }]
    );

    // console.log(`Found ${members.length} members for ikimina ${iki_id}`);

    if (!members.length) {
      // console.log(`No members found for ikimina ${iki_id}`);
      return;
    }

    for (const { member_id } of members) {
      // console.log(`Processing member_id=${member_id}`);

      try {
        const [member] = await runQuery(`
          SELECT m.member_id, m.iki_id, m.joined_at, m.gm_Nid,
                 i.created_at AS ikimina_created_at,
                 i.numberOfEvents,
                 fc.f_category
          FROM members_info m
          JOIN ikimina_info i ON m.iki_id = i.iki_id
          JOIN frequency_category_info fc ON i.f_id = fc.f_id
          WHERE m.member_id = @member_id
        `, [{ name: 'member_id', type: sql.Int, value: member_id }]);

        if (!member) {
          // console.log(`Member data not found for member_id=${member_id}`);
          continue;
        }

        // console.log(`Member info for member_id=${member_id}:`, member);

        const savingTimesInt = parseInt(member.numberOfEvents) || 0;
        const savingFrequencyStr = member.f_category?.toLowerCase() || 'daily';
        let savingFrequencyCode = 1;
        if (savingFrequencyStr === 'weekly') savingFrequencyCode = 2;
        else if (savingFrequencyStr === 'monthly') savingFrequencyCode = 3;

        const { joined_at, gm_Nid, ikimina_created_at } = member;
        const createdYear = new Date(ikimina_created_at).getFullYear();

        // Fetch round info
        const [round] = await runQuery(`
          SELECT 
            r.round_id,
            r.round_status,
            r.start_date,
            COUNT(DISTINCT msa.slot_id) AS member_saving_slots
          FROM ikimina_rounds r
          LEFT JOIN ikimina_saving_slots s ON r.round_id = s.round_id
          LEFT JOIN member_saving_activities msa 
            ON msa.slot_id = s.slot_id AND msa.member_id = @member_id
          WHERE r.iki_id = @iki_id
            AND r.round_status IN ('active', 'completed')
            AND r.round_id = @round_id
          GROUP BY r.round_id, r.round_status, r.start_date
          ORDER BY r.start_date
        `, [
          { name: 'member_id', type: sql.Int, value: member_id },
          { name: 'iki_id', type: sql.Int, value: iki_id },
          { name: 'round_id', type: sql.Int, value: round_id }
        ]);

        if (!round) {
          // console.log(`Round not found for round_id=${round_id}`);
          continue;
        }

        const { round_status } = round;
        // console.log(`Round info:`, round);

        // Count saving cycles
        const [cycles] = await runQuery(`
          SELECT
            COUNT(*) AS total_saving_cycles,
            SUM(CASE WHEN slot_date <= GETDATE() THEN 1 ELSE 0 END) AS completed_saving_cycles
          FROM ikimina_saving_slots
          WHERE round_id = @round_id
        `, [{ name: 'round_id', type: sql.Int, value: round_id }]);
        // console.log(`Saving cycles for round_id=${round_id}:`, cycles);

        // User saving stats
        const [savingStats] = await runQuery(`
          SELECT
            COUNT(*) AS user_savings_made,
            ISNULL(SUM(saved_amount), 0) AS total_current_saving
          FROM member_saving_activities msa
          JOIN ikimina_saving_slots iss ON msa.slot_id = iss.slot_id
          WHERE msa.member_id = @member_id
            AND iss.round_id = @round_id
            AND iss.slot_date <= CAST(GETDATE() AS DATE)
        `, [
          { name: 'member_id', type: sql.Int, value: member_id },
          { name: 'round_id', type: sql.Int, value: round_id }
        ]);
        // console.log(`Saving stats for member_id=${member_id}, round_id=${round_id}:`, savingStats);

        // Total rounds covered (all rounds, independent of member join date)
        const [roundsCovered] = await runQuery(`
          SELECT COUNT(*) AS covered_rounds
          FROM ikimina_rounds
          WHERE iki_id = @iki_id AND round_status IN ('completed', 'closed', 'active')
        `, [{ name: 'iki_id', type: sql.Int, value: iki_id }]);
        // console.log(`Total completed rounds for ikimina ${iki_id}:`, roundsCovered.covered_rounds);

        // Total rounds member participated in (via saving activities)
        const [memberRounds] = await runQuery(`
          SELECT COUNT(DISTINCT r.round_id) AS member_rounds
          FROM ikimina_rounds r
          JOIN ikimina_saving_slots s ON r.round_id = s.round_id
          JOIN member_saving_activities msa ON msa.slot_id = s.slot_id
          WHERE msa.member_id = @member_id
        `, [{ name: 'member_id', type: sql.Int, value: member_id }]);
        // console.log(`Total rounds member_id=${member_id} participated in:`, memberRounds.member_rounds);

        const ratio = cycles.completed_saving_cycles > 0
          ? savingStats.user_savings_made / cycles.completed_saving_cycles
          : 0;

        let savingStatusStr = 'Poor';
        if (ratio === 1) savingStatusStr = 'Excellent';
        else if (ratio >= 0.8) savingStatusStr = 'Better';
        else if (ratio >= 0.6) savingStatusStr = 'Good';
        else if (ratio >= 0.4) savingStatusStr = 'Bad';

        const savingStatusInt = statusMap[savingStatusStr.toLowerCase()] ?? 1;

        const loanStatus = await evaluateRecentLoanStatus(member_id);
        const recentLoanStatusInt = statusMap[loanStatus.toLowerCase()] ?? 0;
        const joinedYear = new Date(joined_at).getFullYear();
        const inputData = {
          member_id,
          round_id,
          saving_frequency: savingFrequencyCode,
          saving_times_per_period: savingTimesInt,
          total_saving_cycles: cycles.total_saving_cycles || 0,
          completed_saving_cycles: cycles.completed_saving_cycles || 0,
          user_savings_made: savingStats.user_savings_made || 0,
          total_current_saving: savingStats.total_current_saving || 0,
          ikimina_created_year: createdYear,
          member_Join_Year: joinedYear,
          coverd_rounds: roundsCovered.covered_rounds,
          member_round: memberRounds.member_rounds,
          recent_loan_payment_status: recentLoanStatusInt,
          saving_status: savingStatusInt,
          has_guardian: !!gm_Nid
        };

        // console.log(`Prepared inputData for member_id=${member_id}, round_id=${round_id}:`, inputData);

        const [existing] = await runQuery(`
          SELECT id FROM loan_prediction_data
          WHERE member_id = @member_id AND round_id = @round_id
        `, [
          { name: 'member_id', type: sql.Int, value: member_id },
          { name: 'round_id', type: sql.Int, value: round_id }
        ]);

        const params = [
          { name: 'member_id', type: sql.Int, value: inputData.member_id },
          { name: 'round_id', type: sql.Int, value: inputData.round_id },
          { name: 'saving_frequency', type: sql.Int, value: inputData.saving_frequency },
          { name: 'saving_times_per_period', type: sql.Int, value: inputData.saving_times_per_period },
          { name: 'total_saving_cycles', type: sql.Int, value: inputData.total_saving_cycles },
          { name: 'completed_saving_cycles', type: sql.Int, value: inputData.completed_saving_cycles },
          { name: 'user_savings_made', type: sql.Int, value: inputData.user_savings_made },
          { name: 'total_current_saving', type: sql.Decimal(18, 2), value: inputData.total_current_saving },
          { name: 'ikimina_created_year', type: sql.Int, value: inputData.ikimina_created_year },
          { name: 'member_Join_Year', type: sql.Int, value: inputData.member_Join_Year },
          { name: 'coverd_rounds', type: sql.Int, value: inputData.coverd_rounds },
          { name: 'member_round', type: sql.Int, value: inputData.member_round },
          { name: 'recent_loan_payment_status', type: sql.Int, value: inputData.recent_loan_payment_status },
          { name: 'saving_status', type: sql.Int, value: inputData.saving_status },
          { name: 'has_guardian', type: sql.Bit, value: inputData.has_guardian }
        ];

        if (existing) {
          if (!['completed', 'closed'].includes(round_status)) {
            const updateQuery = `
              UPDATE loan_prediction_data SET
                saving_frequency = @saving_frequency,
                saving_times_per_period = @saving_times_per_period,
                total_saving_cycles = @total_saving_cycles,
                completed_saving_cycles = @completed_saving_cycles,
                user_savings_made = @user_savings_made,
                total_current_saving = @total_current_saving,
                ikimina_created_year = @ikimina_created_year,
                member_Join_Year = @member_Join_Year,
                coverd_rounds = @coverd_rounds,
                member_round = @member_round,
                recent_loan_payment_status = @recent_loan_payment_status,
                saving_status = @saving_status,
                has_guardian = @has_guardian
              WHERE member_id = @member_id AND round_id = @round_id
            `;
            // console.log(`Updating loan_prediction_data for member_id=${member_id}, round_id=${round_id}`);
            await runQuery(updateQuery, params);
          } else {
            // console.log(`Skipping update for completed/closed round_id=${round_id}`);
          }
        } else {
          const insertQuery = `
            INSERT INTO loan_prediction_data (
              member_id, round_id, saving_frequency, saving_times_per_period,
              total_saving_cycles, completed_saving_cycles, user_savings_made,
              total_current_saving, ikimina_created_year, member_Join_Year, coverd_rounds,
              member_round, recent_loan_payment_status, saving_status, has_guardian
            )
            VALUES (
              @member_id, @round_id, @saving_frequency, @saving_times_per_period,
              @total_saving_cycles, @completed_saving_cycles, @user_savings_made,
              @total_current_saving, @ikimina_created_year, @member_Join_Year, @coverd_rounds,
              @member_round, @recent_loan_payment_status, @saving_status, @has_guardian
            )
          `;
          // console.log(`Inserting loan_prediction_data for member_id=${member_id}, round_id=${round_id}`);
          await runQuery(insertQuery, params);
        }
      } catch (memberErr) {
        console.error(`Error processing loan prediction for member ${member_id}:`, memberErr);
      }
    }
  } catch (err) {
    console.error('Error in loanPredictionDataForRound:', err);
  }
}

module.exports = {
  router,
  loanPredictionDataForRound
};
