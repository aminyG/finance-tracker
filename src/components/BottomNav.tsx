// src/components/BottomNav.tsx
import { Link, useRouterState } from '@tanstack/react-router'

const navItems = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    to: '/transactions/new',
    label: 'Add',
    icon: (_active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        width="26"
        height="26"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="none" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="white"
          d="M12 8v8M8 12h8"
        />
      </svg>
    ),
  },
  {
    to: '/accounts',
    label: 'Accounts',
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
  },
  {
    to: '/import',
    label: 'Import',
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
    ),
  },
]

// Pages that should show the bottom nav
const NAV_ROUTES = [
  '/dashboard',
  '/transactions',
  '/accounts',
  '/import',
  '/categories',
]

export default function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // Only show on main pages, not on detail/form pages
  const shouldShow = NAV_ROUTES.some((route) => pathname === route)
  if (!shouldShow) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white px-2 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = pathname === item.to
          const isAdd = item.to === '/transactions/new'

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-3 transition-colors ${
                isAdd
                  ? 'relative -top-3'
                  : active
                    ? 'text-blue-500'
                    : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {item.icon(active)}
              {!isAdd && (
                <span
                  className={`text-[10px] font-medium ${active ? 'text-blue-500' : 'text-gray-400'}`}
                >
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
