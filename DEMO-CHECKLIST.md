# DOST RO2 — Training Evaluation Analytics
## Demo Checklist & Feature Guide

Use this document when presenting the app to the DOST RO2 team.

---

## Before the demo

- [ ] App is running (`npm run dev`) or deployed URL is ready
- [ ] Supabase `setup.sql` has been run (schema + seed data)
- [ ] Admin account works: **jeffson@gmail.com** / **123Admin**
- [ ] Sample Excel file is ready (Google Form export)
- [ ] Browser: Chrome recommended (disable QUIC if Supabase login fails)

---

## Login credentials (demo)

| Role   | Email              | Password  | Access                          |
|--------|--------------------|-----------|---------------------------------|
| Admin  | jeffson@gmail.com  | 123Admin  | Full — import, undo, clear all  |

> Other roles (staff, trainer, viewer) can be set in Supabase → `profiles.role`. See `supabase/features-queries.sql` Section 2.

---

## Features added (summary)

### 1. Smart import & merge
- Upload Google Form Excel / CSV files
- Detects duplicate rows (same evaluator + training + date + contact)
- On re-upload, choose:
  - **Merge** — update existing rows + import new ones
  - **Import new only** — skip duplicates
  - **Import all** — add everything as new rows

**Where:** Dashboard → Import section

---

### 2. Import history & undo
- Every upload is logged (file name, row count, date, who imported)
- Admin and staff can **undo** a batch (removes those evaluations)

**Where:** Dashboard → Import history panel

---

### 3. Validation report
- Shows rows skipped during import (missing data, invalid ratings, etc.)
- Helps fix Excel before re-uploading

**Where:** Dashboard → after import completes

---

### 4. Merge duplicate training names
- Combines spelling variants into one canonical title in the database
- Example: `SAMRT AND SUSTAINABLE…` + `Smart and Sustainable…` → one name
- Responses, dates, and venues are **not** deleted — only the title is unified

**Where:** Dashboard → **Merge duplicate training names** panel

---

### 5. Auto-group spelling variants (dashboard)
- Even before DB merge, the dashboard groups similar titles into **one program card**
- Shows:
  - Combined response count
  - Number of sessions and venues
  - **“X title variants”** badge when spellings differ

**Where:** Dashboard → program cards

---

### 6. Search & filters
| Filter            | Shows                                      |
|-------------------|--------------------------------------------|
| **All**           | Every program card                         |
| **Strong ≥ 3.5**  | Programs meeting the benchmark             |
| **Needs attention < 3.0** | Programs below target              |
| **Duplicates**    | Cards with multiple title spellings        |

**Where:** Dashboard → filter chips above the program grid

---

### 7. Program detail & graphs
- Overall score ring, satisfaction bar, rating distribution
- Section scores (radar + bar charts)
- Part VI open-ended comments (areas for improvement, suggestions)
- Multi-session / multi-venue breakdown when variants were merged

**Where:** Click any program card → **View graphs**

---

### 8. PDF-style report export
- Printable report with scores, sections, and comments
- Opens in a new window — use browser Print → Save as PDF

**Where:** Program detail page → **Export report**

---

### 9. Role-based access
| Role    | Import | Undo import | Export | Merge titles | Clear all data |
|---------|--------|-------------|--------|--------------|----------------|
| Admin   | ✅     | ✅          | ✅     | ✅           | ✅             |
| Staff   | ✅     | ✅          | ✅     | ✅           | ❌             |
| Trainer | ✅     | ❌          | ✅     | ❌           | ❌             |
| Viewer  | ❌     | ❌          | ✅     | ❌           | ❌             |

**Where:** Navbar shows role badge (e.g. **Admin**)

---

### 10. Forgot password
- Users can reset password via email link
- Requires Supabase Auth → Email provider enabled

**Where:** Login page → **Forgot password?**

---

### 11. Features help panel
- In-app guide explaining what the app can do

**Where:** Dashboard → **What this app can do** (expand panel)

---

