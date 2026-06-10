import { Search, X } from 'lucide-react'

type SearchBarProps = {
  onChange: (value: string) => void
  value: string
}

export function SearchBar({ onChange, value }: SearchBarProps) {
  return (
    <div className="topbar-search">
      <label className="sr-only" htmlFor="growt-search">Search</label>
      <span className="topbar-search__icon" aria-hidden="true">
        <Search size={15} />
      </span>
      <input
        id="growt-search"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Folders, tasks, members…"
        value={value}
      />
      {value ? (
        <button
          className="topbar-search__clear"
          onClick={() => onChange('')}
          type="button"
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  )
}
