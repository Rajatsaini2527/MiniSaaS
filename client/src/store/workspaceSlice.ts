import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Workspace } from '../types';

interface WorkspaceState {
  activeWorkspaceId: string | null;
  workspaces: Workspace[];
}

const STORAGE_KEY = 'activeWorkspaceId';

const initialState: WorkspaceState = {
  activeWorkspaceId: localStorage.getItem(STORAGE_KEY),
  workspaces: [],
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveWorkspace(state, action: PayloadAction<string>) {
      state.activeWorkspaceId = action.payload;
      localStorage.setItem(STORAGE_KEY, action.payload);
    },
    setWorkspaces(state, action: PayloadAction<Workspace[]>) {
      state.workspaces = action.payload;
      // Auto-select first workspace if none active
      if (!state.activeWorkspaceId && action.payload.length > 0) {
        state.activeWorkspaceId = action.payload[0]._id;
        localStorage.setItem(STORAGE_KEY, action.payload[0]._id);
      }
    },
    clearWorkspaceState(state) {
      state.activeWorkspaceId = null;
      state.workspaces = [];
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const { setActiveWorkspace, setWorkspaces, clearWorkspaceState } = workspaceSlice.actions;
export default workspaceSlice.reducer;
