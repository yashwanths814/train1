"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
} from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import MainHeader from "@/components/Header";
import AppLoader from "@/components/AppLoader"; // 🔥 TRAIN LOADER

export default function ManufacturerAdminLoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true); // prevents blink

    // -------------------------------------------------------
    // AUTH CHECK (NO BLINK)
    // -------------------------------------------------------
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setChecking(false);
                return;
            }

            const snap = await getDoc(doc(db, "users", user.uid));

            if (snap.exists() && snap.data().role === "manufacturerAdmin") {
                router.replace("/manufacturer/admin/dashboard");
            } else {
                await signOut(auth);
                setChecking(false);
            }
        });

        return () => unsub();
    }, [router]);

    // -------------------------------------------------------
    // SHOW TRAIN LOADER DURING CHECKING
    // -------------------------------------------------------
    if (checking) {
        return <AppLoader />; // 🔥 TRAIN LOADER HERE
    }

    // -------------------------------------------------------
    // LOGIN HANDLER
    // -------------------------------------------------------
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setLoading(true);

        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const snap = await getDoc(doc(db, "users", cred.user.uid));

            if (!snap.exists() || snap.data().role !== "manufacturerAdmin") {
                setMsg("You are not authorised as Manufacturer Admin.");
                await signOut(auth);
                return;
            }

            router.replace("/manufacturer/admin/dashboard");
        } catch (err: any) {
            setMsg(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    // -------------------------------------------------------
    // UI
    // -------------------------------------------------------
    return (
        <div className="min-h-screen bg-[#F7E8FF] flex flex-col">
            <MainHeader />

            <main className="flex-1 flex items-start md:items-center justify-center pt-[90px] md:pt-[100px] px-4 sm:px-6">
                <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md mt-4 md:mt-0">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF] text-center mb-2">
                        Manufacturer Admin Login
                    </h1>

                    <p className="text-[11px] sm:text-xs text-gray-600 text-center mb-4">
                        Use your admin credentials provided by the railway board /
                        manufacturer HQ.
                    </p>

                    {msg && (
                        <p className="text-xs sm:text-[13px] text-center text-red-500 mb-3">
                            {msg}
                        </p>
                    )}

                    <form onSubmit={handleLogin} className="space-y-3 text-sm">
                        <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                                Admin Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-3 py-2 rounded-xl bg-[#A259FF] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#8b46e6] transition"
                        >
                            {loading ? "Checking…" : "Login as Admin"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
