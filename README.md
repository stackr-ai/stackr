# Stackr — AI Tolerance Stackup Analysis
### Completely free to deploy and run

> Tolerance stackup analysis in seconds, not hours.

**Total cost: $0** — free hosting + free AI API.

---

## Deploy in 10 minutes — completely free

### Step 1 — Get your free Gemini API key (2 min)
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key** — copy it
4. Free tier = **1,500 analyses per day**. No credit card ever.

### Step 2 — Upload to GitHub (3 min)
1. Go to [github.com/new](https://github.com/new)
2. Name it `stackr`, set to **Public**
3. Click **Create repository**
4. Click **uploading an existing file** → drag all files from this folder → Commit

### Step 3 — Deploy on Vercel (3 min)
1. Go to [vercel.com](https://vercel.com) — sign up free with GitHub
2. Click **Add New → Project** → select `stackr`
3. Under **Environment Variables**, add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** your key from Step 1
4. Click **Deploy**

✅ You now have a live URL like `stackr-yourname.vercel.app` — share it with anyone.

---

## Cost breakdown

| Service | Cost |
|---------|------|
| Vercel hosting | **Free** (Hobby plan) |
| GitHub | **Free** |
| Gemini API (1,500 analyses/day) | **Free** |
| vercel.app domain | **Free** |
| **Total** | **$0/month** |

Optional later: buy `stackr.ai` (~$20/yr) when you have paying customers.

---

## Local development

```bash
npm install
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local
npm run dev
# Open http://localhost:3000
```

---

## Stack

| | |
|--|--|
| Framework | Next.js 14 |
| Styling | Tailwind CSS |
| AI Vision | Google Gemini 1.5 Flash (free) |
| Hosting | Vercel (free) |

