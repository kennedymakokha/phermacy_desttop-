import { contextBridge, ipcRenderer } from "electron";
const electronApi = {
    navigate: (route) => {
        ipcRenderer.send("navigation:navigate", route);
    },
    onNavigate: (callback) => {
        const listener = (_event, route) => {
            callback(route);
        };
        ipcRenderer.on("navigation:navigate", listener);
        return () => {
            ipcRenderer.removeListener("navigation:navigate", listener);
        };
    },
    getPlatform: () => process.platform,
};
contextBridge.exposeInMainWorld("electron", electronApi);
