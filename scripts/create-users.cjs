// Hanu Reddy Mango Tourism — User Setup Script
// Run: node scripts/create-users.cjs

const admin = require('firebase-admin')

let serviceAccount
try {
  serviceAccount = require('./serviceAccountKey.json')
} catch {
  console.error('\n❌  serviceAccountKey.json not found inside scripts/ folder.')
  console.error('    Download it from Firebase Console → Project Settings → Service Accounts\n')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const auth = admin.auth()
const db   = admin.firestore()

const DOMAIN = 'mango.app'

const USERS = [
  { name: 'Sowmya', username: 'sowmyawc',  password: 'admin2026', role: 'super_admin' },
  { name: 'Nithya', username: 'nithyahrr', password: 'admin2026', role: 'super_admin' },
  { name: 'Varsha', username: 'varshahrr', password: 'acct2026',  role: 'accountant'  },

  // Add more POS Managers here:
  // { name: 'Ravi', username: 'ravikumar', password: 'pos2026', role: 'pos_manager' },
]

async function run() {
  console.log('\n🥭  Creating staff accounts...\n')

  let created = 0, skipped = 0, failed = 0

  for (const u of USERS) {
    const email = `${u.username}@${DOMAIN}`
    try {
      const userRecord = await auth.createUser({
        email,
        password:    u.password,
        displayName: u.name,
      })

      await db.collection('users').doc(userRecord.uid).set({
        name:         u.name,
        username:     u.username,
        email,
        role:         u.role,
        assigned_pos: null,
        created_at:   admin.firestore.FieldValue.serverTimestamp(),
      })

      const label = { super_admin: '🔑 Super Admin', accountant: '💰 Accountant', pos_manager: '🏪 POS Manager' }[u.role]
      console.log(`  ✅  ${u.username.padEnd(14)} ${label}`)
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
  console.log('\n✅  Done! Login at hrmt.store with your username and password.\n')
  process.exit(0)
}

run()
