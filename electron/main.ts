import {
  app,
  BrowserWindow,
  Menu,
  nativeTheme,
} from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "./ipc/index.ts";
import { initializeDatabase } from "./database/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const isDevelopment = !app.isPackaged;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: "#f4f6f5",

    webPreferences: {
      preload: path.join(__dirname, "preload.ts"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDevelopment) {
    mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "../dist/renderer/index.html")
    );
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createApplicationMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "New Sale",
          accelerator: "F2",
          click: () => {
            mainWindow?.webContents.send(
              "navigation:navigate",
              "/pos"
            );
          },
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator:
            process.platform === "darwin"
              ? "Cmd+Q"
              : "Ctrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "Sales",
      submenu: [
        {
          label: "Point of Sale",
          accelerator: "F2",
          click: () =>
            mainWindow?.webContents.send(
              "navigation:navigate",
              "/pos"
            ),
        },
        {
          label: "Transactions",
          click: () =>
            mainWindow?.webContents.send(
              "navigation:navigate",
              "/sales"
            ),
        },
        {
          label: "Returns & Refunds",
          click: () =>
            mainWindow?.webContents.send(
              "navigation:navigate",
              "/sales/returns"
            ),
        },
      ],
    },
    {
      label: "Inventory",
      submenu: [
        {
          label: "Medicines",
          click: () =>
            mainWindow?.webContents.send(
              "navigation:navigate",
              "/inventory"
            ),
        },
        {
          label: "Stock",
          click: () =>
            mainWindow?.webContents.send(
              "navigation:navigate",
              "/inventory/stock"
            ),
        },
        {
          label: "Low Stock",
          click: () =>
            mainWindow?.webContents.send(
              "navigation:navigate",
              "/inventory/low-stock"
            ),
        },
        {
          label: "Expiry",
          click: () =>
            mainWindow?.webContents.send(
              "navigation:navigate",
              "/inventory/expiry"
            ),
        },
      ],
    },
    {
      label: "Patients",
      click: () =>
        mainWindow?.webContents.send(
          "navigation:navigate",
          "/patients"
        ),
    },
    {
      label: "Prescriptions",
      click: () =>
        mainWindow?.webContents.send(
          "navigation:navigate",
          "/prescriptions"
        ),
    },
    {
      label: "Reports",
      submenu: [
        {
          label: "Sales Reports",
          click: () =>
            mainWindow?.webContents.send(
              "navigation:navigate",
              "/reports/sales"
            ),
        },
        {
          label: "Inventory Reports",
          click: () =>
            mainWindow?.webContents.send(
              "navigation:navigate",
              "/reports/inventory"
            ),
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "Ctrl+R",
          click: () =>
            mainWindow?.webContents.reload(),
        },
        {
          label: "Toggle Developer Tools",
          accelerator: "Ctrl+Shift+I",
          click: () =>
            mainWindow?.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: "Tools",
      submenu: [
        {
          label: "Settings",
          click: () =>
            mainWindow?.webContents.send(
              "navigation:navigate",
              "/settings"
            ),
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About Phermercy",
          click: () =>
            mainWindow?.webContents.send(
              "navigation:navigate",
              "/about"
            ),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(
    Menu.buildFromTemplate(template)
  );
}

app.whenReady().then(() => {
  nativeTheme.themeSource = "light";

  initializeDatabase();

  createMainWindow();
  createApplicationMenu();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});