"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
} from "firebase/firestore";

import MainHeader from "@/components/Header";
import ManufacturerAdminSidebar from "@/components/ManufacturerAdminSidebar";
import AppLoader from "@/components/AppLoader"; // 🚆 Train Loader

// --------- TYPES ---------
type Employee = {
    uid: string;
    name?: string;
    empId?: string;
    email?: string;
    companyId?: string;
    companyName?: string;
    role?: string;
};

type Material = {
    id: string;
    materialId?: string;
    fittingType?: string;
    drawingNumber?: string;
    batchNumber?: string;
    manufacturingDate?: string; // YYYY-MM-DD
    manufacturerId?: string;
    createdBy?: string; // employee uid
};

type EmployeeRow = Employee & {
    total: number;
    lastDate: string;
};

export default function ManufacturerAdminEmployeesPage() {
    const router = useRouter();

    // AUTH STATES
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // DATA
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");

    // -----------------------------------------------------------
    // AUTH CHECK
    // -----------------------------------------------------------
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setCheckingAuth(false);
                setIsAdmin(false);
                router.replace("/manufacturer/admin-login");
                return;
            }

            const ref = doc(db, "users", user.uid);
            const snap = await getDoc(ref);

            if (snap.exists() && snap.data().role === "manufacturerAdmin") {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
                router.replace("/manufacturer/admin-login");
            }

            setCheckingAuth(false);
        });

        return () => unsub();
    }, [router]);

    // -----------------------------------------------------------
    // LOADING EMPLOYEES + MATERIALS
    // -----------------------------------------------------------
    useEffect(() => {
        if (!isAdmin) return;

        async function loadData() {
            setLoading(true);

            const empSnap = await getDocs(
                query(collection(db, "users"), where("role", "==", "manufacturer"))
            );
            const empList: Employee[] = empSnap.docs.map((d) => ({
                uid: d.id,
                ...(d.data() as any),
            }));
            setEmployees(empList);

            const matSnap = await getDocs(collection(db, "materials"));
            const matList: Material[] = matSnap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as any),
            }));
            setMaterials(matList);

            setLoading(false);
        }

        loadData();
    }, [isAdmin]);

    // -----------------------------------------------------------
    // EMPLOYEE STATS
    // -----------------------------------------------------------
    const employeeRows: EmployeeRow[] = employees.map((emp) => {
        // 🔧 Use `createdBy` to link materials to employees (per-employee work)
        const mats = materials.filter((m) => m.createdBy === emp.uid);

        const lastDate =
            mats.length > 0
                ? [...mats]
                      .map((m) => m.manufacturingDate || "")
                      .filter(Boolean)
                      .sort()
                      .reverse()[0] || "-"
                : "-";

        return {
            ...emp,
            total: mats.length,
            lastDate,
        };
    });

    // -----------------------------------------------------------
    // FILTER EMPLOYEES
    // -----------------------------------------------------------
    const filtered = employeeRows.filter((e) => {
        const s = search.toLowerCase();
        if (!s) return true;

        return (
            e.name?.toLowerCase().includes(s) ||
            e.empId?.toLowerCase().includes(s) ||
            e.email?.toLowerCase().includes(s)
        );
    });

    // -----------------------------------------------------------
    // LOADERS
    // -----------------------------------------------------------
    if (checkingAuth) return <AppLoader />; // 🚆 Train loader for auth
    if (!isAdmin) return null;
    if (loading) return <AppLoader />; // 🚆 Train loader for data

    // -----------------------------------------------------------
    // UI
    // -----------------------------------------------------------
    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            {/* Main layout: column on mobile, row on desktop */}
            <div className="flex flex-col md:flex-row pt-[80px] md:pt-[90px]">
                {/* Sidebar: full width on mobile, fixed width on desktop */}
                <div className="w-full md:w-64 md:flex-shrink-0">
                    <ManufacturerAdminSidebar />
                </div>

                {/* Main content */}
                <main className="w-full md:ml-64 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-10">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF]">
                        Employees
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 mb-6">
                        All Manufacturer Employees
                    </p>

                    {/* Search */}
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search employee by name / emp ID / email"
                        className="w-full sm:w-72 mb-4 border px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#A259FF]/40 bg-white"
                    />

                    <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-5">
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                                        <th className="py-2 px-2 text-left">Name</th>
                                        <th className="py-2 px-2 text-left">Emp ID</th>
                                        <th className="py-2 px-2 text-left">Email</th>
                                        <th className="py-2 px-2 text-left">
                                            Total Materials
                                        </th>
                                        <th className="py-2 px-2 text-left">
                                            Last Mfg Date
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filtered.map((emp) => (
                                        <tr
                                            key={emp.uid}
                                            className="border-t hover:bg-gray-50/60"
                                        >
                                            <td className="py-2 px-2">{emp.name || "-"}</td>
                                            <td className="py-2 px-2">{emp.empId || "-"}</td>
                                            <td className="py-2 px-2 break-all">
                                                {emp.email || "-"}
                                            </td>
                                            <td className="py-2 px-2">{emp.total}</td>
                                            <td className="py-2 px-2">{emp.lastDate}</td>
                                        </tr>
                                    ))}

                                    {filtered.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="py-4 px-2 text-center text-[11px] text-gray-500"
                                            >
                                                No employees match this search.
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
