import type { Task, TaskMember } from '../../lib/growtData'
import { MemberPicker } from '../members/MemberPicker'

type TaskMembersPanelProps = {
  currentUserId: string
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  members: TaskMember[]
  onAddMember: (task: Task, username: string) => Promise<void> | void
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
  const canManageMembers = task.owner_id === currentUserId

  if (task.folder_id || task.category !== 'shared') {
    return null
  }

  async function handleAddMember(username: string) {
    await onAddMember(task, username)
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
        <MemberPicker
          currentUserId={currentUserId}
          existingMemberIds={members.map((member) => member.user_id)}
          isDisabled={isSaving}
          label={`${task.title} task members`}
          onAddMember={handleAddMember}
          targetKey={`task:${task.id}`}
        />
      ) : null}
    </section>
  )
}
