// ─────────────────────────────────────────────────────────────────────────────
// Hanu Reddy Mango Tourism — User Setup Script
// Run once to create all staff accounts in Firebase Auth + Firestore
//
// HOW TO RUN:
//   1. Place your serviceAccountKey.json inside the scripts/ folder
//   2. In Terminal: node scripts/create-users.js
// ─────────────────────────────────────────────────────────────────────────────

import admin from 'firebase-admin'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

let serviceAccount
try {
  serviceAccount = require('./serviceAccountKey.json')
} catch {
  console.error('\n❌  serviceAccountKey.json not found inside scripts/ folder.')
  console.error('    See instructions below to download it.\n')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const auth = admin.auth()
const db   = admin.firestore()

// ── Internal email domain (users never see or type this) ──────────────
const DOMAIN = 'mango.app'

// ── Define all staff accounts here ───────────────────────────────────
//    Add as many pos_managers as needed — just copy a block below
const USERS = [
  {
    name:     'Sowmya',
    username: 'sowmyawc',
    password: 'admin2026',
    role:     'super_admin',
  },
  {
    name:     'Nithya',
    username: 'nithyahrr',
    password: 'admin2026',
    role:     'super_admin',
  },
  {
    name:     'Varsha',
    username: 'varshahrr',
    password: 'acct2026',
    role:     'accountant',
  },

  // ── Add POS Managers below ────────────────────────────────────────
  // {
  //   name:     'Ravi Kumar',
  //   username: 'ravikumar',
  //   password: 'pos2026',
  //   role:     'pos_manager',
  // },
]

// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🥭  Hanu Reddy Mango Tourism — Creating Users\n')
  console.log(`   Domain used internally: @${DOMAIN}`)
  console.log(`   Users log in with just their username + password\n`)

  let created = 0
  let skipped = 0
  let failed  = 0

  for (const u of USERS) {
    const email = `${u.username}@${DOMAIN}`
    try {
      // Create Firebase Auth account
      const userRecord = await auth.createUser({
        email,
        password:    u.password,
        displayName: u.name,
      })

      // Save profile in Firestore (doc ID = UID for fast lookup on login)
      await db.collection('users').doc(userRecord.uid).set({
        name:         u.name,
        username:     u.username,
        email,
        role:         u.role,
        assigned_pos: null,
        created_at:   admin.firestore.FieldValue.serverTimestamp(),
      })

      const roleLabel = {
        super_admin: '🔑 Super Admin',
        accountant:  '💰 Accountant',
        pos_manager: '🏪 POS Manager',
      }[u.role] ?? u.role

      console.log(`  ✅  ${u.username.padEnd(14)} ${roleLabel}`)
      created++

    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        console.log(`  ⚠️   ${u.username.padEnd(14)} already exists — skipped`)
        skipped++
      } else {
        console.log(`  ❌  ${u.username.padEnd(14)} FAILED: ${e.message}`)
        failed++
      }
    }
  }

  console.log(`\n  Created: ${created}  |  Skipped: ${skipped}  |  Failed: ${failed}`)
  console.log('\n✅  Done! Log in at hrmt.store with your username and password.\n')
  process.exit(0)
}

run()
