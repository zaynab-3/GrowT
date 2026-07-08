import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, FolderPlus, Trash2, Plus, Info, Edit2, ReceiptText } from 'lucide-react'
import { getCategoryLabel, isSharedFolder } from '../lib/growtDisplay'
import type { Folder as FolderType, Task, TaskStatusAction } from '../lib/growtData'
import { formatCurrency, type RecipientReport } from '../lib/recipient'
import { LinkifiedText } from '../components/LinkifiedText'
import type { ReorderDirection, TaskProgressStatus } from '../lib/database.types'
import { ProgressPopup } from '../components/ProgressPopup'
import { RecipientReportPopup } from '../components/RecipientReportPopup'
import { calculateFolderProgress } from '../lib/growtState'
import { UserAvatar } from '../components/UserAvatar'

const cardTones = [
  {
    bg: 'bg-[#f0f4ff] dark:bg-sky-950/20',
    text: 'text-sky-900 dark:text-sky-100',
    subtext: 'text-sky-700/80 dark:text-sky-300/80',
    progressFill: 'bg-sky-500',
    progressBg: 'bg-sky-100 dark:bg-sky-900/40',
    badge: 'bg-sky-200/50 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  },
  {
    bg: 'bg-[#fff4eb] dark:bg-amber-950/20',
    text: 'text-amber-900 dark:text-amber-100',
    subtext: 'text-amber-700/80 dark:text-amber-300/80',
    progressFill: 'bg-amber-500',
    progressBg: 'bg-amber-100 dark:bg-amber-900/40',
    badge: 'bg-amber-200/50 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  },
  {
    bg: 'bg-[#eefcf3] dark:bg-emerald-950/20',
    text: 'text-emerald-900 dark:text-emerald-100',
    subtext: 'text-emerald-700/80 dark:text-emerald-300/80',
    progressFill: 'bg-emerald-500',
    progressBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badge: 'bg-emerald-200/50 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  },
  {
    bg: 'bg-[#fff0f5] dark:bg-rose-950/20',
    text: 'text-rose-900 dark:text-rose-100',
    subtext: 'text-rose-700/80 dark:text-rose-300/80',
    progressFill: 'bg-rose-500',
    progressBg: 'bg-rose-100 dark:bg-rose-900/40',
    badge: 'bg-rose-200/50 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
  },
  {
    bg: 'bg-[#f5f0ff] dark:bg-purple-950/20',
    text: 'text-purple-900 dark:text-purple-100',
    subtext: 'text-purple-700/80 dark:text-purple-300/80',
    progressFill: 'bg-purple-500',
    progressBg: 'bg-purple-100 dark:bg-purple-900/40',
    badge: 'bg-purple-200/50 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  },
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

  const personalCount = folders.filter((f) => !isSharedFolder(f) && f.category === 'personal').length
  const workCount = folders.filter((f) => !isSharedFolder(f) && f.category === 'work').length
  const sharedCount = folders.filter((f) => isSharedFolder(f)).length

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

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg text-on-surface dark:text-on-surface flex items-center gap-3">
            Workspaces
            <span className="bg-primary text-on-primary px-3 py-1 rounded-full font-label-md text-label-md">
              {folders.length}
            </span>
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Organize and manage your workspaces efficiently.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onAddFolder}
            className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-surface-tint transition-all shadow-md shadow-primary/20 hover:shadow-lg whitespace-nowrap"
            type="button"
          >
            <FolderPlus size={18} />
            <span className="hidden sm:inline">Create Folder</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setScope('all')}
          className={`px-4 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-colors whitespace-nowrap ${
            scope === 'all'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high dark:bg-dark-card text-on-surface-variant hover:bg-surface-variant'
          }`}
          type="button"
        >
          All
        </button>

        <button
          onClick={() => setScope('work')}
          className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-colors whitespace-nowrap ${
            scope === 'work'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high dark:bg-dark-card text-on-surface-variant hover:bg-surface-variant'
          }`}
          type="button"
        >
          Work ({workCount})
        </button>

        <button
          onClick={() => setScope('personal')}
          className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-colors whitespace-nowrap ${
            scope === 'personal'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high dark:bg-dark-card text-on-surface-variant hover:bg-surface-variant'
          }`}
          type="button"
        >
          Personal ({personalCount})
        </button>

        <button
          onClick={() => setScope('shared')}
          className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-colors whitespace-nowrap ${
            scope === 'shared'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high dark:bg-dark-card text-on-surface-variant hover:bg-surface-variant'
          }`}
          type="button"
        >
          Shared ({sharedCount})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter-md">
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
          const dueText = folder.due_date
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
              key={folder.id}
              onClick={() => onOpenFolder(folder.id)}
              className={`${tone.bg} border-2 border-transparent hover:border-black/5 dark:hover:border-white/5 rounded-[32px] p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.03)] hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer flex flex-col gap-4 ${isPopupOpen || isRecipientPopupOpen ? 'z-50' : 'z-10'}`}
            >
              <div className="flex justify-between items-center text-xs font-bold">
                <span className={tone.subtext}>{formatDateLabel(folder.created_at)}</span>

                <div className="flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
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
                          completed: stats.completed,
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
                          subtitle={`"${folder.title}" · ${formatCurrency(recipientReport.paidAmount)}`}
                          title="Folder Recipients"
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

              </div>

              <div className="flex flex-col items-center text-center my-2">
                <h3 className={`font-extrabold text-xl tracking-tight leading-snug break-words w-full ${tone.text}`}>
                  {folder.title}
                </h3>

                <span className={`text-[10px] font-bold mt-1 uppercase tracking-widest opacity-80 ${tone.subtext}`}>
                  {getCategoryLabel(folder.category)}
                </span>

                <p className={`text-xs mt-2.5 line-clamp-2 min-h-[32px] max-w-[90%] leading-relaxed ${tone.subtext}`}>
                  {folder.description ? <LinkifiedText text={folder.description} /> : 'No description'}
                </p>

                <div className={`mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] font-extrabold ${tone.subtext}`}>
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

              <div className="w-full mt-2">
                <div className="flex items-center justify-between font-bold text-xs mb-1.5">
                  <span className={tone.text}>Progress</span>
                  <span className={tone.text}>{progressPercent}%</span>
                </div>

                <div className={`w-full h-2 rounded-full overflow-hidden ${tone.progressBg}`}>
                  <div
                    className={`h-full rounded-full ${tone.progressFill}`}
                    style={{ width: `${progressPercent}%`, transition: 'width 0.3s ease' }}
                  />
                </div>
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between border-t border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center -space-x-1.5" onClick={(event) => event.stopPropagation()}>
                  {activeUserIds.slice(0, 3).map((userId) => (
                    <UserAvatar
                      key={userId}
                      label={getProfileLabel(userId)}
                      avatarUrl={getProfileAvatar(userId)}
                      className="w-6 h-6 border-2 border-white dark:border-surface ring-[1px] ring-black/[0.05]"
                    />
                  ))}

                  {isShared && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenFolder(folder.id)
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white dark:border-surface shadow-sm ${tone.badge}`}
                      title="Open folder to invite members"
                      type="button"
                    >
                      +
                    </button>
                  )}

                  {!isShared && activeUserIds.length === 0 && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${tone.subtext}`}>
                      Private
                    </span>
                  )}
                </div>

                <div className={`px-3.5 py-1.5 rounded-full text-[11px] font-extrabold tracking-wide capitalize shadow-[0_2px_8px_0_rgba(0,0,0,0.02)] ${tone.badge}`}>
                  {dueText}
                </div>
              </div>
            </div>
          )
        })}

        <div
          onClick={onAddFolder}
          className="bg-transparent rounded-3xl p-5 flex flex-col items-center justify-center gap-4 border-dashed border-2 border-outline-variant hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer min-h-[260px]"
        >
          <div className="w-16 h-16 rounded-full bg-surface-container-low dark:bg-surface-variant flex items-center justify-center text-outline">
            <Plus size={32} />
          </div>
          <h3 className="font-title-lg text-title-lg text-on-surface-variant font-bold">New Folder</h3>
        </div>
      </div>
    </div>
  )
}
