import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DrawingPage } from './pages/DrawingPage';
import { AuthPage } from './pages/AuthPage';
import './App.css';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/draw" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/draw"
          element={
            <ProtectedRoute>
              <DrawingPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
