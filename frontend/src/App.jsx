import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import useAppStore from './store/useAppStore';

function App() {
  const { initTheme } = useAppStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
