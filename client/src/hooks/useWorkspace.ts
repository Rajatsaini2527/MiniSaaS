import { useAppSelector, useAppDispatch } from './useAppSelector';
import { setActiveWorkspace } from '../store/workspaceSlice';

export function useWorkspace() {
  const dispatch = useAppDispatch();
  const { activeWorkspaceId, workspaces } = useAppSelector((s) => s.workspace);
  const activeWorkspace = workspaces.find((w) => w._id === activeWorkspaceId) ?? null;

  return {
    activeWorkspaceId,
    activeWorkspace,
    workspaces,
    switchWorkspace: (id: string) => dispatch(setActiveWorkspace(id)),
  };
}
