import React, { useState, useEffect } from "react";
import type { AuthUser } from "../../context/AuthContext";
import { useAuth } from "../../context/AuthContext";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, token, updateUser } = useAuth();
    const [age, setAge] = useState<string>("");
    const [gender, setGender] = useState<string>("");
    const [avatarUrl, setAvatarUrl] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setAge(user.age?.toString() || "");
            setGender(user.gender || "");
            setAvatarUrl(user.profilePictureUrl || "");
        }
    }, [user, isOpen]);

    if (!isOpen || !user) return null;

    const handleSave = async () => {
        setLoading(true);
        setError("");
        try {
            const payload = {
                age: age ? parseInt(age) : null,
                gender: gender || null,
                profilePictureUrl: avatarUrl || null,
            };

            const response = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to update profile");
            }

            const updatedUser: AuthUser = await response.json();
            updateUser(updatedUser);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500 * 1024) { // 500KB limit
                setError("Image too large (max 500KB)");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[90vw] max-w-md bg-[#2b2d3e] rounded-xl shadow-2xl border border-slate-700 overflow-hidden text-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">{error}</div>}

                <div className="space-y-4">

                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-full bg-slate-700 overflow-hidden border-2 border-slate-500 relative group">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                            )}
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="text-xs font-bold text-white">Change</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        <p className="text-xs text-slate-500">Click image to upload (max 500KB)</p>
                    </div>

                    {/* Age */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Age</label>
                        <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full bg-[#1e212b] border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                            placeholder="Enter your age"
                        />
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Gender</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full bg-[#1e212b] border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none"
                        >
                            <option value="">Prefer not to say</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};
