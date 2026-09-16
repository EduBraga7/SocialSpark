'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Show, UserButton } from '@clerk/nextjs';
import { Zap, LayoutDashboard, Menu, X } from 'lucide-react';

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Não renderiza sidebar em páginas de auth
  if (pathname?.startsWith('/login') || pathname?.startsWith('/sign')) return null;

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">SocialSpark</span>
        </Link>
        <div className="flex items-center gap-2">
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <Link
              href="/login"
              className="text-xs font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Entrar
            </Link>
          </Show>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          w-[260px] bg-white border-r border-gray-100
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">SocialSpark</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <Show when="signed-in">
            <Link
              href="#"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 group"
            >
              <LayoutDashboard size={18} className="text-blue-600" />
              Novo conteúdo
            </Link>
          </Show>
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-gray-100 pt-3 space-y-3">


          {/* User / Login */}
          <Show when="signed-in">
            <div className="flex items-center gap-3 px-3 py-2">
              <UserButton />
              <p className="text-sm font-medium text-gray-700 truncate">Minha conta</p>
            </div>
          </Show>
          <Show when="signed-out">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Entrar
            </Link>
          </Show>
        </div>
      </aside>
    </>
  );
}
