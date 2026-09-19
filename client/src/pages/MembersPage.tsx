import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, MoreHorizontal, UserX } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Dropdown } from '../components/ui/Dropdown';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useWorkspaceMembers, useAddMember, useRemoveMember, useUpdateMemberRole } from '../features/workspaces/hooks';
import { useWorkspace } from '../hooks/useWorkspace';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/format';
import type { WorkspaceMember } from '../types';

const schema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'member', 'guest']).default('member'),
});
type Form = z.infer<typeof schema>;

const ROLE_VARIANT = { owner: 'primary', admin: 'warning', member: 'default', guest: 'info' } as const;

export default function MembersPage() {
  const { activeWorkspaceId } = useWorkspace();
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null);

  const { data: members, isLoading } = useWorkspaceMembers(activeWorkspaceId);
  const addMember = useAddMember(activeWorkspaceId!);
  const removeMember = useRemoveMember(activeWorkspaceId!);
  const updateRole = useUpdateMemberRole(activeWorkspaceId!);

  const myRole = members?.find((m) => {
    const uid = typeof m.userId === 'object' ? (m.userId as { _id: string })._id : m.userId;
    return uid === user?._id;
  })?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  function onSubmit(data: Form) {
    addMember.mutate(data, { onSuccess: () => { reset(); setInviteOpen(false); } });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members?.length ?? 0} member{members?.length !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <Button icon={<UserPlus size={16} />} onClick={() => setInviteOpen(true)} disabled={!activeWorkspaceId}>
            Invite Member
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-5"><TableSkeleton /></div>
        ) : !members?.length ? (
          <EmptyState title="No members" description="Invite people to collaborate." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Member</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Joined</th>
                {canManage && <th className="px-3 py-3 w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {members.map((member) => {
                const memberUser = typeof member.userId === 'object' ? member.userId as { _id: string; name: string; email: string; avatar?: string | null } : null;
                const isMe = memberUser?._id === user?._id;
                return (
                  <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={memberUser?.name ?? 'User'} src={memberUser?.avatar} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{memberUser?.name ?? '—'} {isMe && <span className="text-xs text-gray-400">(you)</span>}</p>
                          <p className="text-xs text-gray-400">{memberUser?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={ROLE_VARIANT[member.role] ?? 'default'}>{member.role}</Badge>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-gray-500 text-xs">{formatDate(member.joinedAt)}</td>
                    {canManage && (
                      <td className="px-3 py-3">
                        {member.role !== 'owner' && !isMe && (
                          <Dropdown
                            trigger={<button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400" aria-label="Member options"><MoreHorizontal size={15} /></button>}
                            items={[
                              { label: 'Make admin', onClick: () => updateRole.mutate({ memberId: member._id, role: 'admin' }), disabled: member.role === 'admin' },
                              { label: 'Make member', onClick: () => updateRole.mutate({ memberId: member._id, role: 'member' }), disabled: member.role === 'member' },
                              { label: 'Make guest', onClick: () => updateRole.mutate({ memberId: member._id, role: 'guest' }), disabled: member.role === 'guest' },
                              { label: 'Remove', icon: <UserX size={14} />, onClick: () => setRemoveTarget(member), danger: true },
                            ]}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Member" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Email address" type="email" error={errors.email?.message} {...register('email')} autoFocus />
          <Select label="Role" options={[
            { value: 'member', label: 'Member' },
            { value: 'admin', label: 'Admin' },
            { value: 'guest', label: 'Guest' },
          ]} {...register('role')} />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={addMember.isPending}>Invite</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => { if (removeTarget) removeMember.mutate(removeTarget._id, { onSuccess: () => setRemoveTarget(null) }); }}
        title="Remove member"
        message="Remove this member from the workspace?"
        confirmLabel="Remove"
        loading={removeMember.isPending}
      />
    </div>
  );
}
