import Link from 'next/link';

export default function DemoNavbar() {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-lg tracking-wide bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            IOKKIO DEMO
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link 
            href="/reservar" 
            className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-800 hover:bg-emerald-600 transition"
          >
            📝 Reservar
          </Link>
          <Link 
            href="/eleccion-menu" 
            className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-800 hover:bg-emerald-600 transition"
          >
            🍽️ Menú
          </Link>
          <Link 
            href="/dashboard" 
            className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-800 hover:bg-emerald-600 transition"
          >
            📊 Dashboard
          </Link>
          <Link 
            href="/admin" 
            className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-800 hover:bg-emerald-600 transition"
          >
            ⚙️ Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}