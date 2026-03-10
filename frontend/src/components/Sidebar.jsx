import React from 'react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/policy',
    label: 'Policy',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="8" height="1.5" rx="0.75" fill="currentColor" opacity="0.6"/>
        <rect x="2" y="5.25" width="12" height="1.5" rx="0.75" fill="currentColor"/>
        <rect x="2" y="8.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
        <rect x="2" y="11.75" width="8" height="1.5" rx="0.75" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
  },
  {
    to: '/upload',
    label: 'Upload',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L8 10M8 2L5 5M8 2L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 11V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to: '/results',
    label: 'Results',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="9" width="3" height="5" rx="0.5" fill="currentColor" opacity="0.5"/>
        <rect x="6.5" y="6" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.75"/>
        <rect x="11" y="2" width="3" height="12" rx="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    to: '/audit',
    label: 'Audit',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4C2 3.44772 2.44772 3 3 3H13C13.5523 3 14 3.44772 14 4V5.5C14 6.05228 13.5523 6.5 13 6.5H3C2.44772 6.5 2 6.05228 2 5.5V4Z" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M4 6.5V13M12 6.5V13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M2 9.5H14" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M2 13H14" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 w-60 h-screen bg-[#070d1a] border-r border-white/[0.06] flex flex-col z-[100] overflow-y-auto font-mono">
      {/* Logo */}
      <div className="px-6 pt-7 pb-5 border-b border-white/[0.06] mb-2">
        <span className="inline-block text-[10px] font-medium tracking-[0.12em] uppercase text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded mb-2.5">
          INSTITUTIONAL
        </span>
        <span className="block font-['Anta',sans-serif] text-2xl text-indigo-500 tracking-wide leading-snug">
          VetoProxy
        </span>
        <span className="block text-[11px] text-gray-700 italic leading-relaxed mt-2 pt-2 border-t border-white/[0.04]">
          Investment decisions<br />governed by you
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-gray-700 px-3 pt-2 pb-1 mb-1">
          Navigation
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-md mb-0.5 no-underline text-[13.5px] transition-all duration-150 border-l-[3px] ${
                isActive
                  ? 'font-semibold text-gray-50 bg-indigo-500/10 border-indigo-500'
                  : 'font-normal text-gray-500 hover:text-gray-300 bg-transparent border-transparent'
              }`
            }
          >
            <span className="opacity-85 shrink-0">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e88] shrink-0" />
          <span>System Online</span>
        </div>
        <div className="mt-2 text-[10px] text-gray-800">v0.1.0-alpha</div>
      </div>
    </aside>
  )
}
