async function sendText(message, dryRun = false) {
  if (dryRun) {
    console.log('\n--- SMS PREVIEW (dry run) ---');
    console.log(message);
    console.log('-----------------------------');
    return;
  }

  const res = await fetch('https://textbelt.com/text', {
    method: 'POST',
    body:   new URLSearchParams({
      phone:   process.env.PHONE_NUMBER,
      message: message,
      key:     'textbelt', // free tier: 1 text/day
    }),
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(`TextBelt error: ${data.error || JSON.stringify(data)}`);
  }

  console.log(`Text sent successfully. Quota remaining: ${data.quotaRemaining}`);
}

module.exports = { sendText };
