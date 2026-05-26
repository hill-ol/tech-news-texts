const nodemailer = require('nodemailer');

async function sendText(message, dryRun = false) {
  if (dryRun) {
    console.log('\n--- SMS PREVIEW (dry run) ---');
    console.log(message);
    console.log('-----------------------------');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from:    process.env.GMAIL_USER,
    to:      process.env.PHONE_GATEWAY,  // e.g. 6175551234@tmomail.net
    subject: '',
    text:    message,
  });

  console.log(`Text sent successfully to ${process.env.PHONE_GATEWAY}`);
}

module.exports = { sendText };