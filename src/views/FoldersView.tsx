import type { ReactNode } from 'react'

import '../features/folders/Folders.css'
import { ViewHeader } from './ViewHeader'

type FoldersViewProps = {
  folderCreateForm: ReactNode
  folderDetail: ReactNode
  folderList: ReactNode
  personalFolderCount: number
  sharedFolderCount: number
  workFolderCount: number
}

export function FoldersView({
  folderCreateForm,
  folderDetail,
  folderList,
  personalFolderCount,
  sharedFolderCount,
  workFolderCount,
}: FoldersViewProps) {
  const totalFolderCount = personalFolderCount + sharedFolderCount + workFolderCount

  return (
    <section className="screen portfolio-screen folders-screen">
      <ViewHeader
        description="Personal, shared, and work folders stay together here, ordered as breathable workflow cards."
        label="Folders"
        title="Folder Workflows"
      />

      <div className="portfolio-board folders-board">
        <section className="portfolio-projects-panel">
          <div className="portfolio-panel-header">
            <div>
              <h2>Folders</h2>
              <p>All folder types in one calm board, with filters when you need focus.</p>
            </div>
            <div className="portfolio-stats" aria-label="Folder totals">
              <span>
                <strong>{personalFolderCount}</strong>
                Personal
              </span>
              <span>
                <strong>{workFolderCount}</strong>
                Work
              </span>
              <span>
                <strong>{sharedFolderCount}</strong>
                Shared
              </span>
              <span>
                <strong>{totalFolderCount}</strong>
                Total
              </span>
            </div>
          </div>
          {folderList}
          {folderCreateForm}
        </section>

        <aside className="portfolio-side-panel folder-overview-panel">
          {folderDetail}
        </aside>
      </div>
    </section>
  )
}
