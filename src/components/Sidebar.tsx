'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiTv,
  FiFilm,
  FiGrid,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiPieChart,
  FiUpload,
  FiList,
  FiKey,
  FiBell,
} from 'react-icons/fi';
import { useState } from 'react';
import { useAuthStore } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/dashboard/activation', label: 'Activation Codes', icon: FiKey },
  { href: '/dashboard/channels', label: 'Channels', icon: FiTv },
  { href: '/dashboard/movies', label: 'Movies', icon: FiFilm },
  { href: '/dashboard/series', label: 'Series', icon: FiList },
  { href: '/dashboard/categories', label: 'Categories', icon: FiGrid },
  { href: '/dashboard/users', label: 'Users', icon: FiUsers },
  { href: '/dashboard/notifications', label: 'Notifications', icon: FiBell },
  { href: '/dashboard/import', label: 'Import', icon: FiUpload },
  { href: '/dashboard/settings', label: 'Settings', icon: FiSettings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/control-panel-access');
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-dark-300">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <FiTv className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">BathTV</span>
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:bg-dark-300 hover:text-white'
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-dark-300">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{user?.username}</p>
            <p className="text-gray-400 text-sm truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors mt-2"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dark-200 rounded-lg text-white"
      >
        {isMobileOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-dark-200 border-r border-dark-300 flex flex-col transition-transform lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
