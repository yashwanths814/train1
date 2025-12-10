"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

import MainHeader from "@/components/Header";
import ManufacturerAdminSidebar from "@/components/ManufacturerAdminSidebar";
import AppLoader from "@/components/AppLoader"; // ✅ Train Loader

// ---------- TYPES ----------
type Material = {
    id: string;
    materialId?: string;
    fittingType?: string;
    drawingNumber?: string;
    batchNumber?: string;
    purchaseOrderNumber?: string;
    manufacturingDate?: string;
    manufacturerId?: string;
    [key: string]: any;
};

export default function AdminMaterialsPage() {
    const router = useRouter();

    // --- AUTH STATE ---
    const [authStatus, setAuthStatus] =
        useState<"checking" | "allowed" | "denied">("checking");

    // --- DATA STATE ---
    const [materials, setMaterials] = useState<Material[]>([]);
    const [filterType, setFilterType] = useState("");
    const [loadingData, setLoadingData] = useState(true);

    // ============================
    // AUTH CHECK
    // ============================
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setAuthStatus("denied");
                return;
            }

            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists() && snap.data().role === "manufacturerAdmin") {
                setAuthStatus("allowed");
            } else {
                setAuthStatus("denied");
            }
        });

        return () => unsub();
    }, []);

    // ============================
    // LOAD MATERIALS (after allowed)
    // ============================
    useEffect(() => {
        if (authStatus !== "allowed") return;

        async function loadData() {
            setLoadingData(true);

            const snap = await getDocs(collection(db, "materials"));
            setMaterials(
                snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
            );

            setLoadingData(false);
        }

        loadData();
    }, [authStatus]);

    // ============================
    // FILTER DATA
    // ============================
    const filteredMaterials = useMemo(() => {
        return materials.filter((m) =>
            filterType ? m.fittingType === filterType : true
        );
    }, [materials, filterType]);

    // ============================
    // LOADING & ACCESS STATES
    // ============================

    // 🔥 AUTH CHECKING → Show Train Loader
    if (authStatus === "checking") return <AppLoader />;

    // ❌ NOT ADMIN → redirect
    if (authStatus === "denied") {
        router.replace("/manufacturer/admin-login");
        return null;
    }

    // 🔥 DATA LOADING → Show Train Loader
    if (loadingData) return <AppLoader />;

    // ============================
    // PAGE CONTENT
    // ============================
    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            {/* Layout: stacked on mobile, sidebar + main on md+ */}
            <div className="flex flex-col md:flex-row pt-[80px] md:pt-[90px]">
                {/* Sidebar: full width on mobile, fixed width on desktop */}
                <div className="w-full md:w-64 md:flex-shrink-0">
                    <ManufacturerAdminSidebar />
                </div>

                {/* Main content */}
                <main className="w-full md:ml-64 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-10">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF] mb-2">
                        All Materials – Admin View
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 mb-6">
                        View all materials manufactured across companies.
                    </p>

                    {/* FILTER */}
                    <div className="mb-4">
                        <label className="block text-[11px] text-gray-500 mb-1">
                            Filter by Material Type
                        </label>
                        <select
                            className="w-full sm:w-64 border px-3 py-2 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="Elastic Rail Clip">Elastic Rail Clip</option>
                            <option value="Rail Pad">Rail Pad</option>
                            <option value="Liner">Liner</option>
                            <option value="Sleeper">Sleeper</option>
                        </select>
                    </div>

                    {/* TABLE */}
                    <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-5">
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                                        <th className="py-2 px-2 text-left">Material ID</th>
                                        <th className="py-2 px-2 text-left">Type</th>
                                        <th className="py-2 px-2 text-left">Drawing</th>
                                        <th className="py-2 px-2 text-left">Batch</th>
                                        <th className="py-2 px-2 text-left">PO No</th>
                                        <th className="py-2 px-2 text-left">Mfg Date</th>
                                        <th className="py-2 px-2 text-left">Manufacturer</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredMaterials.map((m) => (
                                        <tr
                                            key={m.id}
                                            className="border-t hover:bg-gray-50/60"
                                        >
                                            <td className="py-2 px-2 font-mono text-[11px] break-all">
                                                {m.materialId || "—"}
                                            </td>
                                            <td className="py-2 px-2">
                                                {m.fittingType || "—"}
                                            </td>
                                            <td className="py-2 px-2">
                                                {m.drawingNumber || "—"}
                                            </td>
                                            <td className="py-2 px-2">
                                                {m.batchNumber || "—"}
                                            </td>
                                            <td className="py-2 px-2">
                                                {m.purchaseOrderNumber || "—"}
                                            </td>
                                            <td className="py-2 px-2">
                                                {m.manufacturingDate || "—"}
                                            </td>
                                            <td className="py-2 px-2">
                                                {m.manufacturerId || "—"}
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredMaterials.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-4 px-2 text-center text-[11px] text-gray-500"
                                            >
                                                No materials found for this filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
