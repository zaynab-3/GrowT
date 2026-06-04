import type { ReactNode } from 'react'
import { ViewHeader } from './ViewHeader'

type MyTasksViewProps = {
  folderCreateForm: ReactNode
  folderDetail: ReactNode
  folderList: ReactNode
  personalFolderCount: number
  standaloneTasksPanel: ReactNode
  standaloneTaskCount: number
}

export function MyTasksView({
  folderCreateForm,
  folderDetail,
  folderList,
  personalFolderCount,
  standaloneTasksPanel,
  standaloneTaskCount,
}: MyTasksViewProps) {
  return (
    <section className="view-stack">
      <ViewHeader
        description="Personal and work folders, plus standalone tasks, stay in this task-focused workspace."
        label="My Tasks"
        title="Your work queue"
      />

      <div className="view-grid view-grid--workspace">
        <section className="view-panel view-panel--sidebar">
          <div className="panel-heading">
            <div>
              <p className="section-label">Folders</p>
              <h2>Personal + Work</h2>
            </div>
            <span>{personalFolderCount}</span>
          </div>
          {folderList}
          {folderCreateForm}
        </section>

        <section className="view-column">
          {folderDetail}
          <section className="view-panel view-panel--flush">
            <div className="panel-heading">
              <div>
                <p className="section-label">Standalone</p>
                <h2>Task shelf</h2>
              </div>
              <span>{standaloneTaskCount}</span>
            </div>
            {standaloneTasksPanel}
          </section>
        </section>
      </div>
    </section>
  )
}
