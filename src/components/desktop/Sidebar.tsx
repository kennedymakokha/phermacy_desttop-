interface SidebarProps {
  active: string;
  onNavigate: (route: string) => void;
}

const items = [
  {
    label: "Dashboard",
    icon: "⌂",
    route: "/",
  },
  {
    label: "Point of Sale",
    icon: "▣",
    route: "/pos",
  },
  {
    label: "Inventory",
    icon: "□",
    route: "/inventory",
  },
  {
    label: "Prescriptions",
    icon: "✚",
    route: "/prescriptions",
  },
  {
    label: "Patients",
    icon: "♙",
    route: "/patients",
  },
  {
    label: "Suppliers",
    icon: "▤",
    route: "/suppliers",
  },
  {
    label: "Reports",
    icon: "▥",
    route: "/reports",
  },
];

export default function Sidebar({
  active,
  onNavigate,
}: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 bg-slate-900 text-white flex flex-col">
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="text-xs uppercase tracking-widest text-slate-400">
          Pharmacy
        </div>

        <div className="text-lg font-semibold mt-1">
          Phermercy
        </div>
      </div>

      <div className="flex-1 py-3">
        {items.map((item) => {
          const isActive = active === item.route;

          return (
            <button
              key={item.route}
              onClick={() => onNavigate(item.route)}
              className={[
                "w-full flex items-center gap-3 px-4 py-2.5",
                "text-sm text-left transition-colors",
                isActive
                  ? "bg-green-600 text-white"
                  : "text-slate-300 hover:bg-slate-800",
              ].join(" ")}
            >
              <span className="w-5 text-center">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="text-sm font-medium">
          Administrator
        </div>

        <div className="text-xs text-slate-400 mt-1">
          System Administrator
        </div>
      </div>
    </aside>
  );
}