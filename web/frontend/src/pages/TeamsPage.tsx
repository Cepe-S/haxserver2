import { TeamsAndMatchesManager } from '../components/Teams/TeamsAndMatchesManager';

export function TeamsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-6 py-4">
            <a href="/server-images" className="text-gray-600 hover:text-blue-600 font-medium pb-2 transition-colors">
              Server Images
            </a>
            <a href="/players" className="text-gray-600 hover:text-blue-600 font-medium pb-2 transition-colors">
              Players
            </a>
            <a href="/teams" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">
              Teams & Matches
            </a>
            <a href="/global-config" className="text-gray-600 hover:text-blue-600 font-medium pb-2 transition-colors">
              Global Config
            </a>
          </nav>
        </div>
      </div>

      {/* Content */}
      <TeamsAndMatchesManager />
    </div>
  );
}