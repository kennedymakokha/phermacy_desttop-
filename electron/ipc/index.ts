
import { ipcMain } from "electron";

import { registerPharmacyIpc } from "./pharmacy.ts";
import { registerPrintingIpc } from "./printing.ts";

export function registerIpcHandlers(): void {
  ipcMain.on(
    "navigation:navigate",
    (event, route: string) => {
      event.sender.send(
        "navigation:navigate",
        route,
      );
    },
  );

  registerPharmacyIpc();
  registerPrintingIpc();
}

registerIpcHandlers();

