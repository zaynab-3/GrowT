import type { ReactNode } from 'react'
import { ViewHeader } from './ViewHeader'

type SharedViewProps = {
  folderCreateForm: ReactNode
  folderDetail: ReactNode
  folderList: ReactNode
  sharedFolderCount: number
  sharedTasksPanel: ReactNode
  sharedTaskCount: number
}

export function SharedView({
  folderCreateForm,
  folderDetail,
  folderList,
  sharedFolderCount,
  sharedTasksPanel,
  sharedTaskCount,
}: SharedViewProps) {
  return (
    <section className="view-stack">
      <ViewHeader
        description="Shared folders and shared standalone tasks live here, with the same realtime status and member controls."
        label="Shared with Me"
        title="Collaborative spaces"
      />

      <div className="view-grid view-grid--workspace">
        <section className="view-panel view-panel--sidebar">
          <div className="panel-heading">
            <div>
              <p className="section-label">Shared folders</p>
              <h2>Live folders</h2>
            </div>
            <span>{sharedFolderCount}</span>
          </div>
          {folderList}
          {folderCreateForm}
        </section>

        <section className="view-column">
          {folderDetail}
          <section className="view-panel view-panel--flush">
            <div className="panel-heading">
              <div>
                <p className="section-label">Shared standalone</p>
                <h2>Shared task shelf</h2>
              </div>
              <span>{sharedTaskCount}</span>
            </div>
            {sharedTasksPanel}
          </section>
        </section>
      </div>
    </section>
  )
}
