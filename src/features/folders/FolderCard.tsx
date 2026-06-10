import { ChevronDown, ChevronUp, Folder, Info } from 'lucide-react'
import { useState } from 'react'
import { getCategoryLabel, isSharedFolder } from '../../lib/growtDisplay'
import { LinkifiedText } from '../../components/LinkifiedText'
import type { Folder as FolderType } from '../../lib/growtData'
import type { ReorderDirection } from '../../lib/database.types'

type FolderCardProps = {
  canReorder: boolean
  folder: FolderType
  isSelected: boolean
  isFirst: boolean
  isLast: boolean
  isSaving: boolean
  onMoveFolder: (folder: FolderType, direction: ReorderDirection) => void
  onSelect: (folderId: string) => void
  statusCounts?: { ongoing: number; half_done: number; completed: number }
  taskCount: number
  tone: number
}

export function FolderCard({
  canReorder,
  folder,
  isSelected,
  isFirst,
  isLast,
  isSaving,
  onMoveFolder,
  onSelect,
  statusCounts = { ongoing: 0, half_done: 0, completed: 0 },
  taskCount,
  tone,
}: FolderCardProps) {
  const [showInfo, setShowInfo] = useState(false)
  const shared = isSharedFolder(folder)
  const badgeLabel = shared ? 'Shared' : getCategoryLabel(folder.category)
  const toneClass = `folder-card--tone-${tone % 5}`

  const totalStatus = statusCounts.ongoing + statusCounts.half_done + statusCounts.completed
  const effectiveTotal = totalStatus > 0 ? totalStatus : taskCount
  const progressPercent = effectiveTotal === 0 ? 0 : Math.round((statusCounts.completed / effectiveTotal) * 100)

  return (
    <article className={`folder-card ${toneClass}${isSelected ? ' folder-card--selected' : ''}`}>
      {/* Reorder buttons */}
      <div className="folder-card__actions" aria-label={`Reorder ${folder.title}`}>
        <button
          className="btn btn--sm"
          disabled={isSaving || !canReorder || isFirst}
          onClick={() => onMoveFolder(folder, 'up')}
          title={canReorder ? 'Move up' : 'Only the owner can reorder'}
          type="button"
        >
          <ChevronUp size={12} />
        </button>
        <button
          className="btn btn--sm"
          disabled={isSaving || !canReorder || isLast}
          onClick={() => onMoveFolder(folder, 'down')}
          title={canReorder ? 'Move down' : 'Only the owner can reorder'}
          type="button"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Main clickable body */}
      <div className="folder-card__body" style={{ position: 'relative', cursor: 'default' }}>
        <button onClick={() => onSelect(folder.id)} type="button" style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <span className="folder-card__icon" aria-hidden="true">
            <Folder size={18} />
          </span>

          <span className="folder-card__badge">{badgeLabel}</span>

          <h3 className="folder-card__title">{folder.title}</h3>
        </button>
        
        <button 
          className="btn btn--icon btn--ghost" 
          onClick={() => setShowInfo(!showInfo)}
          style={{ position: 'absolute', top: '-4px', right: '-8px', color: 'var(--ink-3)' }}
          title="Folder info & progress"
          type="button"
        >
          <Info size={16} />
        </button>

        {showInfo ? (
          <div className="folder-card__info-panel" style={{ marginTop: '12px', padding: '12px', background: 'var(--surface-soft)', borderRadius: '8px', fontSize: '12px' }}>
            <div style={{ margin: '0 0 10px', color: 'var(--ink-2)', lineHeight: 1.4 }}>
              {folder.description ? <LinkifiedText text={folder.description} /> : 'No description yet'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: 'var(--ink-3)' }}>
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '10px', fontWeight: 600, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ongoing-color)' }} />
                {statusCounts.ongoing}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--halfdone-color)' }} />
                {statusCounts.half_done}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--done-color)' }} />
                {statusCounts.completed}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="folder-card__footer">
        <span className="folder-card__count">
          <Folder size={13} />
          {taskCount} {taskCount === 1 ? 'item' : 'items'}
        </span>
        <button 
          className="btn btn--primary btn--sm" 
          onClick={() => onSelect(folder.id)}
          style={{ height: '24px', fontSize: '11px', padding: '0 8px' }}
        >
          Open
        </button>
      </div>
    </article>
  )
}
