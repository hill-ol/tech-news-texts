async function summarize(articles, dryRun = false) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    timeZone: 'America/New_York',
  });

  const prompt = `
You are a tech news curator assembling a daily SMS digest.

Today's date: ${today}

Below is a JSON array of recent tech articles from whitelisted sources.
Your job is to select and summarize exactly 4 articles for the digest.

---

TOPIC PRIORITY (most to least important):
1. AI/LLM news — model releases, AI research, LLM developments, AI company moves
2. Broader tech — startups, funding rounds, developer tools, big tech product launches
3. Cloud computing (AWS, Google Cloud, Azure) — only if genuinely significant news

SOURCE TIER (use this when collapsing duplicate event coverage):
Tier 1 (primary): openai.com, anthropic.com, deepmind.google, arxiv.org, research.google, blogs.microsoft.com
Tier 2 (press): techcrunch.com, theverge.com, wired.com, arstechnica.com, technologyreview.mit.edu, venturebeat.com, infoq.com
Tier 3 (general): reuters.com

SELECTION RULES:
- Select exactly 4 articles
- Prioritize recency — prefer articles published most recently
- If multiple articles cover the same event, collapse into ONE entry:
    * Pick the highest-tier source
    * If same tier, pick the one with more specific technical detail (numbers, names, research)
    * If still tied, pick the more recent one
- Deprioritize stories that appear from only one source with no corroboration elsewhere in the batch
- Deprioritize opinion pieces, editorials, sponsored content, and speculative fear-mongering
- Prefer articles that cite specific facts, numbers, named people, or research

SUMMARY RULES:
- Each summary is exactly one sentence, maximum 20 words
- Be factual and specific — no hype, no vague language
- Do not start summaries with "This article", "The piece", or similar
- Do not use em dashes in summaries

OUTPUT FORMAT — return only the following, no preamble, no explanation:
📰 Tech Digest — ${today}

1. [title]
[one sentence summary]
[url]

2. [title]
[one sentence summary]
[url]

3. [title]
[one sentence summary]
[url]

4. [title]
[one sentence summary]
[url]

---

ARTICLES:
${JSON.stringify(articles, null, 2)}
`.trim();

  if (dryRun) {
    console.log('\n--- PROMPT PREVIEW (dry run) ---');
    console.log(`Sending ${articles.length} articles to Gemini...`);
    return '[DRY RUN] Gemini call skipped.';
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }, // low temp = more consistent, factual output
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error('Gemini returned an empty response');

  return text.trim();
}

module.exports = { summarize };
