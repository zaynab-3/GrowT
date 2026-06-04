import { SearchResults } from '../features/search/SearchResults'
import type { AppView, AppViewNavItem } from '../views/viewTypes'

type SidebarProps = {
  activeView: AppView
  foldersCount: number
  normalizedSearchQuery: string
  onViewChange: (view: AppView) => void
  viewItems: AppViewNavItem[]
  visibleFoldersCount: number
}

export function Sidebar({
  activeView,
  foldersCount,
  normalizedSearchQuery,
  onViewChange,
  viewItems,
  visibleFoldersCount,
}: SidebarProps) {
  return (
    <aside className="side-panel">
      <div className="panel-heading">
        <h2>Views</h2>
        <SearchResults
          hasQuery={Boolean(normalizedSearchQuery)}
          totalCount={foldersCount}
          visibleCount={visibleFoldersCount}
        />
      </div>

      <nav className="view-nav" aria-label="GrowT views">
        {viewItems.map((item) => (
          <button
            className={`view-nav__item${item.id === activeView ? ' view-nav__item--active' : ''}`}
            key={item.id}
            onClick={() => onViewChange(item.id)}
            type="button"
          >
            <span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
            {item.meta ? <em>{item.meta}</em> : null}
          </button>
        ))}
      </nav>
    </aside>
  )
}
