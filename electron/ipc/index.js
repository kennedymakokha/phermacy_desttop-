import { ipcMain } from "electron";
export function registerIpcHandlers() {
    ipcMain.on("navigation:navigate", (event, route) => {
        event.sender.send("navigation:navigate", route);
    });
}
registerIpcHandlers();
