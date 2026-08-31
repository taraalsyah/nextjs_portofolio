'use client';

import React, { useState } from 'react';
import { DemoProvider, useDemo, DemoTask, DemoProject, TaskStatus } from '@/context/DemoContext';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { DemoKanbanBoard } from '@/components/demo/DemoKanbanBoard';
import { DemoCalendarView } from '@/components/demo/DemoCalendarView';
import { DemoTaskModal } from '@/components/demo/DemoTaskModal';
import { DemoTaskDetailModal } from '@/components/demo/DemoTaskDetailModal';
import { DemoProjectModal } from '@/components/demo/DemoProjectModal';
import {
  ListTodo,
  User,
  Kanban,
  Calendar,
  FolderKanban,
  BarChart3,
  Edit2,
  Trash2,
  Eye,
  Plus,
} from 'lucide-react';
import styles from '@/components/demo/demo.module.css';

type SubnavTab = 'all' | 'my' | 'kanban' | 'calendar' | 'categories' | 'reports';

function TaskManagementContent() {
  const {
    projects,
    tasks,
    checklists,
    activeProjectId,
    deleteProject,
    deleteTask,
  } = useDemo();

  const [activeTab, setActiveTab] = useState<SubnavTab>('kanban');
  const [searchTerm, setSearchTerm] = useState('');

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<DemoTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<DemoTask | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<DemoProject | null>(null);

  const filteredTasks = tasks.filter((t) => {
    if (activeProjectId !== 'ALL' && t.projectId !== activeProjectId) return false;
    if (activeTab === 'my' && t.assigneeId !== 'user-1') return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchNum = t.taskNumber.toLowerCase().includes(q);
      if (!matchTitle && !matchNum) return false;
    }
    return true;
  });

  const handleOpenCreateTask = () => {
    setTaskToEdit(null);
    setTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: DemoTask) => {
    setTaskToEdit(task);
    setTaskModalOpen(true);
  };

  const handleDeleteTask = (task: DemoTask) => {
    if (confirm(`Hapus task "${task.title}" dari demo?`)) {
      deleteTask(task.id);
    }
  };

  const renderStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'BACKLOG':
        return (
          <span style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.15rem 0.55rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.03em' }}>
            BACKLOG
          </span>
        );
      case 'OPEN':
        return (
          <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.15rem 0.55rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.03em' }}>
            OPEN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '0.15rem 0.55rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.03em' }}>
            IN PROGRESS
          </span>
        );
      case 'DONE':
        return (
          <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.15rem 0.55rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.03em' }}>
            DONE
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Horizontal Subnav Tabs matching Screenshot */}
      <div className={styles.subnavTabsBar} style={{ margin: '-1.5rem -1.5rem 1.5rem -1.5rem' }}>
        <button
          className={`${styles.subnavTabItem} ${activeTab === 'all' ? styles.subnavTabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <ListTodo size={16} /> All Tasks
        </button>
        <button
          className={`${styles.subnavTabItem} ${activeTab === 'my' ? styles.subnavTabActive : ''}`}
          onClick={() => setActiveTab('my')}
        >
          <User size={16} /> My Tasks
        </button>
        <button
          className={`${styles.subnavTabItem} ${activeTab === 'kanban' ? styles.subnavTabActive : ''}`}
          onClick={() => setActiveTab('kanban')}
        >
          <Kanban size={16} /> Kanban Board
        </button>
        <button
          className={`${styles.subnavTabItem} ${activeTab === 'calendar' ? styles.subnavTabActive : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={16} /> Calendar
        </button>
        <button
          className={`${styles.subnavTabItem} ${activeTab === 'categories' ? styles.subnavTabActive : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <FolderKanban size={16} /> Categories
        </button>
        <button
          className={`${styles.subnavTabItem} ${activeTab === 'reports' ? styles.subnavTabActive : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <BarChart3 size={16} /> Reports
        </button>
      </div>

      {/* Kanban Board View */}
      {(activeTab === 'kanban' || activeTab === 'my') && (
        <DemoKanbanBoard
          onSelectTask={(task) => setSelectedTask(task)}
          onOpenCreateTask={handleOpenCreateTask}
        />
      )}

      {/* All Tasks Table View matching Screenshot */}
      {activeTab === 'all' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', width: 320 }}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Cari task..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className={styles.primaryBlueBtn} onClick={handleOpenCreateTask}>
              <Plus size={16} /> Buat Task Baru
            </button>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>TASK NUMBER</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>TITLE</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>STATUS</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>PRIORITY</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>CATEGORY</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>ASSIGNEE</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>DUE DATE</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => {
                  const taskChk = checklists.filter((c) => c.taskId === t.id);
                  const completedChk = taskChk.filter((c) => c.isCompleted).length;

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setSelectedTask(t)}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{t.taskNumber}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{t.title}</div>
                        {taskChk.length > 0 && (
                          <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                            Checklist: {completedChk}/{taskChk.length} Selesai
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {renderStatusBadge(t.status)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={styles.priorityMediumBadge}>{t.priority || 'MEDIUM'}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#334155', fontWeight: 800, fontSize: '0.825rem' }}>
                        {t.category || 'Enhancement'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#334155', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                          <User size={13} color="#64748b" />
                          <span>{t.assigneeName || 'Tara Alsyah Icode'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#334155', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                          <Calendar size={13} color="#64748b" />
                          <span>{t.dueDate || '-'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button
                            className={styles.arrowBtn}
                            onClick={() => setSelectedTask(t)}
                            title="Lihat Detail"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className={styles.arrowBtn}
                            onClick={() => handleOpenEditTask(t)}
                            title="Edit Task"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className={styles.arrowBtn}
                            onClick={() => handleDeleteTask(t)}
                            title="Hapus Task"
                            style={{ color: '#dc2626' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <DemoCalendarView onSelectTask={(task) => setSelectedTask(task)} />
      )}

      {(activeTab === 'categories' || activeTab === 'reports') && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
          <h3 style={{ color: '#0f172a', fontWeight: 800 }}>Modul {activeTab === 'categories' ? 'Categories' : 'Reports'} Sandbox Demo</h3>
          <p style={{ margin: '0.5rem 0 1.5rem' }}>Tampilan modul sandbox interaktif tanpa koneksi server/database.</p>
          <button className={styles.primaryBlueBtn} onClick={() => setActiveTab('kanban')}>
            Kembali ke Kanban Board
          </button>
        </div>
      )}

      {/* Modals */}
      {taskModalOpen && (
        <DemoTaskModal taskToEdit={taskToEdit} onClose={() => setTaskModalOpen(false)} />
      )}

      {selectedTask && (
        <DemoTaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={(t) => handleOpenEditTask(t)}
        />
      )}

      {projectModalOpen && (
        <DemoProjectModal projectToEdit={projectToEdit} onClose={() => setProjectModalOpen(false)} />
      )}
    </div>
  );
}

export default function ExploreDemoTasksPage() {
  return (
    <DemoProvider>
      <DemoLayout pageTitle="Task Management">
        <TaskManagementContent />
      </DemoLayout>
    </DemoProvider>
  );
}
