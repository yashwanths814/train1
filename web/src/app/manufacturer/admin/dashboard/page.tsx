"use client";

import { useEffect, useState, useMemo } from "react";
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
import AppLoader from "@/components/AppLoader";

// Recharts
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

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
    manufacturerId?: string; // companyId
    createdBy?: string; // employee uid
};

type CompanyGroup = {
    companyId: string;
    companyName: string;
    employees: Employee[];
    materials: Material[];
};

const PIE_COLORS = ["#A259FF", "#FF9F1C", "#2EC4B6", "#FF6B6B"];

export default function ManufacturerAdminDashboard() {
    const router = useRouter();

    const [authChecking, setAuthChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // expands companies
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    // global analytics filters
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [materialTypeFilter, setMaterialTypeFilter] = useState("");

    // ---------------- AUTH CHECK ----------------
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setIsAdmin(false);
                setAuthChecking(false);
                return;
            }

            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists() && snap.data().role === "manufacturerAdmin") {
                setIsAdmin(true);
            }

            setAuthChecking(false);
        });

        return () => unsub();
    }, []);

    // ---------------- LOAD DATA ----------------
    useEffect(() => {
        if (!isAdmin) return;

        async function loadAll() {
            setLoadingData(true);

            // load manufacturer employees
            const empSnap = await getDocs(
                query(collection(db, "users"), where("role", "==", "manufacturer"))
            );
            setEmployees(
                empSnap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }))
            );

            // load materials
            const matSnap = await getDocs(collection(db, "materials"));
            setMaterials(
                matSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
            );

            setLoadingData(false);
        }

        loadAll();
    }, [isAdmin]);

    // ---------------- GROUP BY COMPANY ----------------
    const companies: CompanyGroup[] = useMemo(() => {
        const groups = new Map<string, CompanyGroup>();

        employees.forEach((emp) => {
            const cid = emp.companyId || "UNKNOWN";
            if (!groups.has(cid)) {
                groups.set(cid, {
                    companyId: cid,
                    companyName: emp.companyName || cid,
                    employees: [],
                    materials: [],
                });
            }
            groups.get(cid)!.employees.push(emp);
        });

        materials.forEach((mat) => {
            const cid = mat.manufacturerId || "UNKNOWN";
            const g = groups.get(cid);
            if (g) g.materials.push(mat);
        });

        return [...groups.values()].sort((a, b) =>
            a.companyName.localeCompare(b.companyName)
        );
    }, [employees, materials]);

    // ---------------- FILTER HELPERS ----------------
    function matchesDateRange(dateStr?: string) {
        if (!dateStr) return false;
        const d = new Date(dateStr);

        if (fromDate) {
            const f = new Date(fromDate);
            if (d < f) return false;
        }
        if (toDate) {
            const t = new Date(toDate);
            t.setHours(23, 59, 59, 999);
            if (d > t) return false;
        }
        return true;
    }

    function toggleCompany(id: string) {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    if (authChecking) return <AppLoader />;

    if (!isAdmin) {
        router.replace("/manufacturer/admin-login");
        return null;
    }

    if (loadingData) return <AppLoader />;

    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            {/* Main layout: stacked on mobile, sidebar + content on md+ */}
            <div className="flex flex-col md:flex-row pt-[80px] md:pt-[90px]">
                {/* Sidebar: full width on mobile, fixed-width on desktop (handled by component styling) */}
                <div className="w-full md:w-64 md:flex-shrink-0">
                    <ManufacturerAdminSidebar />
                </div>

                {/* Main content */}
                <main className="w-full md:ml-64 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-10">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF] mb-2">
                        Admin Dashboard — Companies Overview
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 mb-6">
                        Track manufacturer companies, production, and employee efficiency.
                    </p>

                    {/* ---------- GLOBAL FILTERS ---------- */}
                    <div className="bg-white rounded-3xl shadow-md p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-end">
                        <div className="w-full md:w-auto">
                            <label className="block text-[11px] text-gray-500 mb-1">
                                From Manufacturing Date
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full md:w-auto text-xs px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                            />
                        </div>

                        <div className="w-full md:w-auto">
                            <label className="block text-[11px] text-gray-500 mb-1">
                                To Manufacturing Date
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full md:w-auto text-xs px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                            />
                        </div>

                        <div className="w-full md:w-auto">
                            <label className="block text-[11px] text-gray-500 mb-1">
                                Material Type
                            </label>
                            <select
                                value={materialTypeFilter}
                                onChange={(e) => setMaterialTypeFilter(e.target.value)}
                                className="w-full md:w-auto text-xs px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#A259FF]/40 bg-white"
                            >
                                <option value="">All Types</option>
                                <option value="Elastic Rail Clip">Elastic Rail Clip</option>
                                <option value="Rail Pad">Rail Pad</option>
                                <option value="Liner">Liner</option>
                                <option value="Sleeper">Sleeper</option>
                            </select>
                        </div>

                        <button
                            onClick={() => {
                                setFromDate("");
                                setToDate("");
                                setMaterialTypeFilter("");
                            }}
                            className="text-xs px-4 py-2 rounded-xl bg-[#4B3A7A] text-white font-semibold hover:bg-[#3b2f63] transition mt-1 md:mt-0"
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* ---------- NO COMPANIES ---------- */}
                    {companies.length === 0 && (
                        <p className="text-sm text-gray-500">
                            No manufacturer companies found.
                        </p>
                    )}

                    {/* ---------- COMPANY LOOP ---------- */}
                    {companies.map((company) => {
                        const filteredMaterials = company.materials.filter((m) => {
                            if (!m.manufacturingDate) return false;

                            if (fromDate || toDate) {
                                if (!matchesDateRange(m.manufacturingDate)) return false;
                            }

                            if (materialTypeFilter && m.fittingType !== materialTypeFilter)
                                return false;

                            return true;
                        });

                        const totalEmployees = company.employees.length;
                        const totalMaterials = company.materials.length;

                        const now = new Date();
                        const ymPrefix = `${now.getFullYear()}-${String(
                            now.getMonth() + 1
                        ).padStart(2, "0")}`;

                        const totalThisMonth = company.materials.filter((m) =>
                            m.manufacturingDate?.startsWith(ymPrefix)
                        ).length;

                        const isOpen = expanded[company.companyId] ?? false;

                        // Chart datasets
                        const monthlySeries = buildMonthlySeries(filteredMaterials);
                        const pieData = buildTypeDistribution(filteredMaterials);
                        const employeeEfficiency = buildEmployeeEfficiency(
                            company.employees,
                            filteredMaterials
                        );

                        return (
                            <div
                                key={company.companyId}
                                className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 mb-8"
                            >
                                {/* ---------- HEADER + TOGGLE ---------- */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-[#6B4FA3]">
                                            {company.companyName}
                                        </h2>
                                        <p className="text-[11px] text-gray-500">
                                            Company ID:{" "}
                                            <span className="font-mono break-all">
                                                {company.companyId}
                                            </span>
                                        </p>

                                        {(fromDate || toDate || materialTypeFilter) && (
                                            <p className="text-[10px] text-emerald-600 mt-1">
                                                Showing filtered analytics &amp; tables.
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => toggleCompany(company.companyId)}
                                        className="self-start sm:self-auto px-3 py-1 rounded-xl text-xs font-semibold bg-[#F2E6FF] 
                                        text-[#6B4FA3] hover:bg-[#E3D2FF] transition"
                                    >
                                        {isOpen ? "Hide Details ▲" : "Show Details ▼"}
                                    </button>
                                </div>

                                {/* ---------- SUMMARY CARDS ---------- */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                                    <SummaryCard
                                        label="Employees"
                                        value={totalEmployees}
                                        color="#A259FF"
                                    />
                                    <SummaryCard
                                        label="Total Materials"
                                        value={totalMaterials}
                                        color="#FF8A00"
                                    />
                                    <SummaryCard
                                        label="This Month"
                                        value={totalThisMonth}
                                        color="#00C47A"
                                    />
                                </div>

                                {/* ---------- ANALYTICS GRAPHS ---------- */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                                    {/* Line Chart: Monthly Production */}
                                    <div className="bg-[#F7E8FF] rounded-2xl p-3">
                                        <h3 className="text-[12px] font-semibold text-[#6B4FA3] mb-2">
                                            Monthly Production
                                        </h3>

                                        {monthlySeries.length === 0 ? (
                                            <p className="text-[11px] text-gray-500">
                                                No production data for this filter.
                                            </p>
                                        ) : (
                                            <div className="w-full h-52 sm:h-56">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={monthlySeries}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="month" fontSize={10} />
                                                        <YAxis fontSize={10} />
                                                        <Tooltip />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="count"
                                                            stroke="#A259FF"
                                                            strokeWidth={2}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pie Chart: Material Type Distribution */}
                                    <div className="bg-[#F7E8FF] rounded-2xl p-3">
                                        <h3 className="text-[12px] font-semibold text-[#6B4FA3] mb-2">
                                            Material Type Distribution
                                        </h3>

                                        {pieData.length === 0 ? (
                                            <p className="text-[11px] text-gray-500">
                                                No data available.
                                            </p>
                                        ) : (
                                            <div className="w-full h-52 sm:h-56">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={pieData}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={60}
                                                            label
                                                        >
                                                            {pieData.map((_, i) => (
                                                                <Cell
                                                                    key={i}
                                                                    fill={
                                                                        PIE_COLORS[
                                                                            i % PIE_COLORS.length
                                                                        ]
                                                                    }
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bar Chart: Employee Efficiency */}
                                    <div className="bg-[#F7E8FF] rounded-2xl p-3">
                                        <h3 className="text-[12px] font-semibold text-[#6B4FA3] mb-2">
                                            Employee Efficiency
                                        </h3>

                                        {employeeEfficiency.length === 0 ? (
                                            <p className="text-[11px] text-gray-500">
                                                No employee work found in this filter.
                                            </p>
                                        ) : (
                                            <div className="w-full h-52 sm:h-56">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={employeeEfficiency}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" fontSize={10} />
                                                        <YAxis fontSize={10} />
                                                        <Tooltip />
                                                        <Bar
                                                            dataKey="count"
                                                            fill="#6B4FA3"
                                                            radius={[4, 4, 0, 0]}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ---------- COLLAPSIBLE DETAIL SECTION ---------- */}
                                {isOpen && (
                                    <div className="mt-4 space-y-6">
                                        {/* ---------- EMPLOYEE TABLE ---------- */}
                                        <div>
                                            <h3 className="text-sm font-semibold mb-2">
                                                Employees &amp; Work Summary (Filtered)
                                            </h3>

                                            <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                                                            <th className="py-2 px-2 text-left">
                                                                Name
                                                            </th>
                                                            <th className="py-2 px-2 text-left">
                                                                Emp ID
                                                            </th>
                                                            <th className="py-2 px-2 text-left">
                                                                Email
                                                            </th>
                                                            <th className="py-2 px-2 text-left">
                                                                Materials
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {company.employees.map((emp) => {
                                                            const count = filteredMaterials.filter(
                                                                (m) => m.createdBy === emp.uid
                                                            ).length;

                                                            return (
                                                                <tr
                                                                    className="border-t hover:bg-gray-50/60"
                                                                    key={emp.uid}
                                                                >
                                                                    <td className="py-2 px-2">
                                                                        {emp.name || "-"}
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        {emp.empId || "-"}
                                                                    </td>
                                                                    <td className="py-2 px-2 break-all">
                                                                        {emp.email || "-"}
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        {count}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* ---------- MATERIAL TABLE ---------- */}
                                        <div>
                                            <h3 className="text-sm font-semibold mb-2">
                                                Materials (Filtered)
                                            </h3>

                                            <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                                                            <th className="py-2 px-2 text-left">
                                                                Material ID
                                                            </th>
                                                            <th className="py-2 px-2 text-left">
                                                                Type
                                                            </th>
                                                            <th className="py-2 px-2 text-left">
                                                                Drawing
                                                            </th>
                                                            <th className="py-2 px-2 text-left">
                                                                Batch
                                                            </th>
                                                            <th className="py-2 px-2 text-left">
                                                                Manufacturing Date
                                                            </th>
                                                            <th className="py-2 px-2 text-left">
                                                                Created By
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {filteredMaterials.map((m) => {
                                                            const emp = company.employees.find(
                                                                (e) => e.uid === m.createdBy
                                                            );

                                                            return (
                                                                <tr
                                                                    key={m.id}
                                                                    className="border-t hover:bg-gray-50/60"
                                                                >
                                                                    <td className="py-2 px-2 font-mono text-[11px] break-all">
                                                                        {m.materialId || "-"}
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        {m.fittingType || "-"}
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        {m.drawingNumber || "-"}
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        {m.batchNumber || "-"}
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        {m.manufacturingDate || "-"}
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        {emp
                                                                            ? emp.name ||
                                                                              emp.empId ||
                                                                              emp.email
                                                                            : "Unknown"}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </main>
            </div>
        </div>
    );
}

/* ============================================================
    🔹 HELPER FUNCTIONS FOR CHARTS
============================================================ */

function buildMonthlySeries(materials: Material[]) {
    const buckets: Record<string, number> = {};

    materials.forEach((m) => {
        if (!m.manufacturingDate) return;

        const month = m.manufacturingDate.slice(0, 7); // YYYY-MM
        buckets[month] = (buckets[month] || 0) + 1;
    });

    return Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));
}

function buildTypeDistribution(materials: Material[]) {
    const buckets: Record<string, number> = {};

    materials.forEach((m) => {
        const type = m.fittingType || "Unknown";
        buckets[type] = (buckets[type] || 0) + 1;
    });

    return Object.entries(buckets).map(([name, value]) => ({
        name,
        value,
    }));
}

function buildEmployeeEfficiency(employees: Employee[], materials: Material[]) {
    const workMap: Record<string, number> = {};

    materials.forEach((m) => {
        if (!m.createdBy) return;
        workMap[m.createdBy] = (workMap[m.createdBy] || 0) + 1;
    });

    return employees
        .map((emp) => ({
            name: emp.name || emp.empId || emp.email || "Unknown",
            count: workMap[emp.uid] || 0,
        }))
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count);
}

/* ============================================================
    🔹 SUMMARY CARD COMPONENT
============================================================ */

function SummaryCard({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div
            className="bg-white rounded-3xl shadow-lg px-4 sm:px-5 py-3 sm:py-4"
            style={{ borderTop: `4px solid ${color}` }}
        >
            <p className="text-[11px] text-gray-500">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold">{value}</p>
        </div>
    );
}