### 12. Network reliability
- Automatic retry on failed Supabase requests
- Clearer error messages when browser/network blocks the connection

---

## Demo script (15–20 minutes)

### Step 1 — Login (2 min)
1. Open the app login page
2. Sign in as **jeffson@gmail.com** / **123Admin**
3. Point out: DOST branding, secure login gate layout

**Say:** *“Only authorized DOST staff can access evaluation data.”*

---

### Step 2 — Dashboard overview (3 min)
1. Show hero stats (total programs, responses, average score)
2. Scroll to program cards — note combined cards for SSCP / onboarding variants
3. Click **Duplicates** filter — show programs with spelling variants
4. Click **Strong ≥ 3.5** — show benchmark filtering

**Say:** *“The dashboard automatically groups the same training even if respondents typed the title differently.”*

---

### Step 3 — Program detail (3 min)
1. Open the SSCP / largest program card
2. Show score ring, satisfaction, section charts
3. Scroll to Part VI comments
4. Click **Export report** → show printable layout

**Say:** *“All graphs are computed live from imported form responses — no separate graph database.”*

---

### Step 4 — Import Excel (4 min)
1. Go to Import section on dashboard
2. Upload the Google Form Excel file
3. If duplicates appear → show the merge dialog
4. Choose **Merge** and confirm
5. Show validation summary (if any rows skipped)

**Say:** *“Re-uploading the same form won’t create messy duplicates — the app detects and merges them.”*

---

### Step 5 — Import history & undo (2 min)
1. Open **Import history**
2. Show the latest batch (file name, row count, date)
3. Optionally demo **Undo** on a test batch

**Say:** *“If the wrong file was uploaded, staff can roll back that import without touching other data.”*

---

### Step 6 — Merge training names (3 min)
1. Open **Merge duplicate training names**
2. Show suggested merge groups (title variants + response counts + venues)
3. Click **Use this merge** on SSCP group (or explain manual merge)

**Say:** *“This permanently cleans training titles in the database for cleaner reports going forward.”*

---

### Step 7 — Wrap up (2 min)
1. Expand **What this app can do** help panel
2. Mention role-based access and password reset
3. Q&A

---

## SQL verification (optional — for technical audience)

Run in **Supabase → SQL Editor** using `supabase/features-queries.sql`:

| Query   | Confirms                          |
|---------|-----------------------------------|
| **11a** | Tables, views, functions exist    |
| **11b** | Admin user is active              |
| **11f** | Dashboard card count matches DB   |
| **11g** | Duplicates filter data            |
| **11h** | SSCP multi-venue grouping         |
| **11d** | Import batch integrity after upload |

---

## Common questions & answers

**Q: Where is the data stored?**  
A: Supabase (PostgreSQL). All evaluations, import history, and user profiles are in the cloud database.

**Q: What if the same training has different venue names?**  
A: Different venues stay as separate sessions inside one program card. They are not treated as duplicate programs.

**Q: Can we add more users?**  
A: Yes. Create users in Supabase Auth, then set their role in `public.profiles`.

**Q: What Excel format is supported?**  
A: Google Form export (.xlsx) and CSV — same columns as the DOST evaluation form.

**Q: Do we need to run SQL every time?**  
A: No. `setup.sql` is one-time. `features-queries.sql` is only for checking/testing.

---

## Files reference

| File | Purpose |
|------|---------|
| `supabase/setup.sql` | One-paste full database setup |
| `supabase/create-admin.sql` | Create/reset admin user only |
| `supabase/features-queries.sql` | Test & verify all features |
| `supabase/verify-graphs.sql` | Check graph data exists |
| `.env` | Supabase URL and API keys |

---

## Post-demo follow-ups

- [ ] Create staff/viewer accounts for team members
- [ ] Import latest Google Form export
- [ ] Run merge on remaining spelling variants
- [ ] Enable email for password reset in Supabase Auth
- [ ] Deploy to production URL (if not yet deployed)

---

*DOST RO2 — Training Evaluation Analytics · Built for regional training program monitoring*
