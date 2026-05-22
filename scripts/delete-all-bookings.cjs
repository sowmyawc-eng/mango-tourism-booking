/**
 * delete-all-bookings.cjs
 * Deletes every document in the `bookings` collection.
 * Run from inside the mango-tourism-pwa folder:
 *   node scripts/delete-all-bookings.cjs
 */

const admin = require('firebase-admin')
const path  = require('path')

const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json.json'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

async function deleteAllBookings() {
  const collectionRef = db.collection('bookings')
  const snap = await collectionRef.get()

  if (snap.empty) {
    console.log('✅ No bookings found — collection is already empty.')
    process.exit(0)
  }

  console.log(`🗑️  Found ${snap.size} booking(s). Deleting…`)

  // Firestore batch allows max 500 ops at once
  const batchSize = 400
  const docs = snap.docs
  let deleted = 0

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch()
    docs.slice(i, i + batchSize).forEach(doc => batch.delete(doc.ref))
    await batch.commit()
    deleted += Math.min(batchSize, docs.length - i)
    console.log(`   Deleted ${deleted} / ${docs.length}…`)
  }

  console.log(`✅ Done! All ${deleted} booking(s) deleted.`)
  process.exit(0)
}

deleteAllBookings().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
