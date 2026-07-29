#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// ============================================================================
// MASOMO Tauri main entry
//
// This launches a bundled Next.js standalone server as a child process and
// loads it in the Tauri webview. The server (Node.js + Next.js standalone
// output) is bundled as a Tauri resource under `server/`.
//
// Flow:
//   1. Resolve the bundled server directory (platform-dependent path).
//   2. Spawn `node server.js` (or `bun server.js` if bun is preferred).
//   3. Poll http://localhost:3000 until it responds (max ~30s).
//   4. Tauri opens the window pointing at localhost:3000.
//   5. When the app window closes, the server child is killed.
// ============================================================================

use std::process::{Child, Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};
use tauri::Manager;

/// Find a free port between 3000 and 3020 — avoids "port in use" failures
/// if the user already runs something on 3000.
fn find_free_port() -> u16 {
    for port in 3000..3020 {
        if std::net::TcpListener::bind(("127.0.0.1", port)).is_ok() {
            return port;
        }
    }
    3000
}

/// Wait for the server to respond on the given port (max 30 seconds).
fn wait_for_server(port: u16) -> bool {
    let start = Instant::now();
    while start.elapsed() < Duration::from_secs(30) {
        if std::net::TcpStream::connect(("127.0.0.1", port)).is_ok() {
            // Port is open — give Next.js a moment to finish booting
            thread::sleep(Duration::from_millis(800));
            return true;
        }
        thread::sleep(Duration::from_millis(300));
    }
    false
}

/// Resolve the bundled server directory.
/// In dev: ../.next/standalone (relative to src-tauri)
/// In production (bundled): the `server/` resource directory.
fn resolve_server_dir(app: &tauri::App) -> std::path::PathBuf {
    // Try the bundled resource path first (production)
    if let Ok(server_dir) = app.path().resolve("server", tauri::path::BaseDirectory::Resource) {
        if server_dir.join("server.js").exists() {
            return server_dir;
        }
    }
    // Dev fallback: .next/standalone at the project root
    let dev_path = std::env::current_dir()
        .unwrap_or_default()
        .join("..")
        .join(".next")
        .join("standalone");
    dev_path
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // In dev mode, the beforeDevCommand (bun run dev) already starts
            // the Next.js dev server. We only spawn our own server in release.
            if cfg!(debug_assertions) {
                return Ok(());
            }

            let server_dir = resolve_server_dir(app);
            let port = find_free_port();

            // Spawn `node server.js` with PORT env so Next.js listens on our port.
            // We prefer `node` (universally available); fall back to `bun`.
            let server_js = server_dir.join("server.js");
            let child = Command::new("node")
                .arg(&server_js)
                .env("PORT", port.to_string())
                .env("HOSTNAME", "127.0.0.1")
                .env("NODE_ENV", "production")
                .current_dir(&server_dir)
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn();

            let child = match child {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("Failed to spawn MASOMO server: {}", e);
                    return Ok(());
                }
            };

            // Store the child handle so we can kill it on exit
            app.manage(std::sync::Mutex::new(child));

            // Wait for the server to be ready
            if !wait_for_server(port) {
                eprintln!("MASOMO server did not start within 30s");
            }

            // Update the window URL to our port
            if let Some(window) = app.get_webview_window("main") {
                let url = format!("http://127.0.0.1:{}", port);
                let _ = window.set_title(&format!("MASOMO - Système de Gestion Scolaire"));
                // Navigate the webview to our local server
                // Using eval to redirect — this works because the window starts
                // with a blank page (no frontendDist loaded in release mode)
                let _ = window.eval(&format!(
                    "window.location.replace('{}')",
                    url
                ));
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // When the main window closes, kill the server child process
            if let tauri::WindowEvent::Destroyed = event {
                let app = window.app_handle();
                if let Some(state) = app.try_state::<std::sync::Mutex<Child>>() {
                    if let Ok(mut guard) = state.lock() {
                        let _ = guard.kill();
                        let _ = guard.wait();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
