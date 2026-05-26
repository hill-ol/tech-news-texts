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
    * If same tier, pick the one with more specific technical detail
    * If still tied, pick the more recent one
- Deprioritize stories that appear from only one source with no corroboration
- Deprioritize opinion pieces, editorials, sponsored content, and speculative fear-mongering
- Prefer articles that cite specific facts, numbers, named people, or research

SUMMARY RULES:
- Each summary is exactly one sentence, between 15 and 20 words
- Be factual and specific — include a key detail, number, or named entity from the article
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

  console.log(`Sending ${articles.length} articles to Groq...`);

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:       'llama-3.3-70b-versatile',
      temperature: 0.2,
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${res.status} ${res.statusText} — ${err}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) throw new Error('Groq returned an empty response');

  return text.trim();
}

module.exports = { summarize };