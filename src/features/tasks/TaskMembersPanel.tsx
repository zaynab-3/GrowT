import { type FormEvent, useState } from 'react'
import type { Task, TaskMember } from '../../lib/growtData'

type TaskMembersPanelProps = {
  currentUserId: string
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  members: TaskMember[]
  onAddMember: (task: Task, username: string) => void
  onRemoveMember: (task: Task, userId: string) => void
  task: Task
}

export function TaskMembersPanel({
  currentUserId,
  getProfileLabel,
  isSaving,
  members,
  onAddMember,
  onRemoveMember,
  task,
}: TaskMembersPanelProps) {
  const [username, setUsername] = useState('')
  const canManageMembers = task.owner_id === currentUserId

  if (task.folder_id || task.category !== 'shared') {
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!username.trim()) {
      return
    }

    onAddMember(task, username.trim())
    setUsername('')
  }

  return (
    <section className="task-members-panel" aria-label={`${task.title} members`}>
      <div className="task-members-panel__heading">
        <span className="section-label">Members</span>
        <strong>{members.length}</strong>
      </div>
      <div className="member-summary__list">
        {members.map((member) => (
          <span className="member-chip" key={member.id}>
            <span>{getProfileLabel(member.user_id)}</span>
            <small>{member.role}</small>
            {canManageMembers && member.role !== 'owner' ? (
              <button
                className="chip-button"
                disabled={isSaving}
                onClick={() => onRemoveMember(task, member.user_id)}
                type="button"
              >
                Remove
              </button>
            ) : null}
          </span>
        ))}
        {!members.length ? <span className="empty-chip">Owner only</span> : null}
      </div>
      {canManageMembers ? (
        <form className="invite-form" onSubmit={handleSubmit}>
          <input
            aria-label="Standalone task member username"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="username"
            value={username}
          />
          <button className="button button--secondary" disabled={isSaving} type="submit">
            Add member
          </button>
        </form>
      ) : null}
    </section>
  )
}
