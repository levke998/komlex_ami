import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DrawingPage } from './pages/DrawingPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/draw" replace />} />
        <Route path="/draw" element={<DrawingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
