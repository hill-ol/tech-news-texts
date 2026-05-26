async function sendText(message, dryRun = false) {
  if (dryRun) {
    console.log('\n--- MESSAGE PREVIEW (dry run) ---');
    console.log(message);
    console.log('---------------------------------');
    return;
  }

  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text:    message,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram error: ${res.status} ${res.statusText} — ${err}`);
  }

  console.log('Message sent successfully via Telegram.');
}

module.exports = { sendText };