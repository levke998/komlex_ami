import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyDrawings } from "../services/drawings"; 
import { useAuth } from "../context/AuthContext"; 

export default function GalleryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [drawings, setDrawings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getMyDrawings(token)
      .then(setDrawings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-[#1e212b] text-white p-8 font-sans">
      {/* Fejléc */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <span className="text-3xl">🎨</span>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Galériám
            </h1>
        </div>
        <button 
          onClick={() => navigate("/")}
          className="px-4 py-2 transition bg-gray-700 rounded-lg hover:bg-gray-600"
        >
          ← Vissza a Rajzoláshoz
        </button>
      </div>

      {/* Tartalom */}
      {loading ? (
        <div className="mt-20 text-center text-gray-400 animate-pulse">Rajzok betöltése...</div>
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
              onClick={() => navigate(`/?load=${d.id}`)} // Visszavisz a főoldalra és betölti
              className="relative overflow-hidden transition shadow-lg cursor-pointer group bg-slate-800 rounded-xl hover:ring-2 hover:ring-purple-500 hover:-translate-y-1"
            >
              {/* Kártya képe (Placeholder ikonnal) */}
              <div className="relative flex items-center justify-center h-48 bg-slate-700/50">
                 <span className="text-5xl transition-all duration-300 opacity-50 grayscale group-hover:grayscale-0 group-hover:scale-110">🖼️</span>
                 
                 {/* Hibrid állapot jelző (Zöld pötty = Van adat a gépen) */}
                 {d.hasLocalData ? (
                    <div className="absolute px-2 py-1 text-xs font-bold text-white bg-green-600 rounded-bl-lg shadow-sm top-2 right-2" title="Megnyitható ezen a gépen">
                        Helyi adat ✅
                    </div>
                 ) : (
                    <div className="absolute px-2 py-1 text-xs font-bold text-white bg-gray-500 rounded-bl-lg top-2 right-2 opacity-70" title="Csak felhő adat (kép nélkül)">
                        ☁️ Felhő
                    </div>
                 )}
              </div>
              
              <div className="p-4 border-t border-slate-700">
                <h3 className="text-lg font-bold truncate text-slate-200">{d.title || "Névtelen alkotás"}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(d.createdAt).toLocaleDateString('hu-HU')} • {new Date(d.createdAt).toLocaleTimeString('hu-HU', {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}