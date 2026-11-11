import {
  useSensors,
  useSensor,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useState, useMemo } from 'react';
import { useDevBoardStore } from '../stores/devboard.store';
import { BoardPreset, Column, Task, ID, TaskPriority } from '../types';

const boardPresets: Record<
  BoardPreset,
  { columns: { title: string; tasks: string[] }[] }
> = {
  software: {
    columns: [
      { title: 'Backlog', tasks: ['Define project scope'] },
      { title: 'In progress', tasks: ['Set up development environment'] },
      { title: 'Review', tasks: ['Review pull requests'] },
      { title: 'Done', tasks: ['Create project brief'] },
    ],
  },
  bugs: {
    columns: [
      { title: 'Reported', tasks: ['Collect reproduction steps'] },
      { title: 'Investigating', tasks: ['Identify root cause'] },
      { title: 'Fix in progress', tasks: ['Prepare a fix'] },
      { title: 'Verified', tasks: ['Confirm fix in staging'] },
    ],
  },
  content: {
    columns: [
      { title: 'Ideas', tasks: ['Draft next campaign topic'] },
      { title: 'Drafting', tasks: ['Write first version'] },
      { title: 'Review', tasks: ['Check copy and visuals'] },
      { title: 'Published', tasks: ['Share with the audience'] },
    ],
  },
  personal: {
    columns: [
      { title: 'To do', tasks: ['Plan this week'] },
      { title: 'Today', tasks: ['Complete priority task'] },
      { title: 'Waiting', tasks: ['Follow up on open item'] },
      { title: 'Done', tasks: ['Celebrate progress'] },
    ],
  },
  custom: {
    columns: [],
  },
};
export const useDevBoardAi = () => {
  const columns = useDevBoardStore((state) => state.columns);
  const storedTasks = useDevBoardStore((state) => state.tasks);
  const tasks = useMemo(
    () => storedTasks.map((task) => ({ ...task, priority: task.priority || 'medium' })),
    [storedTasks]
  );
  const setColumns = useDevBoardStore((state) => state.setColumns);
  const setTasks = useDevBoardStore((state) => state.setTasks);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{
    columns: Column[];
    tasks: Task[];
  } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );
  const columnsId = useMemo(
    () => columns.map((column) => column.id),
    [columns]
  );
  const createTask = (columnId: ID) => {
    const newTask: Task = {
      id: generateId(),
      columnId,
      content: `Task ${tasks.length + 1}`,
      priority: 'medium',
    };
    setTasks([...tasks, newTask]);
  };

  const deleteTask = (id: ID) => {
    setLastDeleted({ columns, tasks });
    setTasks(tasks.filter((task) => task.id !== id));
  };
  const updateTask = (id: ID, updates: Partial<Task>) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        return { ...task, ...updates };
      }
      return task;
    });
    setTasks(updatedTasks);
  };
  const createColumn = () => {
    const columnToAdd: Column = {
      id: generateId(),
      title: `Column ${columns.length + 1}`,
    };
    setColumns([...columns, columnToAdd]);
  };

  const generateId = () => {
    return Math.floor(Math.random() * 10001);
  };
  const applyPreset = (preset: BoardPreset) => {
    const nextColumns = boardPresets[preset].columns.map(({ title }) => ({
      id: generateId(),
      title,
    }));
    const nextTasks = boardPresets[preset].columns.flatMap(
      ({ tasks: presetTasks }, columnIndex) =>
        presetTasks.map((content) => ({
          id: generateId(),
          columnId: nextColumns[columnIndex].id,
          content,
          priority: 'medium' as TaskPriority,
        }))
    );
    setColumns(nextColumns);
    setTasks(nextTasks);
  };
  const generateAiSummary = async () => {
    const boardData = columns.map((column) => ({
      column: column.title,
      tasks: tasks
        .filter((task) => task.columnId === column.id)
        .map((task) => task.content),
    }));
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ boardData }),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(error?.error || `AI summary request failed (${response.status}).`);
    }

    const data = (await response.json()) as { summary?: string };
    const summary = data.summary?.trim();
    if (!summary) {
      throw new Error('The AI response did not contain a summary.');
    }
    return summary;
  };
  const deleteColumn = (id: ID) => {
    setLastDeleted({ columns, tasks });
    const filteredColumns = columns.filter((column) => column.id !== id);
    setColumns(filteredColumns);
    const filteredTasks = tasks.filter((task) => task.columnId !== id);
    setTasks(filteredTasks);
  };
  const undoDelete = () => {
    if (!lastDeleted) return;
    setColumns(lastDeleted.columns);
    setTasks(lastDeleted.tasks);
    setLastDeleted(null);
  };

  const updateColumn = (id: ID, title: string) => {
    const updatedColumns = columns.map((column) => {
      if (column.id === id) {
        return { ...column, title };
      }
      return column;
    });
    setColumns(updatedColumns);
  };
  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Column') {
      setActiveColumn(event.active.data.current.column);
      return;
    }
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
      return;
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const activeColumId = active.id;
    const overColumId = over.id;
    if (activeColumId === overColumId) return;
    const activeColumnIndex = columns.findIndex(
      (column) => column.id === activeColumId
    );
    const overColumnIndex = columns.findIndex(
      (column) => column.id === overColumId
    );
    setColumns(arrayMove(columns, activeColumnIndex, overColumnIndex));
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';

    if (!isActiveATask) return;
    //Dropping a task over a another task
    if (isActiveATask && isOverATask) {
      const activeTaskIndex = tasks.findIndex((task) => task.id === activeId);
      const overTaskIndex = tasks.findIndex((task) => task.id === overId);
      tasks[activeTaskIndex].columnId = tasks[overTaskIndex].columnId;
      setTasks(arrayMove(tasks, activeTaskIndex, overTaskIndex));
    }
    const isOverAColumn = over.data.current?.type === 'Column';
    //Dropping a task over a column
    if (isActiveATask && isOverAColumn) {
      const activeTaskIndex = tasks.findIndex((task) => task.id === activeId);
      tasks[activeTaskIndex].columnId = overId;
      setTasks(arrayMove(tasks, activeTaskIndex, activeTaskIndex));
    }
  };
  return {
    sensors,
    onDragStart,
    onDragEnd,
    onDragOver,
    columns,
    columnsId,
    createColumn,
    applyPreset,
    generateAiSummary,
    deleteColumn,
    updateColumn,
    createTask,
    deleteTask,
    updateTask,
    tasks,
    activeColumn,
    activeTask,
    undoDelete,
    hasUndo: Boolean(lastDeleted),
  };
};
