'use client'

import { useState } from 'react'
import { useAuth } from '@/components/agent-os/auth-guard'
import { LogOut, ChevronDown } from 'lucide-react'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const userInitials = user?.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username
      ? user.username.slice(0, 2).toUpperCase()
      : 'U'

  return (
    <div className="relative ml-1.5 hidden sm:block">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-[#1e1f2b] transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <span className="text-[10px] font-bold text-emerald-400">{userInitials}</span>
        </div>
        <ChevronDown className="w-3 h-3 text-[#6b7280]" />
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg shadow-xl z-50 py-1">
            <div className="px-3 py-2 border-b border-[#2d2e3d]">
              <p className="text-xs font-medium text-white truncate">{user?.displayName || user?.username || 'User'}</p>
              <p className="text-[10px] text-[#6b7280] truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-[#252636] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  )
}
