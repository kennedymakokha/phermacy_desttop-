export default function StatusBar() {
  return (
    <footer className="h-7 shrink-0 border-t border-slate-200 bg-white flex items-center px-3 text-[11px] text-slate-500">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span>Database Ready</span>
      </div>

      <div className="mx-4 text-slate-300">
        |
      </div>

      <span>Online</span>

      <div className="ml-auto">
        Administrator
      </div>
    </footer>
  );
}