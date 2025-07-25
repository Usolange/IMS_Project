const { sql, pool, poolConnect } = require('../config/db');
const dayjs = require('dayjs');
const tz = require('dayjs/plugin/timezone');
dayjs.extend(tz);

// Save MoMo payment logs
async function logPayment({
  member_id,
  slot_id,
  amount,
  phone,
  momo_reference_id,
}) {
  await poolConnect;
  const request = pool.request();

  const now = dayjs().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss');

  await request
    .input('member_id', sql.Int, member_id)
    .input('slot_id', sql.Int, slot_id)
    .input('saved_amount', sql.Decimal(10, 2), amount)
    .input('saved_at', sql.DateTime, now)
    .input('phone_used', sql.VarChar(20), phone)
    .input('momo_reference_id', sql.VarChar(100), momo_reference_id)
    .input('payment_status', sql.VarChar(50), 'successful')
    .query(`
      INSERT INTO member_saving_activities (
        member_id, slot_id, saved_amount, saved_at, phone_used, momo_reference_id, payment_status
      ) VALUES (
        @member_id, @slot_id, @saved_amount, @saved_at, @phone_used, @momo_reference_id, @payment_status
      )
    `);
}

module.exports = {
  logPayment,
};