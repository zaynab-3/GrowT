import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Eye, Filter, FolderOpen, FolderPlus, Trash2, Plus, Info, Edit2, MoreHorizontal, ReceiptText, X } from 'lucide-react'
import { getCategoryLabel, isSharedFolder } from '../lib/growtDisplay'
import type { Folder as FolderType, Task, TaskStatusAction } from '../lib/growtData'
import {
  combineRecipientReports,
  type RecipientFolderReview,
  type RecipientReport,
} from '../lib/recipient'
import { LinkifiedText } from '../components/LinkifiedText'
import type { ReorderDirection, TaskProgressStatus } from '../lib/database.types'
import { ProgressPopup } from '../components/ProgressPopup'
import { RecipientFolderReviewPopup } from '../components/RecipientFolderReviewPopup'
import { RecipientReportPopup } from '../components/RecipientReportPopup'
import { calculateFolderProgress } from '../lib/growtState'
import { UserAvatar } from '../components/UserAvatar'
import './FolderListPage.css'

const cardTones = [
  { bg: 'folder-card-tone-0', text: 'folder-card-tone-text', subtext: 'folder-card-tone-subtext', progressFill: 'folder-card-tone-fill', progressBg: 'folder-card-tone-track', badge: 'folder-card-tone-badge' },
  { bg: 'folder-card-tone-1', text: 'folder-card-tone-text', subtext: 'folder-card-tone-subtext', progressFill: 'folder-card-tone-fill', progressBg: 'folder-card-tone-track', badge: 'folder-card-tone-badge' },
  { bg: 'folder-card-tone-2', text: 'folder-card-tone-text', subtext: 'folder-card-tone-subtext', progressFill: 'folder-card-tone-fill', progressBg: 'folder-card-tone-track', badge: 'folder-card-tone-badge' },
  { bg: 'folder-card-tone-3', text: 'folder-card-tone-text', subtext: 'folder-card-tone-subtext', progressFill: 'folder-card-tone-fill', progressBg: 'folder-card-tone-track', badge: 'folder-card-tone-badge' },
  { bg: 'folder-card-tone-4', text: 'folder-card-tone-text', subtext: 'folder-card-tone-subtext', progressFill: 'folder-card-tone-fill', progressBg: 'folder-card-tone-track', badge: 'folder-card-tone-badge' },
]

type FolderScope = 'all' | 'personal' | 'work' | 'shared'

type FolderListPageProps = {
  currentUserId: string
  folders: FolderType[]
  tasks: Task[]
  isSaving: boolean
  onAddFolder: () => void
  onDeleteFolder: (folder: FolderType) => void
  onEditFolder: (folderId: string) => void
  onMoveFolder: (folder: FolderType, direction: ReorderDirection, scopedFolderIds?: string[]) => void
  onOpenFolder: (folderId: string) => void
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  contributionsByTask?: Map<string, Record<TaskProgressStatus, { action: TaskStatusAction; userId: string }[]>>
  recipientReportsByFolder: Map<string, RecipientReport>
}

