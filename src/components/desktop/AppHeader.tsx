import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  FilePlus,
  RotateCcw,
  ShoppingCart,
  Receipt,
  Package,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";

interface AppHeaderProps {
  onNavigate: (route: string) => void;
}

interface MenuItem {
  label: string;
  route?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  divider?: boolean;
}

export default function AppHeader({
  onNavigate,
}: AppHeaderProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const navigate = (route: string) => {
    setOpenMenu(null);
    onNavigate(route);
  };

  const menus: Record<string, MenuItem[]> = {
    File: [
      {
        label: "New Sale",
        route: "/pos",
        shortcut: "F2",
        icon: <FilePlus size={15} />,
      },
    ],

    Sales: [
      {
        label: "Point of Sale",
        route: "/pos",
        shortcut: "F2",
        icon: <ShoppingCart size={15} />,
      },
      {
        label: "Transactions",
        route: "/sales",
        icon: <Receipt size={15} />,
      },
      {
        label: "Returns & Refunds",
        route: "/sales/returns",
        icon: <RotateCcw size={15} />,
      },
    ],

    Inventory: [
      {
        label: "Medicines",
        route: "/inventory",
        icon: <Package size={15} />,
      },
      {
        label: "Stock",
        route: "/inventory/stock",
        icon: <Package size={15} />,
      },
      {
        label: "Low Stock",
        route: "/inventory/low-stock",
        icon: <Package size={15} />,
      },
      {
        label: "Expiry",
        route: "/inventory/expiry",
        icon: <Package size={15} />,
      },
    ],

    Patients: [
      {
        label: "Patients",
        route: "/patients",
        icon: <Users size={15} />,
      },
    ],

    Reports: [
      {
        label: "Sales Reports",
        route: "/reports/sales",
        icon: <BarChart3 size={15} />,
      },
      {
        label: "Inventory Reports",
        route: "/reports/inventory",
        icon: <BarChart3 size={15} />,
      },
    ],

    Tools: [
      {
        label: "Settings",
        route: "/settings",
        icon: <Settings size={15} />,
      },
    ],

    Help: [
      {
        label: "About Phermercy",
        route: "/about",
        icon: <HelpCircle size={15} />,
      },
    ],
  };

  const menuNames = Object.keys(menus);

  return (
    <header
      ref={headerRef}
      className="relative z-50 h-12 shrink-0 border-b border-slate-200 bg-white flex items-center px-4"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-7 h-7 rounded-md bg-green-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">
            P
          </span>
        </div>

        <span className="font-semibold text-slate-800">
          Phermercy
        </span>
      </div>

      {/* Desktop Menus */}
      <nav className="ml-8 flex items-center h-full">
        {menuNames.map((menuName) => {
          const isOpen = openMenu === menuName;

          return (
            <div
              key={menuName}
              className="relative h-full flex items-center"
            >
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(
                    isOpen ? null : menuName
                  );
                }}
                className={[
                  "h-full px-3 flex items-center gap-1",
                  "text-sm transition-colors",
                  isOpen
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                {menuName}

                <ChevronDown
                  size={13}
                  className={[
                    "transition-transform",
                    isOpen
                      ? "rotate-180"
                      : "",
                  ].join(" ")}
                />
              </button>

              {/* Dropdown */}
              {isOpen && (
                <div className="absolute left-0 top-full mt-0 w-60 rounded-b-md border border-slate-200 bg-white py-1 shadow-lg">
                  {menus[menuName].map(
                    (item, index) => (
                      <div key={`${item.label}-${index}`}>
                        {item.divider && (
                          <div className="my-1 border-t border-slate-100" />
                        )}

                        <button
                          type="button"
                          disabled={!item.route}
                          onClick={() => {
                            if (item.route) {
                              navigate(item.route);
                            }
                          }}
                          className="w-full px-3 py-2 flex items-center gap-3 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-default"
                        >
                          <span className="w-5 flex items-center justify-center text-slate-500">
                            {item.icon}
                          </span>

                          <span className="flex-1">
                            {item.label}
                          </span>

                          {item.shortcut && (
                            <span className="text-xs text-slate-400">
                              {item.shortcut}
                            </span>
                          )}
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Connection Status */}
      <div className="ml-auto flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />

        <span className="text-xs text-slate-500">
          Online
        </span>
      </div>
    </header>
  );
}