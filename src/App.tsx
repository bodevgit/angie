import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Dates } from './pages/Dates';
import { Plans } from './pages/Plans';
import { Itinerary } from './pages/Itinerary';
import { Anniversaries } from './pages/Anniversaries';
import { Schedule } from './pages/Schedule';
import { Settings } from './pages/Settings';
import { UserProvider, useUser } from './lib/user-context';
import { DataProvider } from './lib/data-context';
import { Welcome } from './pages/Welcome';
import { Navigate, Outlet } from 'react-router-dom';
import { ReloadPrompt } from './components/ReloadPrompt';

function ProtectedLayout() {
  const { user } = useUser();
  if (!user) return <Navigate to="/welcome" />;
  return (
    <DataProvider>
      <Layout />
    </DataProvider>
  );
}

function App() {
  return (
    <UserProvider>
      <ReloadPrompt />
      <HashRouter>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route element={<ProtectedLayout />}>
            <Route index element={<Home />} />
            <Route path="dates" element={<Dates />} />
            <Route path="plans" element={<Plans />} />
            <Route path="itinerary" element={<Itinerary />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="anniversaries" element={<Anniversaries />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </UserProvider>
  );
}

export default App;
