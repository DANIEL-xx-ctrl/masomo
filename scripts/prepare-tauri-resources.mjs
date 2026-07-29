// ============================================================================
// prepare-tauri-resources.mjs
//
// Runs BEFORE `tauri build` bundles the app. It:
//   1. Runs `bun run build` (Next.js standalone output → .next/standalone/)
//   2. Copies .next/standalone/ → src-tauri/resources/server/
//   3. Copies .next/static/ → src-tauri/resources/server/.next/static/
//   4. Copies public/ → src-tauri/resources/server/public/
//   5. Copies prisma/db/ → src-tauri/resources/server/prisma/db/ (SQLite database)
//
// The resulting src-tauri/resources/server/ is a self-contained Next.js app
// that can be launched with `node server.js` from inside the Tauri app.
// ============================================================================
import { execSync } from 'child_process'
import { cpSync, mkdirSync, existsSync, rmSync, renameSync } from 'fs'
import { join, resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const STANDALONE_SRC = join(ROOT, '.next', 'standalone')
const STATIC_SRC = join(ROOT, '.next', 'static')
const PUBLIC_SRC = join(ROOT, 'public')
const DB_SRC = join(ROOT, 'db')  // database lives at db/custom.db (DATABASE_URL=file:./db/custom.db)
const RESOURCES_DIR = join(ROOT, 'src-tauri', 'resources')
const SERVER_DIR = join(RESOURCES_DIR, 'server')

console.log('=== Preparing Tauri resources (bundled Next.js server) ===')

// Step 1: Build Next.js (standalone)
if (!existsSync(STANDALONE_SRC)) {
  console.log('→ Running: bun run build (this may take a minute)...')
  execSync('bun run build', { cwd: ROOT, stdio: 'inherit' })
} else {
  console.log('→ .next/standalone already exists, skipping build (delete it to force rebuild)')
}

if (!existsSync(STANDALONE_SRC)) {
  console.error('✗ Build failed: .next/standalone not found')
  process.exit(1)
}

// Step 2: Clean and recreate the server resources directory
if (existsSync(SERVER_DIR)) {
  rmSync(SERVER_DIR, { recursive: true, force: true })
}
mkdirSync(SERVER_DIR, { recursive: true })

// Step 3: Copy the standalone server
console.log('→ Copying .next/standalone → src-tauri/resources/server/')
cpSync(STANDALONE_SRC, SERVER_DIR, { recursive: true })

// Step 4: Copy static assets into the server's .next/static
const serverStaticDir = join(SERVER_DIR, '.next', 'static')
if (existsSync(STATIC_SRC)) {
  console.log('→ Copying .next/static → server/.next/static/')
  cpSync(STATIC_SRC, serverStaticDir, { recursive: true })
}

// Step 5: Copy public assets into server/public
const serverPublicDir = join(SERVER_DIR, 'public')
if (existsSync(PUBLIC_SRC)) {
  console.log('→ Copying public/ → server/public/')
  cpSync(PUBLIC_SRC, serverPublicDir, { recursive: true })
}

// Step 6: Copy the SQLite database into server/db/
const serverDbDir = join(SERVER_DIR, 'db')
if (existsSync(DB_SRC)) {
  console.log('→ Copying db/ → server/db/')
  mkdirSync(serverDbDir, { recursive: true })
  cpSync(DB_SRC, serverDbDir, { recursive: true })
}

// Step 7: Create a placeholder frontendDist (Tauri requires it even though
// we load from localhost:3000)
const placeholderDir = join(RESOURCES_DIR, 'placeholder')
if (!existsSync(placeholderDir)) {
  mkdirSync(placeholderDir, { recursive: true })
}

// Verify server.js exists
const serverJs = join(SERVER_DIR, 'server.js')
if (!existsSync(serverJs)) {
  console.error('✗ server.js not found in standalone output!')
  console.error('  Expected:', serverJs)
  process.exit(1)
}

console.log('')
console.log('✅ Tauri resources prepared:')
console.log('   Server dir:', SERVER_DIR)
console.log('   server.js: ✓')
console.log('   static:    ' + (existsSync(serverStaticDir) ? '✓' : '✗'))
console.log('   public:    ' + (existsSync(serverPublicDir) ? '✓' : '✗'))
console.log('   db:        ' + (existsSync(serverDbDir) ? '✓' : '✗'))
console.log('')
