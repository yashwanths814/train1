"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";

export default function DepotSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/depot/login"); // Redirect to depot login
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const links = [
    { label: "Dashboard", href: "/depot", icon: "🏛️" },
    { label: "Scan Material", href: "/depot/scan", icon: "📷" },
    { label: "Requests", href: "/depot/requests", icon: "📝" },
    { label: "Profile", href: "/depot/profile", icon: "👤" },
  ];

  return (
    <aside
      className="
        fixed inset-y-0 left-0 
        w-64 max-w-[80vw] 
        bg-white/80 backdrop-blur-xl 
        border-r border-gray-200 
        shadow-lg z-40
        flex flex-col
      "
    >
      {/* Header */}
      <div className="h-[64px] flex items-center justify-center border-b border-gray-200 px-3">
        <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-[#A259FF] tracking-wide text-center">
          DEPOT OFFICER
        </h1>
      </div>

      {/* Nav Links */}
      <nav className="px-3 sm:px-4 py-4 space-y-2 flex-1 overflow-y-auto">
        {links.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/depot" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all
                ${
                  active
                    ? "bg-[#A259FF] text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: Depot info + actions */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-gray-100 space-y-2">
        {/* Depot info */}
        <div className="p-2.5 sm:p-3 bg-[#F7E8FF] rounded-lg border border-purple-100">
          <p className="text-[11px] sm:text-xs text-gray-600 font-medium">
            Depot Portal
          </p>
          <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">
            Authorized access only
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="
            flex items-center justify-center gap-2 
            w-full px-3 py-2.5 sm:px-4 sm:py-3 
            rounded-xl 
            bg-red-50 text-red-600 hover:bg-red-100 
            font-medium text-xs sm:text-sm 
            transition-colors
          "
        >
          <span className="text-lg">🚪</span>
          <span>Logout</span>
        </button>

        {/* Back to Home */}
        <Link
          href="/"
          className="
            flex items-center justify-center gap-2 
            w-full mt-1 
            px-3 py-2 sm:px-4 sm:py-2.5 
            rounded-xl 
            bg-gray-50 text-gray-600 hover:bg-gray-100 
            font-medium text-[11px] sm:text-xs 
            transition-colors
          "
        >
          <span>🏠</span>
          <span className="truncate">Back to Home</span>
        </Link>
      </div>
    </aside>
  );
}
