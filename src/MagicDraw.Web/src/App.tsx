import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DrawingPage } from "./pages/DrawingPage"; 

// ✅ Csak a MyDrawings-t importáljuk, a GalleryPage-et TÖRÖLJÜK
import MyDrawings from "./MyDrawings"; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Főoldal: Rajzvászon */}
          <Route path="/" element={<DrawingPage />} />

          {/* Galéria oldal: Saját rajzok */}
          <Route path="/gallery" element={<MyDrawings />} />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;