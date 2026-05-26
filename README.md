# tech-news-texts

Daily AI/tech news digest delivered to your phone via SMS. Runs automatically at 8 AM EST using GitHub Actions.

## Stack

- **News sources:** NewsAPI + RSS feeds (whitelisted sources only)
- **Summarizer:** Gemini 2.0 Flash (free tier)
- **SMS:** TextBelt (1 free text/day)
- **Scheduler:** GitHub Actions cron

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/tech-news-texts.git
cd tech-news-texts
npm install
```

### 2. Get API keys

- **NewsAPI:** https://newsapi.org (free account)
- **Gemini:** https://aistudio.google.com/app/apikey (free)
- **Phone number:** your number in E.164 format, e.g. +12225551234

### 3. Local development

```bash
cp .env.example .env
# Fill in your keys in .env
npm run dry-run   # test without sending a real text
npm start         # send a real text
```

### 4. Deploy to GitHub Actions

In your GitHub repo, go to **Settings > Secrets and variables > Actions** and add:

| Secret | Value |
|---|---|
| `NEWSAPI_KEY` | your NewsAPI key |
| `GEMINI_API_KEY` | your Gemini API key |
| `PHONE_NUMBER` | your phone number (+12225551234) |

The workflow runs automatically at 8 AM EST. You can also trigger it manually from the **Actions** tab.

## Project structure

```
tech-news-texts/
├── src/
│   ├── fetchNews.js   # NewsAPI + RSS fetching and normalization
│   ├── dedupe.js      # seen.json deduplication (7-day window)
│   ├── summarize.js   # Gemini ranking and summarization
│   └── send.js        # TextBelt SMS delivery
├── data/
│   └── seen.json      # auto-updated by GitHub Actions
├── .github/
│   └── workflows/
│       └── daily-digest.yml
├── index.js           # main orchestrator
└── .env.example
```

## Cost

$0/month for personal daily use.
