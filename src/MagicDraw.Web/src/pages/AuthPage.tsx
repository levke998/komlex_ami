import React, { useState } from "react";
import { login, register } from "../services/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

type Mode = "login" | "register";

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: setAuth } = useAuth();
  const navigate = useNavigate();

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp =
        mode === "login"
          ? await login({ email, password })
          : await register({ email, password, username });
      setAuth(resp);
      navigate("/draw", { replace: true });
    } catch (err: any) {
      setError(err.message || "Hiba történt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-slate-100 px-4">
      <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold">
            {mode === "login" ? "Bejelentkezés" : "Regisztráció"}
          </div>
          <p className="text-sm text-slate-400">
            Lépj be, hogy rajzolhass és mentsd a munkáid.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-200 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Felhasználónév</label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-indigo-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm text-slate-300">Email</label>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-indigo-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-300">Jelszó</label>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-indigo-500"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 font-semibold text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.01] transition-transform disabled:opacity-60"
          >
            {loading ? "Dolgozom..." : mode === "login" ? "Belépés" : "Regisztráció"}
          </button>
        </form>

        <div className="text-center text-sm text-slate-400">
          {mode === "login" ? (
            <>
              Nincs még fiókod?{" "}
              <button className="text-indigo-400 hover:text-indigo-300" onClick={toggleMode}>
                Regisztrálj
              </button>
            </>
          ) : (
            <>
              Van már fiókod?{" "}
              <button className="text-indigo-400 hover:text-indigo-300" onClick={toggleMode}>
                Jelentkezz be
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
