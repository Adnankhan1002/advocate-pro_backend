const nodemailer = require('nodemailer');
const twilio = require('twilio');

/**
 * Email Service
 */
const createEmailTransporter = () => {
  // Configure with your email service
  // For development, use ethereal email or Gmail
  // For production, use SendGrid or AWS SES
  
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendEmail = async (to, subject, htmlContent) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email not configured. Skipping email send.');
      console.log(`[Email] To: ${to}, Subject: ${subject}`);
      return true;
    }

    const transporter = createEmailTransporter();
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`✓ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

/**
 * SMS Service (Twilio)
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('SMS not configured. Skipping SMS send.');
      console.log(`[SMS] To: ${phoneNumber}, Message: ${message}`);
      return true;
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`✓ SMS sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('SMS send error:', error.message);
    return false;
  }
};

/**
 * Send Hearing Reminder Email
 */
const sendHearingReminderEmail = async (user, hearing, caseData, client) => {
  const htmlContent = `
    <h2>Hearing Reminder</h2>
    <p>Hello ${user.firstName},</p>
    
    <p>This is a reminder that you have an upcoming hearing:</p>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
      <p><strong>Case:</strong> ${caseData.title} (${caseData.caseNumber})</p>
      <p><strong>Client:</strong> ${client.fullName}</p>
      <p><strong>Hearing Date:</strong> ${hearing.hearingDate.toLocaleDateString()}</p>
      ${hearing.hearingTime ? `<p><strong>Time:</strong> ${hearing.hearingTime}</p>` : ''}
      ${hearing.courtroom ? `<p><strong>Courtroom:</strong> ${hearing.courtroom}</p>` : ''}
      ${hearing.judge ? `<p><strong>Judge:</strong> ${hearing.judge}</p>` : ''}
      ${hearing.description ? `<p><strong>Description:</strong> ${hearing.description}</p>` : ''}
    </div>
    
    <p>Please ensure you are prepared and arrive on time.</p>
    
    <p>Best regards,<br>Advocate Pro Team</p>
  `;

  return sendEmail(
    user.email,
    `Hearing Reminder: ${caseData.title}`,
    htmlContent
  );
};

/**
 * Send Hearing Reminder SMS
 */
const sendHearingReminderSMS = async (phoneNumber, hearing, caseData) => {
  const message = `Hearing Reminder: Your case "${caseData.title}" has a hearing tomorrow at ${
    hearing.hearingTime || 'TBD'
  }. ${hearing.courtroom ? `Courtroom: ${hearing.courtroom}. ` : ''}Please arrive on time.`;

  return sendSMS(phoneNumber, message);
};

module.exports = {
  sendEmail,
  sendSMS,
  sendHearingReminderEmail,
  sendHearingReminderSMS,
};