export function FolderListPage({
  currentUserId,
  folders,
  tasks,
  isSaving,
  onAddFolder,
  onDeleteFolder,
  onEditFolder,
  onMoveFolder,
  onOpenFolder,
  getProfileAvatar,
  getProfileLabel,
  contributionsByTask,
  recipientReportsByFolder,
}: FolderListPageProps) {
  const [scope, setScope] = useState<FolderScope>('all')
  const [activePopupFolderId, setActivePopupFolderId] = useState<string | null>(null)
  const [activePopupAnchor, setActivePopupAnchor] = useState<DOMRect | null>(null)
  const [activeRecipientFolderId, setActiveRecipientFolderId] = useState<string | null>(null)
  const [activeRecipientAnchor, setActiveRecipientAnchor] = useState<DOMRect | null>(null)
  const [activeActionMenuFolderId, setActiveActionMenuFolderId] = useState<string | null>(null)
  const [recipientReviewMode, setRecipientReviewMode] = useState(false)
  const [isRecipientReviewOpen, setIsRecipientReviewOpen] = useState(false)
  const [selectedRecipientFolderIds, setSelectedRecipientFolderIds] = useState<string[]>([])
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false)

  const personalCount = folders.filter((f) => !isSharedFolder(f) && f.category === 'personal').length
  const workCount = folders.filter((f) => !isSharedFolder(f) && f.category === 'work').length
  const sharedCount = folders.filter((f) => isSharedFolder(f)).length
  const scopeOptions: { id: FolderScope; label: string; count: number }[] = [
    { id: 'all', label: 'All folders', count: folders.length },
    { id: 'work', label: 'Work', count: workCount },
    { id: 'personal', label: 'Personal', count: personalCount },
    { id: 'shared', label: 'Shared', count: sharedCount },
  ]
  const activeScope = scopeOptions.find((option) => option.id === scope) ?? scopeOptions[0]

  const visibleFolders = useMemo(
    () =>
      folders.filter((folder) => {
        if (scope === 'personal') return !isSharedFolder(folder) && folder.category === 'personal'
        if (scope === 'work') return !isSharedFolder(folder) && folder.category === 'work'
        if (scope === 'shared') return isSharedFolder(folder)
        return true
      }),
    [folders, scope],
  )

  const foldersById = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders])
  const selectedRecipientFolderIdSet = useMemo(
    () => new Set(selectedRecipientFolderIds),
    [selectedRecipientFolderIds],
  )
  const selectedFolderReviews = useMemo<RecipientFolderReview[]>(
    () =>
      selectedRecipientFolderIds.flatMap((folderId) => {
        const folder = foldersById.get(folderId)
        const report = recipientReportsByFolder.get(folderId)

        if (!folder || !report) {
          return []
        }

        return [
          {
            folderId,
            folderTitle: folder.title,
            report,
          },
        ]
      }),
    [foldersById, recipientReportsByFolder, selectedRecipientFolderIds],
  )
  const combinedRecipientReport = useMemo(
    () => combineRecipientReports(selectedFolderReviews.map((review) => review.report)),
    [selectedFolderReviews],
  )
  const selectedVisibleFolderCount = visibleFolders.filter((folder) =>
    selectedRecipientFolderIdSet.has(folder.id),
  ).length
  const allVisibleFoldersSelected = visibleFolders.length > 0 && selectedVisibleFolderCount === visibleFolders.length

  const reorderableFolderIds = visibleFolders
    .filter((folder) => folder.owner_id === currentUserId)
    .map((folder) => folder.id)

  function formatDateLabel(dateStr: string) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr))
  }

  function getRemainingTimeText(dueDateStr: string) {
    const due = new Date(dueDateStr)
    const today = new Date()

    today.setHours(0, 0, 0, 0)

    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
    if (diffDays === 0) return 'due today'
    if (diffDays === 1) return '1d left'
    if (diffDays < 7) return `${diffDays}d left`

    const weeks = Math.round(diffDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} left`
  }

  function handleRecipientReviewModeToggle() {
    const nextMode = !recipientReviewMode
    setRecipientReviewMode(nextMode)
    setActivePopupFolderId(null)
    setActivePopupAnchor(null)
    setActiveRecipientFolderId(null)
    setActiveRecipientAnchor(null)

    if (!nextMode) {
      setSelectedRecipientFolderIds([])
      setIsRecipientReviewOpen(false)
    }
  }

  function toggleRecipientFolder(folderId: string) {
    setSelectedRecipientFolderIds((current) =>
      current.includes(folderId)
        ? current.filter((selectedFolderId) => selectedFolderId !== folderId)
        : [...current, folderId],
    )
  }

  function toggleVisibleRecipientFolders() {
    const visibleFolderIds = visibleFolders.map((folder) => folder.id)

    setSelectedRecipientFolderIds((current) => {
      const currentSet = new Set(current)

      if (allVisibleFoldersSelected) {
        return current.filter((folderId) => !visibleFolderIds.includes(folderId))
      }

      for (const folderId of visibleFolderIds) {
        currentSet.add(folderId)
      }

      return Array.from(currentSet)
    })
  }

  return (
    <section className="folders-redesign" aria-labelledby="workspaces-heading">
      <header className="folders-redesign__hero flex flex-wrap md:flex-nowrap items-center justify-between gap-4 mb-6">
        <div className="gui-page-heading">
          <span className="gui-page-heading__icon"><FolderOpen aria-hidden="true" size={22} /></span>
          <h1 id="workspaces-heading">Workspaces</h1>
        </div>

        <div className="folders-redesign__hero-actions">
          <div className="folders-redesign__controls folder-filter-bar !m-0">
            <div className="folder-filter-menu">
              <button
                aria-controls="folder-filter-options"
                aria-expanded={isScopeMenuOpen}
                className="folder-filter-menu__trigger"
                onClick={() => setIsScopeMenuOpen((current) => !current)}
                type="button"
              >
                <Filter size={18} />
                <span>{activeScope.label}</span>
                <strong>{activeScope.count}</strong>
                <ChevronDown className={isScopeMenuOpen ? 'rotate-180' : ''} size={17} />
              </button>

              {isScopeMenuOpen ? (
                <div className="folder-filter-menu__options" id="folder-filter-options" role="menu">
                  {scopeOptions.map((option) => (
                    <button
                      aria-checked={scope === option.id}
                      className={scope === option.id ? 'is-active' : ''}
                      key={option.id}
                      onClick={() => {
                        setScope(option.id)
                        setIsScopeMenuOpen(false)
                      }}
                      role="menuitemradio"
                      type="button"
                    >
                      <span>{option.label}</span>
                      <strong>{option.count}</strong>
                      {scope === option.id ? <Check size={16} /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              aria-label={recipientReviewMode ? 'Exit recipient selection' : 'Select folders to review recipients'}
              aria-pressed={recipientReviewMode}
              className={`folders-redesign__recipient-shortcut${recipientReviewMode ? ' is-active' : ''}`}
              onClick={handleRecipientReviewModeToggle}
              title={recipientReviewMode ? 'Done selecting' : 'Review recipients'}
              type="button"
            >
              <ReceiptText size={20} />
              {selectedFolderReviews.length > 0 ? <span>{selectedFolderReviews.length}</span> : null}
            </button>
          </div>

          <button className="folders-redesign__create shrink-0" onClick={onAddFolder} type="button">
            <FolderPlus size={18} />
            <span className="hidden md:inline">New workspace</span>
          </button>
        </div>
      </header>

      <RecipientFolderReviewPopup
        combinedReport={combinedRecipientReport}
        folderReviews={selectedFolderReviews}
        getProfileAvatar={getProfileAvatar}
        getProfileLabel={getProfileLabel}
        isOpen={isRecipientReviewOpen}
        onClose={() => setIsRecipientReviewOpen(false)}
      />

      <div className="folders-redesign__grid">
        {visibleFolders.map((folder, index) => {
          const tone = cardTones[index % cardTones.length]
          const isShared = isSharedFolder(folder)
          const folderTasks = tasks.filter((task) => task.folder_id === folder.id)
          const folderTaskCount = folderTasks.length
          const { finalCounts, memberCounts } = calculateFolderProgress(
            folderTasks,
            contributionsByTask || new Map(),
          )
          const recipientReport = recipientReportsByFolder.get(folder.id)

          if (!memberCounts.has(folder.owner_id)) {
            memberCounts.set(folder.owner_id, { ongoing: 0, half_done: 0, completed: 0 })
          }

          const progressPercent =
            folderTaskCount === 0 ? 0 : Math.round((finalCounts.completed / folderTaskCount) * 100)

          const isPopupOpen = activePopupFolderId === folder.id
          const isRecipientPopupOpen = activeRecipientFolderId === folder.id
          const isSelectedForRecipients = selectedRecipientFolderIdSet.has(folder.id)
          const selectionBorder = isSelectedForRecipients
            ? 'border-primary/70 ring-4 ring-primary/10'
            : 'border-transparent hover:border-black/5 dark:hover:border-white/5'
          const createdDateText = formatDateLabel(folder.created_at)
          const statusText = folder.due_date
            ? getRemainingTimeText(folder.due_date)
            : folder.is_active
              ? 'active'
              : 'inactive'

          const activeUserIds = Array.from(memberCounts.keys())
          const canManageFolder = folder.owner_id === currentUserId
          const canReorder = canManageFolder
          const isFirst = reorderableFolderIds[0] === folder.id
          const isLast = reorderableFolderIds[reorderableFolderIds.length - 1] === folder.id

          return (
            <div
              aria-label={`${recipientReviewMode ? 'Select' : 'Open'} ${folder.title}`}
              key={folder.id}
              onClick={() => {
                if (recipientReviewMode) {
                  toggleRecipientFolder(folder.id)
                  return
                }

                onOpenFolder(folder.id)
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) {
                  return
                }

                event.preventDefault()
                if (recipientReviewMode) {
                  toggleRecipientFolder(folder.id)
                  return
                }

                onOpenFolder(folder.id)
              }}
              role="button"
              tabIndex={0}
              className={`folder-workspace-card folder-collection-card ${tone.bg} ${selectionBorder} ${recipientReviewMode ? 'folder-collection-card--selecting' : ''} ${isPopupOpen || isRecipientPopupOpen || activeActionMenuFolderId === folder.id ? 'z-50' : 'z-10'}`}
            >
              <div className="folder-workspace-card__toolbar flex justify-between items-center text-xs font-bold">
                <div className="flex min-w-0 items-center gap-2">
                  {recipientReviewMode ? (
                    <label
                      aria-label={isSelectedForRecipients ? 'Remove folder from selection' : 'Select folder'}
                      className={`relative inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 outline-none transition-all duration-300 ease-out focus-within:ring-4 focus-within:ring-primary/15 ${
                        isSelectedForRecipients
                          ? 'scale-105 border-primary bg-primary text-on-primary shadow-[0_6px_18px_rgba(34,139,94,0.28)]'
                          : 'border-white/90 bg-white/80 text-transparent shadow-[0_4px_14px_rgba(15,23,42,0.10)] backdrop-blur-sm hover:scale-105 hover:border-primary/45 hover:bg-white dark:border-white/20 dark:bg-white/10'
                      }`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        checked={isSelectedForRecipients}
                        className="peer sr-only"
                        onChange={() => toggleRecipientFolder(folder.id)}
                        type="checkbox"
                      />

                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute -inset-1.5 rounded-full border-2 border-primary/25 transition-all duration-500 ease-out ${
                          isSelectedForRecipients ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                        }`}
                      />

                      <Check
                        aria-hidden="true"
                        className={`relative z-10 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                          isSelectedForRecipients
                            ? 'rotate-0 scale-100 opacity-100'
                            : '-rotate-45 scale-50 opacity-0'
                        }`}
                        size={18}
                        strokeWidth={3}
                      />
                    </label>
                  ) : null}
                </div>

                {!recipientReviewMode ? (
                  <div className="folder-card-actions--desktop flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
                    {canReorder && (
                      <div className="flex items-center rounded-full bg-white/60 p-0.5 shadow-sm dark:bg-white/10">
                        <button
                          className={`p-1 rounded-full transition-colors disabled:opacity-35 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/10 ${tone.text}`}
                          disabled={isSaving || isFirst}
                          onClick={(event) => {
                            event.stopPropagation()
                            onMoveFolder(folder, 'up', reorderableFolderIds)
                          }}
                          title="Move up"
                          type="button"
                        >
                          <ChevronUp size={14} />
                        </button>

                        <button
                          className={`p-1 rounded-full transition-colors disabled:opacity-35 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/10 ${tone.text}`}
                          disabled={isSaving || isLast}
                          onClick={(event) => {
                            event.stopPropagation()
                            onMoveFolder(folder, 'down', reorderableFolderIds)
                          }}
                          title="Move down"
                          type="button"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    )}

                    <div className="relative flex items-center">
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          setActiveRecipientFolderId(null)
                          setActiveRecipientAnchor(null)
                          setActivePopupFolderId(folder.id)
                          setActivePopupAnchor(event.currentTarget.getBoundingClientRect())
                        }}
                        className={`hover:bg-black/5 dark:hover:bg-white/5 p-1.5 rounded-full transition-colors flex items-center justify-center ${tone.text}`}
                        title="View member progress on this folder"
                        type="button"
                      >
                        <Info size={16} />
                      </button>

                      {isPopupOpen && activePopupAnchor && (
                        <ProgressPopup
                          isOpen={isPopupOpen && activePopupAnchor !== null}
                          onClose={() => {
                            setActivePopupFolderId(null)
                            setActivePopupAnchor(null)
                          }}
                          anchorRect={activePopupAnchor}
                          title="Folder Progress"
                          subtitle={`"${folder.title}"`}
                          users={Array.from(memberCounts.entries()).map(([userId, stats]) => ({
                            id: userId,
                            label: getProfileLabel(userId),
                            avatarUrl: getProfileAvatar(userId),
                            ongoing: stats.ongoing,
                            halfDone: stats.half_done,
                            completed:
                              recipientReport?.users.find((summary) => summary.userId === userId)?.fullyCompleted ??
                              stats.completed,
                            completedOtherHalf:
                              recipientReport?.users.find((summary) => summary.userId === userId)?.completedOtherHalf ??
                              0,
                          }))}
                        />
                      )}
                    </div>

                    {recipientReport && (
                      <div className="relative flex items-center">
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            setActivePopupFolderId(null)
                            setActivePopupAnchor(null)
                            setActiveRecipientFolderId(folder.id)
                            setActiveRecipientAnchor(event.currentTarget.getBoundingClientRect())
                          }}
                          className={`hover:bg-black/5 dark:hover:bg-white/5 p-1.5 rounded-full transition-colors flex items-center justify-center ${tone.text}`}
                          title="View recipients"
                          type="button"
                        >
                          <ReceiptText size={16} />
                        </button>

                        {isRecipientPopupOpen && activeRecipientAnchor && (
                          <RecipientReportPopup
                            anchorRect={activeRecipientAnchor}
                            getProfileAvatar={getProfileAvatar}
                            getProfileLabel={getProfileLabel}
                            isOpen={isRecipientPopupOpen && activeRecipientAnchor !== null}
                            onClose={() => {
                              setActiveRecipientFolderId(null)
                              setActiveRecipientAnchor(null)
                            }}
                            report={recipientReport}
                            subtitle={`${folder.title} · ${recipientReport.taskCount} ${recipientReport.taskCount === 1 ? 'task' : 'tasks'}`}
                            title="Folder recipients"
                          />
                        )}
                      </div>
                    )}

                    {canManageFolder && (
                      <>
                        <button
                          className={`hover:bg-black/5 dark:hover:bg-white/5 p-1.5 rounded-full transition-colors flex items-center justify-center ${tone.text}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onEditFolder(folder.id)
                          }}
                          title="Edit folder"
                          type="button"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          className={`hover:bg-black/5 dark:hover:bg-white/5 p-1.5 rounded-full transition-colors flex items-center justify-center hover:text-error ${tone.text}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onDeleteFolder(folder)
                          }}
                          title="Delete folder"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                ) : null}

                {!recipientReviewMode ? (
                  <div className="folder-card-mobile-menu" onClick={(event) => event.stopPropagation()}>
                    <button
                      aria-controls={`folder-actions-${folder.id}`}
                      aria-expanded={activeActionMenuFolderId === folder.id}
                      aria-label={`Actions for ${folder.title}`}
                      className={`folder-card-mobile-menu__trigger ${tone.text}`}
                      onClick={() => setActiveActionMenuFolderId((current) => current === folder.id ? null : folder.id)}
                      type="button"
                    >
                      <MoreHorizontal size={17} />
                    </button>

                    {activeActionMenuFolderId === folder.id ? (
                      <div className="folder-card-mobile-menu__panel" id={`folder-actions-${folder.id}`}>
                        <button
                          onClick={(event) => {
                            setActiveRecipientFolderId(null)
                            setActiveRecipientAnchor(null)
                            setActivePopupFolderId(folder.id)
                            setActivePopupAnchor(event.currentTarget.getBoundingClientRect())
                            setActiveActionMenuFolderId(null)
                          }}
                          type="button"
                        >
                          <Info size={14} /> Progress
                        </button>

                        {recipientReport ? (
                          <button
                            onClick={(event) => {
                              setActivePopupFolderId(null)
                              setActivePopupAnchor(null)
                              setActiveRecipientFolderId(folder.id)
                              setActiveRecipientAnchor(event.currentTarget.getBoundingClientRect())
                              setActiveActionMenuFolderId(null)
                            }}
                            type="button"
                          >
                            <ReceiptText size={14} /> Recipients
                          </button>
                        ) : null}

                        {canReorder ? (
                          <>
                            <button
                              disabled={isSaving || isFirst}
                              onClick={() => {
                                onMoveFolder(folder, 'up', reorderableFolderIds)
                                setActiveActionMenuFolderId(null)
                              }}
                              type="button"
                            >
                              <ChevronUp size={14} /> Move up
                            </button>
                            <button
                              disabled={isSaving || isLast}
                              onClick={() => {
                                onMoveFolder(folder, 'down', reorderableFolderIds)
                                setActiveActionMenuFolderId(null)
                              }}
                              type="button"
                            >
                              <ChevronDown size={14} /> Move down
                            </button>
                          </>
                        ) : null}

                        {canManageFolder ? (
                          <>
                            <button
                              onClick={() => {
                                onEditFolder(folder.id)
                                setActiveActionMenuFolderId(null)
                              }}
                              type="button"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button
                              className="folder-card-mobile-menu__danger"
                              onClick={() => {
                                onDeleteFolder(folder)
                                setActiveActionMenuFolderId(null)
                              }}
                              type="button"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

              </div>

              <div className="folder-collection-card__body">
                <span className="folder-collection-card__icon"><FolderOpen size={22} /></span>
                <h3 className={`folder-collection-card__title ${tone.text}`}>
                  {folder.title}
                </h3>

                <span className={`folder-collection-card__category ${tone.subtext}`}>
                  {getCategoryLabel(folder.category)}
                </span>

                <p className={`folder-workspace-card__description folder-collection-card__description ${tone.subtext}`}>
                  {folder.description ? <LinkifiedText text={folder.description} /> : 'No description'}
                </p>

                <div className={`folder-workspace-card__status folder-collection-card__status ${tone.subtext}`}>
                  <span>{folderTaskCount} {folderTaskCount === 1 ? 'task' : 'tasks'}</span>
                  <span className="inline-flex items-center gap-1" title="Ongoing">
                    <i className="recipient-dot recipient-dot--ongoing" />
                    {recipientReport?.taskStates.ongoing ?? finalCounts.ongoing}
                  </span>
                  <span className="inline-flex items-center gap-1" title="Half done">
                    <i className="recipient-dot recipient-dot--half_done" />
                    {recipientReport?.taskStates.half_done ?? finalCounts.half_done}
                  </span>
                  <span className="inline-flex items-center gap-1" title="Fully completed">
                    <i className="recipient-dot recipient-dot--fully_completed" />
                    {recipientReport?.taskStates.fully_completed ?? finalCounts.completed}
                  </span>
                  <span className="inline-flex items-center gap-1" title="Completed other half">
                    <i className="recipient-dot recipient-dot--completed_other_half" />
                    {recipientReport?.taskStates.completed_other_half ?? 0}
                  </span>
                </div>
              </div>

              <div className="folder-collection-card__progress">
                <div className="folder-collection-card__progress-label">
                  <span className={tone.text}>Progress</span>
                  <span className={tone.text}>{progressPercent}%</span>
                </div>

                <div className={`folder-collection-card__track ${tone.progressBg}`}>
                  <div
                    className={`folder-collection-card__fill ${tone.progressFill}`}
                    style={{ width: `${progressPercent}%`, transition: 'width 0.3s ease' }}
                  />
                </div>
              </div>

              <div className="folder-collection-card__footer">
                <div className="folder-collection-card__people" onClick={(event) => event.stopPropagation()}>
                  {activeUserIds.slice(0, 3).map((userId) => (
                    <UserAvatar
                      key={userId}
                      label={getProfileLabel(userId)}
                      avatarUrl={getProfileAvatar(userId)}
                      className="folder-collection-card__avatar"
                    />
                  ))}

                  {isShared && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenFolder(folder.id)
                      }}
                      className={`folder-collection-card__invite ${tone.badge}`}
                      title="Open folder to invite members"
                      type="button"
                    >
                      +
                    </button>
                  )}

                  {!isShared && activeUserIds.length === 0 && (
                    <span className={`folder-collection-card__private ${tone.subtext}`}>
                      Private
                    </span>
                  )}
                </div>

                <div className="folder-card-meta-pills">
                  <div className={`folder-card-meta-pill folder-card-meta-pill--date ${tone.badge}`}>
                    {createdDateText}
                  </div>
                  <div className={`folder-card-meta-pill folder-card-meta-pill--status capitalize ${tone.badge}`}>
                    {statusText}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        <button
          onClick={onAddFolder}
          className="folder-collection-card folder-collection-card--new"
          type="button"
        >
          <span><Plus size={22} /></span>
          <strong>New workspace</strong>
          <small>Start somewhere fresh</small>
        </button>
      </div>

      {recipientReviewMode ? (
        <div className="folders-recipient-selection-bar" role="region" aria-label="Recipient selection actions">
          <strong>{selectedFolderReviews.length} selected</strong>
          <button
            aria-label={allVisibleFoldersSelected ? 'Unselect visible folders' : 'Select visible folders'}
            disabled={!visibleFolders.length}
            onClick={toggleVisibleRecipientFolders}
            type="button"
          >
            <Eye size={17} />
            <span>{allVisibleFoldersSelected ? 'Unselect visible' : 'Select visible'}</span>
          </button>
          <button
            aria-label="Clear selected folders"
            disabled={!selectedFolderReviews.length}
            onClick={() => setSelectedRecipientFolderIds([])}
            type="button"
          >
            <X size={17} />
            <span>Clear</span>
          </button>
          <button
            className="is-primary"
            disabled={!selectedFolderReviews.length}
            onClick={() => setIsRecipientReviewOpen(true)}
            type="button"
          >
            <ReceiptText size={17} />
            <span>Review ({selectedFolderReviews.length})</span>
          </button>
        </div>
      ) : null}
    </section>
  )
}
