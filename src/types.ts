export interface Column {
  id: ID;
  title: string;
}

export type ID = string | number;

export interface Task {
  id: ID;
  columnId: ID;
  content: string;
  priority: TaskPriority;
  dueDate?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type BoardPreset = 'software' | 'bugs' | 'content' | 'personal' | 'custom';
