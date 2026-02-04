import { useEffect, useState } from 'react';

interface Drawing {
    id: string; // Fontos: a C# Guid stringként jön át
    title: string;
    imageUrl: string;
    authorName: string;
    createdAt: string;
}

function MyDrawings() {
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Rajzok betöltése
    useEffect(() => {
        fetchDrawings();
    }, []);

    const fetchDrawings = () => {
        fetch('/api/drawings')
            .then(response => {
                if (response.status === 401) throw new Error('Nem vagy bejelentkezve!');
                if (!response.ok) throw new Error('Hiba a betöltéskor.');
                return response.json();
            })
            .then(data => {
                setDrawings(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    };

    // TÖRLÉS FUNKCIÓ 🗑️
    const handleDelete = async (id: string) => {
        if (!window.confirm('Biztosan törölni szeretnéd ezt a rajzot?')) return;

        try {
            const response = await fetch(`/api/drawings/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Ha sikerült törölni a szerverről, kivesszük a listából is
                setDrawings(prev => prev.filter(d => d.id !== id));
            } else {
                alert('Nem sikerült a törlés.');
            }
        } catch (error) {
            console.error("Törlési hiba:", error);
            alert('Hiba történt.');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>📂 Saját Galériám</h1>
                <a href="/" style={{ textDecoration: 'none', padding: '10px 20px', backgroundColor: '#646cff', color: 'white', borderRadius: '5px' }}>
                    ✏️ Vissza a rajzoláshoz
                </a>
            </div>

            {loading && <p>Betöltés...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && drawings.length === 0 && (
                <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f9f9f9', borderRadius: '10px' }}>
                    <h3>Még nincs elmentett rajzod.</h3>
                    <p>Menj vissza és alkoss valamit!</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                {drawings.map((drawing) => (
                    <div key={drawing.id} style={{ 
                        border: '1px solid #ddd', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s',
                        backgroundColor: 'white'
                    }}>
                        {/* A Kép */}
                        <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#eee' }}>
                            <img src={drawing.imageUrl} alt={drawing.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>

                        {/* Adatok és Gombok */}
                        <div style={{ padding: '15px' }}>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#333' }}>{drawing.title || "Névtelen remekmű"}</h3>
                            <p style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>
                                {new Date(drawing.createdAt).toLocaleDateString()}
                            </p>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {/* Törlés Gomb */}
                                <button 
                                    onClick={() => handleDelete(drawing.id)}
                                    style={{ 
                                        flex: 1, 
                                        padding: '8px', 
                                        backgroundColor: '#ff4d4f', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '5px', 
                                        cursor: 'pointer' 
                                    }}>
                                    🗑️ Törlés
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MyDrawings;