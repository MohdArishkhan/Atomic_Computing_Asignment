import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Column, Task } from '../types';

interface DevBoardState {
  columns: Column[];
  tasks: Task[];
  setColumns: (columns: Column[]) => void;
  setTasks: (tasks: Task[]) => void;
}

type LegacyTask = Omit<Task, 'columnId'> & {
  columnId?: Task['columnId'];
  columId?: Task['columnId'];
};

export const useDevBoardStore = create<DevBoardState>()(
  persist(
    (set) => ({
      columns: [],
      tasks: [],
      setColumns: (columns) => set({ columns }),
      setTasks: (tasks) => set({ tasks }),
    }),
    {
      name: 'devboard-ai-store',
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as {
          columns?: Column[];
          tasks?: LegacyTask[];
        };
        return {
          columns: state.columns || [],
          tasks: (state.tasks || []).map(({ columId, ...task }) => ({
            ...task,
            columnId: task.columnId ?? columId,
            priority: task.priority || 'medium',
          })),
        };
      },
    }
  )
);
