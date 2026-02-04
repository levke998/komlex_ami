import React from 'react'; // <--- 1. JAVÍTÁS: React importálása
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DrawingPage } from './pages/DrawingPage';
import { AuthPage } from './pages/AuthPage';
import CommunityGallery from './CommunityGallery'; 
import MyDrawings from "./MyDrawings"; 
import './App.css';
import { useAuth } from './context/AuthContext';

// 2. JAVÍTÁS: JSX.Element helyett React.ReactNode
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/auth" replace />;
  return <>{children}</>; // <--- 3. JAVÍTÁS: Fragmentbe (<>...</>) csomagoljuk a biztonság kedvéért
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/draw" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        
        {/* VÉDETT ÚTVONALAK (Csak bejelentkezve) */}
        
        {/* 1. Rajzoló felület */}
        <Route
          path="/draw"
          element={
            <ProtectedRoute>
              <DrawingPage />
            </ProtectedRoute>
          }
        />

        {/* 2. Közösségi Galéria */}
        <Route
          path="/gallery"
          element={
            <ProtectedRoute>
              <CommunityGallery />
            </ProtectedRoute>
          }
        />

        {/* 3. Saját Galéria */}
        <Route
          path="/my-drawings"
          element={
            <ProtectedRoute>
              <MyDrawings />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;