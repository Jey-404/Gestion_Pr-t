import { ArrowLeft } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import MembreHeader from "./MembreHeader";

export default function MembreLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <MembreHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        
        <Outlet />
      </main>
    </div>
  );
}
