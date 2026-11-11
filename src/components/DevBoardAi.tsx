import { createPortal } from 'react-dom';
import { CloseIcon, PlusIcon } from '../icons';
import { ColumnContainer } from './ColumnContainer';
import { SortableContext } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { useDevBoardAi } from '../hooks/useDevBoardAi';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { BoardPreset, Column, Task, TaskPriority } from '../types';
import { useState } from 'react';

const presetValues: BoardPreset[] = [
  'custom',
  'software',
  'bugs',
  'content',
  'personal',
];

export const DevBoardAi = () => {
  const {
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
    hasUndo,
  } = useDevBoardAi();
  const [selectedPreset, setSelectedPreset] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSummaryPanelVisible, setIsSummaryPanelVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [showUndo, setShowUndo] = useState(false);
  const visibleTasks = tasks.filter((task) => {
    const searchTerm = search.trim().toLowerCase();
    const matchesSearch =
      !searchTerm ||
      [task.content, task.priority || 'medium', task.dueDate || '']
        .join(' ')
        .toLowerCase()
        .includes(searchTerm);
    const matchesPriority =
      priorityFilter === 'all' || (task.priority || 'medium') === priorityFilter;
    return matchesSearch && matchesPriority;
  });
  const confirmDelete = (message: string, action: () => void) => {
    if (!window.confirm(message)) return;
    action();
    setShowUndo(true);
    window.setTimeout(() => setShowUndo(false), 5000);
  };
  const handleDeleteTask = (id: string | number) =>
    confirmDelete('Delete this task?', () => deleteTask(id));
  const handlePresetChange = (preset: string) => {
    const selected = presetValues.find((value) => value === preset);
    if (!selected) return;
    if (window.confirm('Replace the current board with this template?')) {
      applyPreset(selected);
    }
    setSelectedPreset('');
  };
  const handleGenerateSummary = async () => {
    setIsSummaryPanelVisible(true);
    setIsSummarizing(true);
    setSummaryError('');
    try {
      setSummary(await generateAiSummary());
    } catch (error) {
      setSummaryError(
        error instanceof Error ? error.message : 'Unable to generate a summary.'
      );
    } finally {
      setIsSummarizing(false);
    }
  };
  return (
    <div className='min-h-screen w-full overflow-x-auto bg-slate-50'>
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <header className='mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-6 lg:px-10'>
          <div className='flex items-center gap-2.5'>
            <span className='h-2.5 w-2.5 rounded-full bg-blue-600' />
            <h1 className='text-lg font-semibold tracking-tight text-slate-900'>
              DevBoardAi
            </h1>
          </div>
          <div className='flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end'>
            <label className='sr-only' htmlFor='board-preset'>
              Choose a board template
            </label>
            <select
              id='board-preset'
              value={selectedPreset}
              onChange={(event) => handlePresetChange(event.target.value)}
              className='min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-600 shadow-sm outline-none transition hover:border-blue-300 focus:border-blue-500 sm:flex-none sm:px-3'
            >
              <option value=''>Use a template...</option>
              <option value='custom'>Custom board (start fresh)</option>
              <option value='software'>Software development</option>
              <option value='bugs'>Bug tracking</option>
              <option value='content'>Content workflow</option>
              <option value='personal'>Personal planning</option>
              
            </select>
            <button
              type='button'
              onClick={handleGenerateSummary}
              disabled={isSummarizing}
              className='shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60'
            >
              {isSummarizing ? 'Summarizing...' : 'AI summary'}
            </button>
            <div className='hidden text-right text-sm sm:block'>
              <span className='font-semibold text-slate-800'>{columns.length}</span>
              <span className='text-slate-400'> columns</span>
              <span className='mx-2 text-slate-300'>|</span>
              <span className='font-semibold text-slate-800'>{tasks.length}</span>
              <span className='text-slate-400'> tasks</span>
            </div>
          </div>
        </header>
        {isSummaryPanelVisible && (summary || summaryError || isSummarizing) && (
          <section className='mx-auto max-w-[1800px] px-3 pt-4 sm:px-6 lg:px-10'>
            <div className='rounded-xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5'>
              <div className='mb-2 flex items-center justify-between'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.16em] text-blue-600'>
                    Board intelligence
                  </p>
                  <h2 className='mt-1 text-base font-semibold text-slate-900'>
                    Progress summary
                  </h2>
                </div>
                <button
                  type='button'
                  aria-label='Close AI summary'
                  onClick={() => setIsSummaryPanelVisible(false)}
                  className='rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700'
                >
                  <CloseIcon />
                </button>
              </div>
              {isSummarizing && (
                <p className='text-sm text-slate-500'>
                  Reviewing columns, tasks, and current flow...
                </p>
              )}
              {summaryError && (
                <p className='text-sm text-red-600'>{summaryError}</p>
              )}
              {summary && (
                <p className='max-w-4xl whitespace-pre-wrap text-sm leading-6 text-slate-600'>
                  {summary}
                </p>
              )}
            </div>
          </section>
        )}
        <div className='mx-auto flex max-w-[1800px] flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-6 lg:px-10'>
          <label className='w-full sm:max-w-xs sm:flex-1'>
            <span className='sr-only'>Search tasks</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Search tasks...'
              className='w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500'
            />
          </label>
          <div className='flex w-full items-center gap-2 sm:w-auto'>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as 'all' | TaskPriority)}
              className='min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none transition focus:border-blue-500 sm:flex-none'
              aria-label='Filter by priority'
            >
              <option value='all'>All priorities</option>
              <option value='high'>High priority</option>
              <option value='medium'>Medium priority</option>
              <option value='low'>Low priority</option>
            </select>
            {(search || priorityFilter !== 'all') && (
              <button
                type='button'
                onClick={() => {
                  setSearch('');
                  setPriorityFilter('all');
                }}
                className='rounded-lg px-2 py-2 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-blue-600'
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <main className='mx-auto flex max-w-[1800px] gap-4 px-3 py-4 sm:px-6 sm:py-6 lg:px-10'>
          <div className='flex min-h-[calc(100vh-110px)] gap-4'>
            <SortableContext items={columnsId}>
              {columns.map((column: Column, index) => (
                <ColumnContainer
                  key={column.id}
                  column={column}
                  position={index}
                  deleteColumn={(id) =>
                    confirmDelete('Delete this column and all its tasks?', () =>
                      deleteColumn(id)
                    )
                  }
                  updateColumn={updateColumn}
                  createTask={createTask}
                  deleteTask={handleDeleteTask}
                  updateTask={updateTask}
                  tasks={                  visibleTasks.filter(
                    (task: Task) => task.columnId === column.id
                  )}
                />
              ))}
            </SortableContext>
          </div>
          <button
            onClick={createColumn}
            className='flex h-[500px] w-[min(300px,calc(100vw-1.5rem))] min-w-[min(300px,calc(100vw-1.5rem))] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm font-semibold text-slate-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600'
          >
            <span className='rounded-full border border-slate-200 bg-slate-50 p-2'>
              <PlusIcon />
            </span>
            Add a column
          </button>
        </main>
        {showUndo && hasUndo && (
          <div className='fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-xl'>
            <span>Item deleted</span>
            <button
              type='button'
              onClick={() => {
                undoDelete();
                setShowUndo(false);
              }}
              className='font-semibold text-blue-300 hover:text-blue-200'
            >
              Undo
            </button>
          </div>
        )}
        {createPortal(
          <DragOverlay>
            {activeColumn && (
              <ColumnContainer
                column={activeColumn}
                position={columns.findIndex((column) => column.id === activeColumn.id)}
                deleteColumn={(id) =>
                  confirmDelete('Delete this column and all its tasks?', () =>
                    deleteColumn(id)
                  )
                }
                updateColumn={updateColumn}
                createTask={createTask}
                deleteTask={handleDeleteTask}
                updateTask={updateTask}
                tasks={visibleTasks.filter(
                  (task: Task) => task.columnId === activeColumn.id
                )}
              />
            )}
            {activeTask && (
              <TaskCard
                task={activeTask}
                deleteTask={handleDeleteTask}
                updateTask={updateTask}
              />
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
};
