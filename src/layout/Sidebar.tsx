import { useState, useEffect, useRef } from 'react'
import { Bell, CheckSquare, FolderOpen, FolderPlus, LayoutDashboard, Link, ListPlus, Menu, Plus, RotateCcw, UserRound, Users, X } from 'lucide-react'
import { SproutIcon } from '../components/SproutIcon'
import { useNotifications } from '../features/notifications/useNotifications'
import { listAcquaintanceRequests } from '../features/acquaintances/acquaintanceApi'
import { isSupabaseConfigured } from '../services/clientService'
import { removeChannel, subscribeToChannel } from '../services/realtimeService'
import './Layout.css'
import type { AppView, AppViewNavItem } from '../views/viewTypes'

type SidebarProps = {
  activeView: AppView
  onAddFolder: () => void
  onAddTask: () => void
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
  settings: UserRound,
  invite: Link,
}

export function Sidebar({
  activeView,
  onAddFolder,
  onAddTask,
  onViewChange,
  viewItems,
}: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false)
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const mobileMenuCloseTimerRef = useRef<number | null>(null)
  
  const { unreadCount } = useNotifications()

  useEffect(() => {
    async function loadRequests() {
      if (!isSupabaseConfigured) return
      try {
        const requests = await listAcquaintanceRequests()
        const pending = requests.filter((r) => r.direction === 'incoming').length
        setPendingRequestsCount(pending)
      } catch (err) {
        console.error('Failed to load acquaintance requests', err)
      }
    }
    
    void loadRequests()

    if (!isSupabaseConfigured) return
    const channel = subscribeToChannel('sidebar-requests', (nextChannel) => nextChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acquaintance_requests' }, () => {
        void loadRequests()
      })
    )
      
    return () => {
      void removeChannel(channel)
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
    setIsCreateMenuOpen(false)
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
        {primaryMobileItems.filter((item) => item.id !== 'tasks').map((item) => {
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
          className="mobile-nav__item mobile-nav__item--create"
          aria-expanded={isCreateMenuOpen}
          aria-label="Create a folder or task"
          onClick={() => setIsCreateMenuOpen((current) => !current)}
          type="button"
        >
          <span className="mobile-nav__create-icon"><Plus size={25} /></span>
          <span className="mobile-nav__label">New</span>
        </button>
        {primaryMobileItems.filter((item) => item.id === 'tasks').map((item) => {
          const Icon = navIcons[item.id] ?? CheckSquare
          return (
            <button
              className={`mobile-nav__item${item.id === activeView ? ' mobile-nav__item--active' : ''}`}
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              type="button"
            >
              <Icon size={20} />
              <span className="mobile-nav__label">My Tasks</span>
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

      {isCreateMenuOpen ? (
        <div
          aria-label="Create new"
          aria-modal="true"
          className="mobile-create-menu"
          onClick={() => setIsCreateMenuOpen(false)}
          role="dialog"
        >
          <div className="mobile-create-menu__panel" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-create-menu__heading">
              <div>
                <strong>Create new</strong>
                <span>Choose one.</span>
              </div>
              <button
                aria-label="Close create menu"
                className="mobile-create-menu__close"
                onClick={() => setIsCreateMenuOpen(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mobile-create-menu__actions">
              <button
                onClick={() => {
                  setIsCreateMenuOpen(false)
                  onAddFolder()
                }}
                type="button"
              >
                <span><FolderPlus size={25} /></span>
                <span><strong>Folder</strong></span>
              </button>
              <button
                onClick={() => {
                  setIsCreateMenuOpen(false)
                  onAddTask()
                }}
                type="button"
              >
                <span><ListPlus size={25} /></span>
                <span><strong>Task</strong></span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
