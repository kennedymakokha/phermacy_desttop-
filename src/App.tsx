import { useEffect, useState } from "react";

import DesktopLayout from "./layouts/DesktopLayout";

import Dashboard from "./pages/Dashboard";
import PosPage from "./features/pos/PosPage";

import SalesPage from "./pages/sales/SalesPage";

import InventoryPage from "./pages/inventory/InventoryPage";
import AddMedicinePage from "./pages/inventory/AddMedicinePage";
import MedicineDetailsPage from "./src/pages/inventory/MedicineDetailsPage";
import ReceiveStockPage from "./pages/inventory/ReceiveStockPage";
import StockPage from "./pages/inventory/StockPage";
import LowStockPage from "./pages/inventory/LowStockPage";

export default function App() {
  const [route, setRoute] = useState("/");

  useEffect(() => {
    if (!window.electron) {
      return;
    }

    return window.electron.onNavigate((nextRoute) => {
      setRoute(nextRoute);
    });
  }, []);

  const navigate = (nextRoute: string) => {
    setRoute(nextRoute);
  };
  if (route.startsWith("/inventory/medicines/") && route.endsWith("/receive")) {
    const medicineId = route.split("/")[3];

    if (medicineId) {
      return <ReceiveStockPage medicineId={medicineId} onNavigate={navigate} />;
    }
  }
  if (route === "/inventory/medicines/new") {
    return <AddMedicinePage onNavigate={navigate} />;
  }

  if (route.startsWith("/inventory/medicines/") && route.endsWith("/receive")) {
    const medicineId = route.split("/")[3];

    if (medicineId) {
      return <ReceiveStockPage medicineId={medicineId} onNavigate={navigate} />;
    }
  }

  if (
    route.startsWith("/inventory/medicines/") &&
    !route.endsWith("/edit") &&
    !route.endsWith("/receive")
  ) {
    const medicineId = route.split("/")[3];

    if (medicineId) {
      return (
        <MedicineDetailsPage medicineId={medicineId} onNavigate={navigate} />
      );
    }
  }
  const renderPage = () => {
    /*
     * Dashboard
     */
    if (route === "/") {
      return <Dashboard />;
    }

    /*
     * Point of Sale
     */
    if (route === "/pos") {
      return <PosPage />;
    }

    /*
     * Sales
     */
    if (route === "/sales") {
      return <SalesPage />;
    }

    /*
     * Inventory
     */
    if (route === "/inventory") {
      return <InventoryPage onNavigate={navigate} />;
    }
    if (route === "/inventory") {
      return <InventoryPage onNavigate={navigate} />;
    }

    if (route === "/inventory/stock") {
      return <StockPage onNavigate={navigate} />;
    }
    if (route === "/inventory/low-stock") {
      return <LowStockPage onNavigate={navigate} />;
    }
    /*
     * Add Medicine
     *
     * This must come BEFORE the dynamic medicine route.
     */
    if (route === "/inventory/medicines/new") {
      return <AddMedicinePage onNavigate={navigate} />;
    }

    /*
     * Medicine Details
     *
     * Example:
     * /inventory/medicines/abc123
     */
    if (
      route.startsWith("/inventory/medicines/") &&
      !route.endsWith("/edit") &&
      !route.endsWith("/receive")
    ) {
      const medicineId = route.split("/")[3];

      if (medicineId) {
        return (
          <MedicineDetailsPage medicineId={medicineId} onNavigate={navigate} />
        );
      }
    }

    /*
     * Future inventory routes
     *
     * These will be enabled when we create the pages:
     *
     * /inventory/medicines/:id/edit
     * /inventory/medicines/:id/receive
     * /inventory/stock
     * /inventory/low-stock
     * /inventory/expiry
     */

    /*
     * Fallback
     */
    return <Dashboard />;
  };

  return (
    <DesktopLayout activeRoute={route} onNavigate={navigate}>
      {renderPage()}
    </DesktopLayout>
  );
}
