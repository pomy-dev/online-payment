const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendRegistrationConfirmation({
  to,
  studentName,
  studentNumber,
  paymentReference,
  amountPaid
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'NSTC Admissions <admissions@nationalskills.org.za>', // change after domain is verified
      to: [to],
      subject: `Registration Confirmed – ${studentNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
          <h2 style="color: #0a7b3e;">Welcome to National Skills & Technical College</h2>
          
          <p>Dear <strong>${studentName}</strong>,</p>
          
          <p>Your registration has been successfully received and your payment has been confirmed.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Student Number:</strong> ${studentNumber}</p>
            <p style="margin: 0 0 8px 0;"><strong>Payment Reference:</strong> ${paymentReference}</p>
            <p style="margin: 0;"><strong>Amount Paid:</strong> R${Number(amountPaid).toLocaleString()}</p>
          </div>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our admissions team will verify your documents</li>
            <li>You will receive orientation details via email</li>
            <li>Keep this email for your records</li>
          </ul>
          
          <p>If you have any questions, simply reply to this email.</p>
          
          <p style="margin-top: 32px;">
            Kind regards,<br/>
            <strong>NSTC Admissions Team</strong>
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Confirmation email sent:', data?.id);
    return data;
  } catch (err) {
    console.error('Failed to send registration email:', err);
    throw err;
  }
}

module.exports = { sendRegistrationConfirmation };