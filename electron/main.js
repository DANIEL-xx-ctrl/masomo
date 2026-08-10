// ============================================================================
// electron/app/main.js — Electron main process for MASOMO
//
// Architecture:
//   1. Setup SQLite DB in UserData directory with proper Windows URI format
//   2. Find a free TCP port on 127.0.0.1
//   3. Spawn `node server.js` (Next.js standalone server) as a child process
//   4. Poll http://127.0.0.1:PORT until the server responds
//   5. Create a BrowserWindow loading http://127.0.0.1:PORT
//   6. Kill child process cleanly on exit
// ============================================================================

const { app, BrowserWindow, shell } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const net = require('net')
const http = require('http')
const fs = require('fs')

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------
let mainWindow = null
let serverProcess = null
let serverPort = 0
let serverStarted = false

// ---------------------------------------------------------------------------
// Path helpers — fixes dev vs packaged directory resolution
// ---------------------------------------------------------------------------
function getResourcesDir() {
  if (process.env.ELECTRON_DEV === '1' || !app.isPackaged) {
    // In dev: __dirname is electron/app -> go up to electron/resources
    return path.join(__dirname, '..', 'resources')
  }
  return process.resourcesPath
}

function getServerDir() {
  return path.join(getResourcesDir(), 'server')
}

function getNodeBinary() {
  const dir = path.join(getServerDir(), 'node-bin')
  const exe = process.platform === 'win32' ? 'node.exe' : 'node'
  const candidate = path.join(dir, exe)
  if (fs.existsSync(candidate)) return candidate
  return exe
}

// ---------------------------------------------------------------------------
// SQLite Database Manager (Formats Windows file:/// URI for Prisma)
// ---------------------------------------------------------------------------
function setupDatabaseUrl() {
  const userDataPath = app.getPath('userData')
  const targetDbPath = path.join(userDataPath, 'masomo.sqlite')

  // In dev: root/prisma/dev.sqlite | In packaged: resources/prisma/dev.sqlite
  const templateDbPath = (!app.isPackaged || process.env.ELECTRON_DEV === '1')
    ? path.join(__dirname, '..', '..', 'prisma', 'dev.sqlite')
    : path.join(process.resourcesPath, 'prisma', 'dev.sqlite')

  // Copy template database if it doesn't exist yet in user's AppData
  if (!fs.existsSync(targetDbPath)) {
    try {
      fs.mkdirSync(userDataPath, { recursive: true })
      if (fs.existsSync(templateDbPath)) {
        fs.copyFileSync(templateDbPath, targetDbPath)
        console.log(`[MASOMO] Database initialized successfully at: ${targetDbPath}`)
      } else {
        console.warn(`[MASOMO] Template DB not found at ${templateDbPath}. Starting clean.`)
      }
    } catch (err) {
      console.error('[MASOMO] Failed to initialize SQLite database in AppData:', err)
    }
  } else {
    console.log(`[MASOMO] Using existing database at: ${targetDbPath}`)
  }

  // Windows file URI formatting fix for Prisma (C:\path -> C:/path -> file:///C:/path)
  const normalizedPath = targetDbPath.replace(/\\/g, '/')
  const databaseUrl = normalizedPath.startsWith('/')
    ? `file:${normalizedPath}`
    : `file:///${normalizedPath}`

  console.log(`[MASOMO] Configured DATABASE_URL: ${databaseUrl}`)
  return databaseUrl
}

// ---------------------------------------------------------------------------
// Find a free TCP port on 127.0.0.1 (starting from 3000)
// ---------------------------------------------------------------------------
function findFreePort(startPort = 3000) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.unref()
    server.on('error', () => {
      resolve(findFreePort(startPort + 1))
    })
    server.listen(startPort, '127.0.0.1', () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
  })
}

// ---------------------------------------------------------------------------
// Wait for the HTTP server to be ready (poll up to 60 seconds)
// ---------------------------------------------------------------------------
function waitForServer(port, timeoutMs = 60000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    function check() {
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('Server did not start within 60 seconds.'))
      }
      const req = http.get(
        { hostname: '127.0.0.1', port, path: '/', timeout: 2000 },
        (res) => {
          res.resume()
          resolve()
        }
      )
      req.on('error', () => setTimeout(check, 500))
      req.on('timeout', () => {
        req.destroy()
        setTimeout(check, 500)
      })
    }
    check()
  })
}

// ---------------------------------------------------------------------------
// Spawn the Next.js standalone server
// ---------------------------------------------------------------------------
function startServer(port) {
  const serverDir = getServerDir()
  const serverJs = path.join(serverDir, 'server.js')

  if (!fs.existsSync(serverJs)) {
    throw new Error(`server.js not found at: ${serverJs}`)
  }

  const databaseUrl = setupDatabaseUrl()
  const nodeBin = getNodeBinary()
  console.log(`[MASOMO] Starting server: ${nodeBin} ${serverJs} (port ${port})`)

  const env = {
    ...process.env,
    PORT: String(port),
    NODE_ENV: 'production',
    DATABASE_URL: databaseUrl,
    ELECTRON_RUN: '1',
  }

  serverProcess = spawn(nodeBin, [serverJs], {
    cwd: serverDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  serverProcess.stdout.on('data', (data) => {
    console.log(`[server] ${data.toString().trim()}`)
  })
  serverProcess.stderr.on('data', (data) => {
    console.error(`[server:err] ${data.toString().trim()}`)
  })
  serverProcess.on('exit', (code, signal) => {
    console.log(`[server] exited with code ${code} signal ${signal}`)
    serverProcess = null
  })

  return waitForServer(port)
}

// ---------------------------------------------------------------------------
// Create the main browser window
// ---------------------------------------------------------------------------
function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'MASOMO - Système de Gestion Scolaire',
    backgroundColor: '#0f172a',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.loadURL(`http://127.0.0.1:${port}`)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(async () => {
  try {
    serverPort = await findFreePort(3000)
    console.log(`[MASOMO] Using port ${serverPort}`)
    await startServer(serverPort)
    serverStarted = true
    createWindow(serverPort)
  } catch (err) {
    console.error('[MASOMO] Failed to start:', err)
    const win = new BrowserWindow({ width: 700, height: 450 })
    win.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(
          `<html><body style="font-family:sans-serif;padding:2rem;background:#0f172a;color:#fca5a5">
            <h1>MASOMO — Erreur de démarrage</h1>
            <p>Le serveur local n'a pas pu démarrer.</p>
            <pre style="background:#1e293b;padding:1rem;color:#f87171;white-space:pre-wrap;word-break:break-all">${err.message}</pre>
          </body></html>`
        )
    )
  }
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && serverStarted) {
    createWindow(serverPort)
  }
})

// ---------------------------------------------------------------------------
// Cleanup: kill the child server process before quitting
// ---------------------------------------------------------------------------
app.on('before-quit', () => {
  if (serverProcess) {
    console.log('[MASOMO] Stopping server process...')
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t'], {
          windowsHide: true,
        })
      } else {
        serverProcess.kill('SIGTERM')
        setTimeout(() => {
          try {
            serverProcess && serverProcess.kill('SIGKILL')
          } catch (_) {}
        }, 3000)
      }
    } catch (e) {
      console.error('[MASOMO] Error stopping server:', e)
    }
  }
})

process.on('SIGINT', () => app.quit())
process.on('SIGTERM', () => app.quit())
