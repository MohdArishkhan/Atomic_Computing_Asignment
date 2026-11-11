import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TrashIcon } from '../icons/TrashIcon';
import { Column, ID, Task } from '../types';
import { useMemo, useState } from 'react';
import { PlusIcon } from '../icons';
import { TaskCard } from './TaskCard';

interface Props {
  column: Column;
  position: number;
  deleteColumn: (id: ID) => void;
  updateColumn: (id: ID, title: string) => void;
  createTask: (columnId: ID) => void;
  deleteTask: (id: ID) => void;
  updateTask: (id: ID, updates: Partial<Task>) => void;
  tasks: Task[];
}
export const ColumnContainer = ({
  column,
  position,
  deleteColumn,
  updateColumn,
  createTask,
  deleteTask,
  updateTask,
  tasks,
}: Props) => {
  const [editMode, setEditMode] = useState(false);
  const tasksIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
    disabled: editMode,
  });
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className='flex h-[500px] max-h-[500px] w-[min(300px,calc(100vw-1.5rem))] min-w-[min(300px,calc(100vw-1.5rem))] flex-col rounded-xl border-2 border-blue-400 bg-white opacity-40'
      ></div>
    );
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex h-[500px] max-h-[500px] w-[min(300px,calc(100vw-1.5rem))] min-w-[min(300px,calc(100vw-1.5rem))] flex-col rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60'
    >
      <div
        {...attributes}
        {...listeners}
        onClick={() => setEditMode(true)}
        className='flex h-[68px] !cursor-grab items-center justify-between rounded-t-xl border-b border-slate-200 bg-white px-4 py-3'
      >
        <div className='flex min-w-0 items-center gap-3'>
          <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600'>
            {position + 1}
          </div>
          {!editMode && (
            <span className='truncate text-sm font-semibold text-slate-800'>
              {column.title}
            </span>
          )}
          {editMode && (
            <input
              className='w-full rounded border border-blue-400 bg-white px-2 py-1 text-sm text-slate-900 outline-none'
              value={column.title}
              onChange={(e) => updateColumn(column.id, e.target.value)}
              autoFocus
              onBlur={() => setEditMode(false)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                setEditMode(false);
              }}
            />
          )}
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            deleteColumn(column.id);
          }}
          aria-label={`Delete ${column.title} column`}
          className='rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600'
        >
          <TrashIcon />
        </button>
      </div>
      <div className='flex flex-grow flex-col gap-3 overflow-x-hidden overflow-y-auto p-3'>
        {tasks.length === 0 && (
          <p className='rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-400'>
            No tasks yet
          </p>
        )}
        <SortableContext items={tasksIds}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              deleteTask={deleteTask}
              updateTask={updateTask}
            />
          ))}
        </SortableContext>
      </div>
      <button
        onClick={() => createTask(column.id)}
        className='flex items-center gap-2 border-t border-slate-200 px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-blue-50 hover:text-blue-600'
      >
        <PlusIcon />
        Add task
      </button>
    </div>
  );
};
