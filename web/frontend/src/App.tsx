
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './services/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { ServerImagesPage } from './pages/ServerImagesPage';
import { PlayersPage } from './pages/PlayersPage';
import { BalanceDebugPage } from './pages/BalanceDebugPage';
import { TeamsPage } from './pages/TeamsPage';
import { GlobalConfigPage } from './pages/GlobalConfigPage';
import DatabaseDebug from './pages/DatabaseDebug';

/**
 * FASE 1.1: App principal con autenticación básica
 */
function App() {
  const { token } = useAuthStore();

  if (!token) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<ServerImagesPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/server-images" element={<ServerImagesPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/balance-debug" element={<BalanceDebugPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/global-config" element={<GlobalConfigPage />} />
        <Route path="/database-debug" element={<DatabaseDebug />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;