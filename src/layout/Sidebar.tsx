import { useState, useEffect, useRef } from 'react'
import { LayoutDashboard, FolderOpen, CheckSquare, Users, Bell, RotateCcw, Settings, Menu, X, Link } from 'lucide-react'
import { SproutIcon } from '../components/SproutIcon'
import { useNotifications } from '../features/notifications/useNotifications'
import { supabase } from '../lib/supabase'
import { listAcquaintanceRequests } from '../features/acquaintances/acquaintanceApi'
import './Layout.css'
import type { AppView, AppViewNavItem } from '../views/viewTypes'

type SidebarProps = {
  activeView: AppView
  onViewChange: (view: AppView) => void
  viewItems: AppViewNavItem[]
}

const navIcons: Record<AppView, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  folders: FolderOpen,
  tasks: CheckSquare,
  acquaintances: Users,
  notifications: Bell,
  restore: RotateCcw,
  settings: Settings,
  invite: Link,
}

export function Sidebar({
  activeView,
  onViewChange,
  viewItems,
}: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const mobileMenuCloseTimerRef = useRef<number | null>(null)
  
  const { unreadCount } = useNotifications()

  useEffect(() => {
    async function loadRequests() {
      if (!supabase) return
      try {
        const requests = await listAcquaintanceRequests(supabase)
        const pending = requests.filter((r) => r.direction === 'incoming').length
        setPendingRequestsCount(pending)
      } catch (err) {
        console.error('Failed to load acquaintance requests', err)
      }
    }
    
    void loadRequests()

    if (!supabase) return
    const channel = supabase.channel('sidebar-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acquaintance_requests' }, () => {
        void loadRequests()
      })
      .subscribe()
      
    return () => {
      if (supabase) void supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (mobileMenuCloseTimerRef.current) {
        window.clearTimeout(mobileMenuCloseTimerRef.current)
      }
    }
  }, [])

  const mobileTabs = ['dashboard', 'folders', 'tasks']
  const primaryMobileItems = viewItems.filter((item) => mobileTabs.includes(item.id))

  const workspaceItems = viewItems.filter((item) => ['dashboard', 'folders', 'tasks', 'notifications'].includes(item.id))
  const manageItems = viewItems.filter((item) => ['acquaintances', 'restore', 'settings'].includes(item.id))

  function openMobileMenu() {
    if (mobileMenuCloseTimerRef.current) {
      window.clearTimeout(mobileMenuCloseTimerRef.current)
    }
    setIsMobileMenuClosing(false)
    setIsMobileMenuOpen(true)
  }

  function closeMobileMenu() {
    if (!isMobileMenuOpen || isMobileMenuClosing) {
      return
    }

    setIsMobileMenuClosing(true)
    mobileMenuCloseTimerRef.current = window.setTimeout(() => {
      setIsMobileMenuOpen(false)
      setIsMobileMenuClosing(false)
      mobileMenuCloseTimerRef.current = null
    }, 180)
  }

  function handleViewChange(view: AppView) {
    onViewChange(view)
    closeMobileMenu()
  }

  const renderNavGroup = (items: AppViewNavItem[], label?: string) => (
    <div className="nav-group" key={label ?? 'all'}>
      {label && <div className="sidebar-summary">{label}</div>}
      {items.map((item) => {
        const Icon = navIcons[item.id] ?? LayoutDashboard
        return (
          <button
            className={`nav-item${item.id === activeView ? ' nav-item--active' : ''}`}
            key={item.id}
            onClick={() => handleViewChange(item.id)}
            type="button"
            aria-current={item.id === activeView ? 'page' : undefined}
          >
            <div className="relative">
              <Icon size={18} className="nav-item__icon" />
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full border-2 border-surface" />
              )}
            </div>
            <span className="nav-item__copy">
              <strong>{item.label}</strong>
            </span>
            {item.id === 'notifications' && unreadCount > 0 ? (
              <em className="bg-error text-white px-2 py-0.5 rounded-full text-[10px] font-bold">{unreadCount}</em>
            ) : item.id === 'acquaintances' && pendingRequestsCount > 0 ? (
              <em className="bg-primary text-on-primary px-2 py-0.5 rounded-full text-[10px] font-bold">{pendingRequestsCount}</em>
            ) : item.meta ? (
              <em>{item.meta}</em>
            ) : null}
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      <aside className="app-sidebar" aria-label="GrowT navigation">
        <a className="sidebar-brand" href="#main-content" aria-label="GrowT – go to main content">
          <span className="brand-mark">
            <SproutIcon size={20} />
          </span>
          <span>
            <strong>GrowT</strong>
            <small>Grow with intention</small>
          </span>
        </a>

        <nav className="app-nav" aria-label="GrowT sections">
          {renderNavGroup(workspaceItems, 'Workspace')}
          {renderNavGroup(manageItems, 'Manage')}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav" aria-label="Primary GrowT navigation">
        {primaryMobileItems.map((item) => {
          const Icon = navIcons[item.id] ?? LayoutDashboard
          return (
            <button
              className={`mobile-nav__item${item.id === activeView ? ' mobile-nav__item--active' : ''}`}
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              type="button"
            >
              <Icon size={20} />
              <span className="mobile-nav__label">{item.label}</span>
            </button>
          )
        })}
        <button
          className={`mobile-nav__item${isMobileMenuOpen ? ' mobile-nav__item--active' : ''}`}
          onClick={openMobileMenu}
          type="button"
        >
          <Menu size={20} />
          <span className="mobile-nav__label">Menu</span>
        </button>
      </nav>

      {isMobileMenuOpen ? (
        <div
          className={`mobile-drawer${isMobileMenuClosing ? ' mobile-drawer--closing' : ''}`}
          onClick={closeMobileMenu}
          role="dialog"
          aria-modal="true"
          aria-label="GrowT menu"
        >
          <div className="mobile-drawer__panel" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-drawer__header">
              <a className="sidebar-brand sidebar-brand--inline" href="#main-content" aria-label="GrowT dashboard">
                <span className="brand-mark brand-mark--sm">
                  <SproutIcon size={18} />
                </span>
                <strong className="sidebar-brand__name">GrowT</strong>
              </a>
              <button className="btn btn--ghost btn--icon" onClick={closeMobileMenu} type="button" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <nav className="app-nav app-nav--drawer" aria-label="All GrowT sections">
              {renderNavGroup(viewItems)}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  )
}
