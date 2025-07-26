const { pool, sql, poolConnect } = require('../config/db');
const { getTransactionEvents } = require('./moMoPayment'); 
const { sendCustomSms, sendCustomEmail } = require('../routes/notification');

async function updatePaymentStatusInDb(reference, newStatus) {
  await poolConnect;
  await pool.request()
    .input('reference', sql.VarChar(100), reference)
    .input('status', sql.VarChar(20), newStatus)
    .query(`UPDATE member_saving_activities SET payment_status = @status WHERE momo_reference_id = @reference`);
}

async function notifySuccess(reference) {
  await poolConnect;
  const result = await pool.request()
    .input('reference', sql.VarChar(100), reference)
    .query(`
      SELECT saved_amount, phone_used, i.iki_name, i.iki_email
      FROM member_saving_activities s
      JOIN ikimina_saving_slots sl ON s.slot_id = sl.slot_id
      JOIN ikimina_info i ON sl.iki_id = i.iki_id
      WHERE s.momo_reference_id = @reference
    `);

  if (!result.recordset.length) return;

  const { saved_amount, phone_used, iki_name, iki_email } = result.recordset[0];
  const message = `✅ Thanks! Your saving of ${saved_amount} RWF for ${iki_name} has been confirmed successfully.`;

  await sendCustomSms(phone_used, message);
  await sendCustomEmail(iki_email, 'Saving Confirmed', message);
  console.log(`📤 Confirmation sent to ${phone_used}`);
}

async function fallbackCheckViaEvents(reference, phone) {
  try {
    const result = await getTransactionEvents({ referenceKey: reference, phone });

    const successful = result.transactions?.find(
      (t) => t.event_kind === 'transaction:processed' &&
             t.data?.status?.toLowerCase() === 'successful'
    );

    if (successful) {
      console.log('✅ Success via fallback event log');
      await updatePaymentStatusInDb(reference, 'successful');
      await notifySuccess(reference);
      return true;
    }

    console.warn('⚠️ Fallback failed: no successful event found.');
    return false;
  } catch (err) {
    console.error('❌ Error during fallback events:', err.message);
    return false;
  }
}

module.exports = { fallbackCheckViaEvents };
