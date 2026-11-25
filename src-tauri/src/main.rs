#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn set_zoom(window: tauri::WebviewWindow, zoom: f64) -> Result<(), String> {
    let clamped = zoom.clamp(0.5, 2.0);
    window.set_zoom(clamped).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![set_zoom])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
