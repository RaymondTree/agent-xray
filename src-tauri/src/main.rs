#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn set_zoom(window: tauri::WebviewWindow, zoom: f64) -> Result<(), String> {
    let clamped = zoom.clamp(0.5, 2.0);
    window.set_zoom(clamped).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    if !url.starts_with("https://") {
        return Err("Only https URLs are supported".to_string());
    }
    #[cfg(target_os = "linux")]
    let status = std::process::Command::new("xdg-open").arg(&url).spawn();
    #[cfg(target_os = "macos")]
    let status = std::process::Command::new("open").arg(&url).spawn();
    #[cfg(target_os = "windows")]
    let status = std::process::Command::new("cmd").args(["/C", "start", "", &url]).spawn();
    status.map(|_| ()).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![set_zoom, open_external])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
