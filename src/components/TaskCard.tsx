import { FocusEvent, useRef, useState } from 'react';
import { TrashIcon } from '../icons';
import { ID, Task, TaskPriority } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  task: Task;
  deleteTask: (id: ID) => void;
  updateTask: (id: ID, updates: Partial<Task>) => void;
}
export const TaskCard = ({ task, deleteTask, updateTask }: Props) => {
  const [isMouseOver, setIsMouseOver] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const editContainerRef = useRef<HTMLDivElement>(null);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
    disabled: isEditMode,
  });
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };
  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
    setIsMouseOver(false);
  };
  const handleEditorBlur = (event: FocusEvent<HTMLTextAreaElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && editContainerRef.current?.contains(nextTarget)) return;
    setIsEditMode(false);
  };
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className='relative flex min-h-[100px] cursor-grab items-center rounded-lg border-2 border-blue-400 bg-white p-3 text-left opacity-30'
      ></div>
    );
  }
  if (isEditMode) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className='relative flex min-h-[150px] cursor-grab items-center rounded-lg border border-blue-300 bg-white p-3 text-left shadow-lg shadow-slate-200/60'
      >
        <div ref={editContainerRef} className='flex w-full flex-col gap-2'>
          <textarea
            value={task.content}
            autoFocus
            placeholder='Task content here'
            onBlur={handleEditorBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey) toggleEditMode();
            }}
            onChange={(e) => updateTask(task.id, { content: e.target.value })}
            className='min-h-20 w-full resize-none rounded border-none bg-transparent text-sm leading-6 text-slate-900 focus:outline-none'
          />
          <div className='flex flex-wrap gap-2'>
            <select
              value={task.priority || 'medium'}
              onChange={(e) =>
                updateTask(task.id, {
                  priority: e.target.value as TaskPriority,
                })
              }
              className='min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-600'
            >
              <option value='low'>Low priority</option>
              <option value='medium'>Medium priority</option>
              <option value='high'>High priority</option>
            </select>
            <input
              type='date'
              value={task.dueDate || ''}
              onChange={(e) =>
                updateTask(task.id, { dueDate: e.target.value || undefined })
              }
              className='min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-600'
            />
          </div>
          <p className='text-xs text-slate-400'>Shift+Enter to save</p>
        </div>
      </div>
    );
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={toggleEditMode}
      onMouseEnter={() => setIsMouseOver(true)}
      onMouseLeave={() => setIsMouseOver(false)}
      className='task relative flex min-h-[100px] cursor-grab items-center rounded-lg border border-slate-200 bg-white p-3 pr-12 text-left shadow-sm transition hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/70'
    >
      <div className='flex w-full flex-col gap-2'>
        <p className='whitespace-pre-wrap break-words text-sm leading-6 text-slate-700'>
          {task.content}
        </p>
        <div className='flex items-center gap-2 text-xs'>
          <span className={`rounded-full px-2 py-0.5 font-medium ${
            task.priority === 'high'
              ? 'bg-red-50 text-red-600'
              : task.priority === 'low'
                ? 'bg-slate-100 text-slate-500'
                : 'bg-blue-50 text-blue-600'
          }`}>
            {task.priority || 'medium'}
          </span>
          {task.dueDate && (
            <span className='text-slate-400'>Due {task.dueDate}</span>
          )}
        </div>
      </div>
      {isMouseOver && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            deleteTask(task.id);
          }}
          aria-label='Delete task'
          className='absolute right-3 top-3 rounded bg-slate-100 p-2 text-slate-500 opacity-100 transition hover:bg-red-50 hover:text-red-600'
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
};
