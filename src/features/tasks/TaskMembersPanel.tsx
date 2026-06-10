import type { Task, TaskMember } from '../../lib/growtData'
import { MemberPicker } from '../members/MemberPicker'
import { Users, X } from 'lucide-react'

import { UserAvatar } from '../../components/UserAvatar'

type TaskMembersPanelProps = {
  currentUserId: string
  getProfileAvatar: (userId: string) => string | null
  getProfileLabel: (userId: string) => string
  isSaving: boolean
  members: TaskMember[]
  onAddMember: (task: Task, username: string) => Promise<void> | void
  onRemoveMember: (task: Task, userId: string) => void
  task: Task
}

export function TaskMembersPanel({
  currentUserId,
  getProfileAvatar,
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
    <>
      <div className="stitch-panel__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} className="stitch-panel__icon" />
          <h3 className="stitch-panel__title">Task Members</h3>
          <span className="stitch-count-badge">{members.length}</span>
        </div>
      </div>
      <div className="stitch-panel__body">
        <div className="stitch-member-list">
          {members.map((member) => (
            <div className="stitch-member-row" key={member.id}>
              <div className="flex items-center gap-2">
                <UserAvatar label={getProfileLabel(member.user_id)} avatarUrl={getProfileAvatar(member.user_id)} className="w-6 h-6 text-[10px]" />
                <span className="stitch-member-name">{getProfileLabel(member.user_id)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-md text-on-surface-variant text-[11px] uppercase tracking-wider">{member.role}</span>
                {canManageMembers && member.role !== 'owner' ? (
                  <button
                    className="text-error hover:bg-error/10 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    disabled={isSaving}
                    onClick={() => onRemoveMember(task, member.user_id)}
                    type="button"
                    title="Remove member"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {!members.length && <span className="text-center text-on-surface-variant py-2 font-body-md text-sm">Owner only</span>}
        </div>
        {canManageMembers && (
          <div className="mt-4 border-t border-surface-variant/50 pt-4">
            <MemberPicker
              currentUserId={currentUserId}
              existingMemberIds={members.map((member) => member.user_id)}
              isDisabled={isSaving}
              label="Invite member"
              onAddMember={handleAddMember}
              targetKey={`task:${task.id}`}
            />
          </div>
        )}
      </div>
    </>
  )
}
