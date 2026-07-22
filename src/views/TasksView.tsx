import type { ReactNode } from 'react'

type TasksViewProps = {
  folderDetail: ReactNode
  folderList: ReactNode
  folderTaskCount: number
  sharedTaskCount: number
  standaloneTaskCount: number
  standaloneTasksPanel: ReactNode
}

export function TasksView({
  folderDetail,
  folderTaskCount,
  standaloneTaskCount,
  standaloneTasksPanel,
}: TasksViewProps) {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-5 sm:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-headline-lg text-on-surface flex items-center gap-2 sm:gap-3">
            Standalone Tasks
            <span className="bg-primary text-on-primary px-3 py-1 rounded-full font-label-md text-label-md">{standaloneTaskCount}</span>
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage and track your tasks. Folders and standalone tasks are organized together.</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 sm:gap-8">
        {folderTaskCount > 0 || (folderDetail && !folderDetail.toString().includes('empty')) ? (
          <section className="bg-light-card dark:bg-dark-card rounded-[16px] sm:rounded-[18px] p-4 sm:p-6 shadow-[0_4px_16px_0_rgba(31,38,135,0.03)] border border-surface-variant/50">
            <h2 className="font-title-lg text-title-lg mb-4 text-on-surface">Folder Tasks</h2>
            {folderDetail}
          </section>
        ) : null}

        <section className="bg-light-card dark:bg-dark-card rounded-[16px] sm:rounded-[18px] p-4 sm:p-6 shadow-[0_4px_16px_0_rgba(31,38,135,0.03)] border border-surface-variant/50">
          <h2 className="font-title-lg text-title-lg mb-4 text-on-surface">Standalone Tasks</h2>
          {standaloneTasksPanel}
        </section>
      </div>
    </div>
  )
}
