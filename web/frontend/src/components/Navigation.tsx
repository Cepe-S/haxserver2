interface NavigationProps {
  currentPage: 'server-images' | 'players' | 'teams' | 'global-config' | 'database-debug' | 'debug';
}

export function Navigation({ currentPage }: NavigationProps) {
  const navItems = [
    { id: 'server-images', label: 'Server Images', href: '/server-images' },
    { id: 'players', label: 'Players', href: '/players' },
    { id: 'teams', label: 'Teams & Matches', href: '/teams' },
    { id: 'global-config', label: 'Global Config', href: '/global-config' },
    { id: 'debug', label: 'Debug', href: '/debug' },
    { id: 'database-debug', label: 'Database Debug', href: '/database-debug' }
  ];

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-6 py-4">
        <nav className="flex space-x-6">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`font-medium pb-2 transition-colors ${
                currentPage === item.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}