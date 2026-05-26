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
    to:      process.env.PHONE_GATEWAY,
    subject: '',
    text:    message,
  });

  console.log(`Text sent successfully to ${process.env.PHONE_GATEWAY}`);

  // Wait for the SMTP connection to fully close before returning
  await new Promise((resolve) => {
    transporter.on('idle', () => {
      transporter.close();
      resolve();
    });
    // Fallback: resolve after 2s if idle never fires
    setTimeout(resolve, 2000);
  });
}

module.exports = { sendText };