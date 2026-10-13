import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { safeStorage } from '@/lib/safeStorage';
import { useCostStore } from '@/stores/costStore';
import { syncTaskEntries } from '@/lib/worklog';
import type { WorkTask } from '@/types/worklog';

interface WorkLogState {
  tasks: WorkTask[];
  addTask: (task: Omit<WorkTask, 'id'>) => string;
  updateTask: (id: string, updates: Partial<WorkTask>) => void;
  removeTask: (id: string) => void;
}

/** Keep the mirrored Coûts & ROI entries in step with the task. */
function mirror(taskId: string, task: WorkTask | null) {
  useCostStore.setState((state) => ({
    entries: syncTaskEntries(state.entries, taskId, task, uuidv4),
  }));
}

export const useWorkLogStore = create<WorkLogState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (draft) => {
        const task: WorkTask = { ...draft, id: uuidv4() };
        set((state) => ({ tasks: [...state.tasks, task] }));
        mirror(task.id, task);
        return task.id;
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
        const task = get().tasks.find((t) => t.id === id);
        if (task) mirror(id, task);
      },

      removeTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
        mirror(id, null);
      },
    }),
    {
      name: 'renovapp-worklog',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
