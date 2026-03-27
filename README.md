# ClareerHQ

> **Know your career fit.** Built on O\*NET — the U.S. Department of Labor's occupational data standard.

---

## 🚀 Getting Live in ~30 Minutes

Follow these steps in order. Everything uses free tiers until you have real revenue.

---

### Step 1 — Get Your O\*NET API Key (5 min)

1. Go to **https://services.onetcenter.org/developer/**
2. Click **"Register for API access"**
3. Fill in the form — use ClareerHQ as the organization name
4. You'll receive your **username** and **password** by email (usually within minutes)
5. Keep these handy — you'll add them to your environment variables

---

### Step 2 — Set Up Your Database on Neon (5 min)

1. Go to **https://neon.tech** and sign up for a free account
2. Create a new project: name it `clareerhq`
3. Copy the **Connection String** (it looks like `postgresql://user:pass@host/dbname?sslmode=require`)
4. Keep this handy

---

### Step 3 — Set Up Clerk Auth (5 min)

1. Go to **https://clerk.com** and sign up
2. Create a new application named `ClareerHQ`
3. Choose Email and Google as sign-in methods
4. From the Clerk dashboard, copy:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)

---

### Step 4 — Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env.local

# 3. Fill in your .env.local with values from Steps 1-3

# 4. Push database schema
npm run db:push

# 5. Start dev server
npm run dev
```

Open **http://localhost:3000** — you should see the ClareerHQ landing page.

---

### Step 5 — Deploy to Vercel (10 min)

1. Push this folder to a **new GitHub repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial ClareerHQ commit"
   git remote add origin https://github.com/YOUR_USERNAME/clareerhq.git
   git push -u origin main
   ```

2. Go to **https://vercel.com** and sign up (free)

3. Click **"Add New Project"** → Import your GitHub repo

4. In the **Environment Variables** section, add all variables from your `.env.local`

5. Click **Deploy** — your app will be live at `clareerhq.vercel.app` in ~2 minutes

6. To use your custom domain:
   - In Vercel: Settings → Domains → Add `clareerhq.com`
   - In Cloudflare (your DNS): Add the CNAME record Vercel gives you
   - Done! Live at **clareerhq.com** within minutes

---

### Step 6 — Add Resend Email (Optional, 5 min)

1. Go to **https://resend.com** and create a free account
2. Verify your domain (`clareerhq.com`) by adding DNS records in Cloudflare
3. Create an API key and add it as `RESEND_API_KEY` in Vercel environment variables
4. Waitlist emails will now send automatically

---

## 📁 Project Structure

```
clareerhq/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Landing page
│   │   ├── assess/
│   │   │   ├── page.tsx          ← Occupation search
│   │   │   └── domains/page.tsx  ← Rating assessment
│   │   ├── results/page.tsx      ← Fit score results
│   │   ├── dashboard/page.tsx    ← User dashboard
│   │   └── api/
│   │       ├── onet/             ← O*NET proxy routes
│   │       ├── assessments/      ← Save/fetch assessments
│   │       └── waitlist/         ← Email capture
│   ├── lib/
│   │   ├── onet.ts               ← O*NET API client
│   │   ├── scoring.ts            ← Match algorithm
│   │   ├── db.ts                 ← Prisma client
│   │   └── utils.ts
│   ├── types/onet.ts             ← All TypeScript types
│   └── middleware.ts             ← Clerk auth middleware
├── prisma/schema.prisma          ← Database schema
├── .env.example                  ← Environment variable template
└── README.md
```

---

## 🔑 Key Files to Know

| File | What it does |
|------|-------------|
| `src/lib/onet.ts` | Calls O\*NET API — search occupations, fetch domain data |
| `src/lib/scoring.ts` | The match algorithm — weights domains, computes fit score, finds gaps |
| `prisma/schema.prisma` | Database tables — users, assessments, ratings, waitlist |
| `src/app/assess/domains/page.tsx` | The core assessment UX — rating buttons, domain progression |
| `src/app/results/page.tsx` | Score ring, domain bars, strengths/gaps display |

---

## 💰 Cost to Run

| Stage | Monthly Cost |
|-------|-------------|
| Launch (0-500 users) | ~$0–$7 |
| Growth (500-5,000 users) | ~$25–$75 |
| Scale (5,000+ users) | ~$75–$350 |

The app pays for itself with its first ~3-5 Pro subscribers ($9.99/mo).

---

## 🗺️ Roadmap

- **Phase 1 (Now):** Web app, 3 domains (Skills, Knowledge, Work Styles), waitlist
- **Phase 2 (Month 3):** All 8 domains, Clerk auth, saved assessments, Pro subscription via Stripe
- **Phase 3 (Month 6):** Alternative career recommendations, career path comparisons
- **Phase 4 (Month 9):** B2B API, resume import, LinkedIn integration
- **Phase 5 (Month 12):** React Native mobile app (Expo)

---

## 📞 O\*NET Data Attribution

This product uses occupational information from the Occupational Information Network (O\*NET) database, which is sponsored by the U.S. Department of Labor, Employment and Training Administration. The O\*NET database is in the public domain.

O\*NET® is a trademark of the U.S. Department of Labor, Employment and Training Administration.

---

*Built with Next.js 14, Tailwind CSS, Clerk, Neon PostgreSQL, and O\*NET Web Services.*
