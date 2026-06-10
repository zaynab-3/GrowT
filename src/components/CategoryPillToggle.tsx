import type { FolderCategory } from '../lib/database.types'
import { categoryOptions } from '../lib/growtDisplay'
import '../styles/components.css'

type CategoryPillToggleProps = {
  id?: string
  onChange: (value: FolderCategory) => void
  value: FolderCategory
}

/**
 * A segmented pill toggle for selecting a folder/task category.
 * Replaces the native <select> for category fields, matching the Stitch design.
 */
export function CategoryPillToggle({ id, onChange, value }: CategoryPillToggleProps) {
  return (
    <div className="category-pill-toggle" role="group" aria-label="Category" id={id}>
      {categoryOptions.map((opt) => (
        <button
          className={`category-pill${value === opt.id ? ' category-pill--active' : ''}`}
          key={opt.id}
          onClick={() => onChange(opt.id as FolderCategory)}
          type="button"
          aria-pressed={value === opt.id}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
