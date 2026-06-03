type SearchBarProps = {
  onChange: (value: string) => void
  value: string
}

export function SearchBar({ onChange, value }: SearchBarProps) {
  return (
    <div className="search-bar">
      <label htmlFor="growt-search">Search</label>
      <div className="search-control">
        <input
          id="growt-search"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Folders, tasks, categories, members"
          value={value}
        />
        {value ? (
          <button className="button button--secondary" onClick={() => onChange('')} type="button">
            Clear
          </button>
        ) : null}
      </div>
    </div>
  )
}
