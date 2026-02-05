import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Mivel ez a fájl az 'src' mappában van, a pontok száma fontos!
import { getMyDrawings } from "./services/drawings"; 
import { useAuth } from "./context/AuthContext"; 

export default function CommunityGallery() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [drawings, setDrawings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    
    getMyDrawings(token)
      .then(setDrawings)
      .catch((err: any) => setError(err.message || "Ismeretlen hiba"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-[#1e212b] text-white p-8 font-sans relative">
      
      {/* 🔙 VISSZALÉPÉS GOMB */}
      <button 
        onClick={() => navigate("/")}
        className="absolute z-50 flex items-center gap-2 px-4 py-2 text-white transition-all rounded-full shadow-lg top-4 left-4 bg-slate-700 hover:bg-slate-600 hover:scale-105"
        title="Vissza a főoldalra"
      >
        <span>⬅️</span> Vissza
      </button>

      {/* Címsor */}
      <div className="flex flex-col items-center mt-12 mb-8">
        <span className="mb-2 text-4xl">🎨</span>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
           Saját Galériám
        </h1>
        <p className="mt-2 text-sm text-gray-400">Itt találod az elmentett rajzaidat</p>
      </div>

      {/* Tartalom */}
      {loading ? (
        <div className="mt-20 text-center text-gray-400 animate-pulse">Betöltés...</div>
      ) : error ? (
        <div className="mt-10 text-center text-red-400">Hiba történt: {error}</div>
      ) : drawings.length === 0 ? (
        <div className="mt-20 text-center text-gray-500">
            <p className="text-xl">Még nincsenek elmentett rajzaid.</p>
            <button onClick={() => navigate("/")} className="mt-4 text-blue-400 hover:underline">Készítsünk egyet!</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {drawings.map((d) => (
            <div 
              key={d.id}
              onClick={() => navigate(`/?load=${d.id}`)} 
              className="relative overflow-hidden transition shadow-lg cursor-pointer group bg-slate-800 rounded-xl hover:ring-2 hover:ring-purple-500 hover:-translate-y-1"
            >
              <div className="relative flex items-center justify-center h-48 bg-slate-700/50">
                 <span className="text-5xl transition-all duration-300 opacity-50 grayscale group-hover:grayscale-0 group-hover:scale-110">🖼️</span>
                 {d.hasLocalData ? (
                    <div className="absolute px-2 py-1 text-xs font-bold text-white bg-green-600 rounded-bl-lg shadow-sm top-2 right-2">Helyi adat ✅</div>
                 ) : (
                    <div className="absolute px-2 py-1 text-xs font-bold text-white bg-gray-500 rounded-bl-lg top-2 right-2 opacity-70">☁️ Felhő</div>
                 )}
              </div>
              <div className="p-4 border-t border-slate-700">
                <h3 className="text-lg font-bold truncate text-slate-200">{d.title || "Névtelen"}</h3>
                <p className="mt-1 text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}