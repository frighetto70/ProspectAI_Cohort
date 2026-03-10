import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/templates', label: 'Templates', icon: '📝' },
  { href: '/settings', label: 'Configurações', icon: '⚙️' },
];

export function Nav() {
  return (
    <aside className="w-64 min-h-screen bg-[#1e3a5f] text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-lg font-bold">Strategic Reset</h1>
        <p className="text-sm text-white/60">Prospector</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-white/10 transition-colors"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
