# Hanu Reddy Mango Tourism — PWA Booking System

**GitHub repo name: `mango-tourism-booking`**

No login required. All pages are open. Accountant confirms and closes bookings only — ticket generation is handled in a separate app.

---

## Booking Workflow

```
Customer submits booking (QR form or POS staff)
  → Status: Pending Verification
  → Accountant opens booking, views payment screenshot
  → Clicks "Confirm Payment"  →  Status: Payment Confirmed
  → Accountant clicks "Close Booking"  →  Status: Closed
```

---

## Setup in 4 Steps

### Step 1 — Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Name: `mango-tourism` → Create (disable Google Analytics)
3. Enable **Firestore Database** → Production mode → pick region (e.g. `asia-south1`)
4. Enable **Storage** → Production mode
5. Go to **Project Settings** → **Your Apps** → click **`</>`** → Register web app
6. Copy the config values shown

### Step 2 — Configure .env

```bash
cp .env.example .env
```

Open `.env` and paste your Firebase values:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=mango-tourism.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mango-tourism
VITE_FIREBASE_STORAGE_BUCKET=mango-tourism.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_APP_URL=http://localhost:5173
```

### Step 3 — Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you should see the dashboard.

### Step 4 — Deploy Firestore Rules & Storage Rules

**Firestore:**
```bash
npm install -g firebase-tools
firebase login
firebase init firestore    # select mango-tourism project, use firestore.rules
firebase deploy --only firestore:rules
```

**Storage rules** (Firebase Console → Storage → Rules tab):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /receipts/{file} {
      allow read, write: if true;
    }
  }
}
```
Click **Publish**.

---

## Deploy to Vercel

1. Push code to GitHub repo named **`mango-tourism-booking`**
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Add all 7 `VITE_*` environment variables from your `.env`
4. Set `VITE_APP_URL` = your Vercel URL (e.g. `https://mango-tourism-booking.vercel.app`)
5. Click **Deploy** → done in ~1 minute

---

## Navigation Structure

| Section | Path | Who uses it |
|---|---|---|
| Main Dashboard | `/dashboard` | Overview & stats |
| POS Dashboard | `/pos/dashboard` | POS staff quick actions |
| New Booking | `/bookings/new` | POS staff — enter booking |
| Leads | `/leads` | POS staff — capture enquiries |
| Verify Payments | `/accountant/dashboard` | Accountant — pending queue |
| All Bookings | `/bookings` | Everyone |
| User Management | `/users` | Admin — add staff |
| POS Locations | `/pos-locations` | Admin — add locations & QR codes |
| Public Booking | `/book?pos=ID` | Customers — no login |

---

## QR Code Flow

1. Go to **POS Locations** → Add a location (e.g. "Phoenix Mall")
2. Click the QR icon → Download PNG
3. Print and place at the stall
4. Customer scans → lands on `/book?pos=LOCATION_ID` → location auto-filled
5. They fill in the form & upload payment → submitted as **Pending**
6. Accountant sees it in their dashboard → confirms → closes

---

## All Required Fields

Every form field is mandatory (marked with *). The public booking form has one optional item — the festival date, which can be skipped if the customer ticks "not sure about date".

---

## Install as Mobile App (Android)

1. Open the Vercel URL in Chrome on Android
2. Tap ⋮ menu → **Add to Home Screen**
3. App works like a native app — no Play Store needed

---

## Tech Stack

React 18 · Vite · Tailwind CSS · Firebase Firestore · Firebase Storage · React Router v6 · react-hook-form · qrcode.react · react-hot-toast · vite-plugin-pwa

---

*Hanu Reddy Mango Tourism · 2024*
