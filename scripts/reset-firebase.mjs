import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { resolve, dirname } from 'path'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const KEY_PATH = resolve(__dirname, '../serviceAccount.json')

if (!existsSync(KEY_PATH)) {
  console.error('❌  No se encontró serviceAccount.json en la raíz del proyecto.')
  console.error('    Descárgalo desde Firebase Console → Configuración → Cuentas de servicio')
  process.exit(1)
}

const serviceAccount = require(KEY_PATH)

initializeApp({ credential: cert(serviceAccount) })

const auth = getAuth()
const db = getFirestore()

async function deleteAllUsers() {
  let deleted = 0
  let pageToken
  do {
    const result = await auth.listUsers(1000, pageToken)
    if (result.users.length === 0) break
    const uids = result.users.map((u) => u.uid)
    await auth.deleteUsers(uids)
    deleted += uids.length
    console.log(`  ✓ Eliminados ${deleted} usuarios de Auth...`)
    pageToken = result.pageToken
  } while (pageToken)
  console.log(`  ✅ Auth limpio — ${deleted} usuarios eliminados.`)
}

async function deleteCollection(colRef) {
  const snap = await colRef.listDocuments()
  if (snap.length === 0) return
  for (const docRef of snap) {
    const subCols = await docRef.listCollections()
    for (const sub of subCols) {
      await deleteCollection(sub)
    }
    await docRef.delete()
  }
}

async function deleteFirestoreUsers() {
  console.log('  Borrando colección users en Firestore...')
  const usersCol = db.collection('users')
  const docs = await usersCol.listDocuments()
  let count = 0
  for (const userDoc of docs) {
    const subCols = await userDoc.listCollections()
    for (const sub of subCols) {
      await deleteCollection(sub)
    }
    await userDoc.delete()
    count++
  }
  console.log(`  ✅ Firestore limpio — ${count} documentos de usuarios eliminados.`)
}

console.log('\n🔥  Iniciando limpieza de Firebase...\n')
await deleteAllUsers()
await deleteFirestoreUsers()
console.log('\n✅  Reset completo. Ya puedes registrarte desde cero.\n')
