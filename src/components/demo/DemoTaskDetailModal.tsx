'use client';

import React, { useState } from 'react';
import {
  useDemo,
  DemoTask,
  TaskStatus,
} from '@/context/DemoContext';
import {
  X,
  Edit2,
  User,
  Tag,
  Hash,
  Calendar,
  CheckSquare,
  MessageSquare,
  Paperclip,
  History,
  Plus,
  Trash2,
} from 'lucide-react';
import styles from './demo.module.css';

interface DemoTaskDetailModalProps {
  task: DemoTask;
  onClose: () => void;
  onEdit: (task: DemoTask) => void;
}

type ModalTab = 'info' | 'checklist' | 'comments' | 'attachments' | 'history';

export const DemoTaskDetailModal: React.FC<DemoTaskDetailModalProps> = ({
  task,
  onClose,
  onEdit,
}) => {
  const {
    checklists,
    comments,
    moveTaskStatus,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addComment,
    deleteComment,
  } = useDemo();

  const [activeTab, setActiveTab] = useState<ModalTab>('info');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  const taskChecklists = checklists.filter((c) => c.taskId === task.id);
  const taskComments = comments.filter((c) => c.taskId === task.id);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    moveTaskStatus(task.id, newStatus);
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    addChecklistItem(task.id, newChecklistText.trim());
    setNewChecklistText('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(task.id, 'Tara Alsyah Icode', newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.taskDetailModalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header Row matching Screenshot */}
        <div className={styles.detailHeaderRow}>
          <div>
            <div className={styles.detailTaskNum}>{task.taskNumber}</div>
            <h3 className={styles.detailTaskTitle}>{task.title}</h3>
          </div>

          <div className={styles.detailHeaderActions}>
            <button
              className={styles.iconSquareBtn}
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              title="Edit Task"
            >
              <Edit2 size={15} />
            </button>
            <button className={styles.iconSquareBtn} onClick={onClose} title="Tutup Modal">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal Subnav Tabs matching Screenshot */}
        <div className={styles.detailTabsBar}>
          <button
            className={`${styles.detailTabItem} ${activeTab === 'info' ? styles.detailTabActive : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Informasi Umum
          </button>
          <button
            className={`${styles.detailTabItem} ${activeTab === 'checklist' ? styles.detailTabActive : ''}`}
            onClick={() => setActiveTab('checklist')}
          >
            Checklist ({taskChecklists.length})
          </button>
          <button
            className={`${styles.detailTabItem} ${activeTab === 'comments' ? styles.detailTabActive : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            Komentar ({taskComments.length})
          </button>
          <button
            className={`${styles.detailTabItem} ${activeTab === 'attachments' ? styles.detailTabActive : ''}`}
            onClick={() => setActiveTab('attachments')}
          >
            Lampiran (0)
          </button>
          <button
            className={`${styles.detailTabItem} ${activeTab === 'history' ? styles.detailTabActive : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Riwayat (1)
          </button>
        </div>

        {/* Tab 1: Informasi Umum (2-Column Grid matching Screenshot) */}
        {activeTab === 'info' && (
          <div className={styles.detailInfoGrid}>
            {/* Status Workflow */}
            <div className={styles.detailInfoBox}>
              <div className={styles.detailBoxLabel}>Status Workflow</div>
              <div className={styles.detailBoxValue}>
                <select
                  value={task.status}
                  onChange={handleStatusChange}
                  className={styles.statusSelectInput}
                >
                  <option value="BACKLOG">● Backlog</option>
                  <option value="OPEN">● Open</option>
                  <option value="IN_PROGRESS">● In Progress</option>
                  <option value="DONE">● Done</option>
                </select>
              </div>
            </div>

            {/* Prioritas */}
            <div className={styles.detailInfoBox}>
              <div className={styles.detailBoxLabel}>Prioritas</div>
              <div className={styles.detailBoxValue}>
                <span className={styles.priorityMediumBadge}>
                  {task.priority || 'MEDIUM'}
                </span>
              </div>
            </div>

            {/* Assignee (Penanggung Jawab) */}
            <div className={styles.detailInfoBox}>
              <div className={styles.detailBoxLabel}>Assignee (Penanggung Jawab)</div>
              <div className={styles.detailBoxValue}>
                <User size={15} color="#64748b" />
                <span>{task.assigneeName || 'Tara Alsyah Icode'}</span>
              </div>
            </div>

            {/* Reporter (Dibuat Oleh) */}
            <div className={styles.detailInfoBox}>
              <div className={styles.detailBoxLabel}>Reporter (Dibuat Oleh)</div>
              <div className={styles.detailBoxValue}>
                <User size={15} color="#64748b" />
                <span>Tara Alsyah Icode</span>
              </div>
            </div>

            {/* Kategori */}
            <div className={styles.detailInfoBox}>
              <div className={styles.detailBoxLabel}>Kategori</div>
              <div className={styles.detailBoxValue}>
                <Tag size={14} color="#d97706" />
                <span>{task.category || 'Enhancement'}</span>
              </div>
            </div>

            {/* Tags */}
            <div className={styles.detailInfoBox}>
              <div className={styles.detailBoxLabel}>Tags</div>
              <div className={styles.detailBoxValue}>
                <Hash size={14} color="#64748b" />
                <span>{task.tags || '-'}</span>
              </div>
            </div>

            {/* Start Date */}
            <div className={styles.detailInfoBox}>
              <div className={styles.detailBoxLabel}>Start Date</div>
              <div className={styles.detailBoxValue}>
                <Calendar size={14} color="#64748b" />
                <span>31 Agu 2026</span>
              </div>
            </div>

            {/* Due Date (Deadline) */}
            <div className={styles.detailInfoBox}>
              <div className={styles.detailBoxLabel}>Due Date (Deadline)</div>
              <div className={styles.detailBoxValue}>
                <Calendar size={14} color="#64748b" />
                <span>{task.dueDate || '-'}</span>
              </div>
            </div>

            {/* Deskripsi Lengkap (Full-Width Row at Bottom) */}
            <div className={styles.detailInfoBox} style={{ gridColumn: 'span 2' }}>
              <div className={styles.detailBoxLabel}>Deskripsi Lengkap</div>
              <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 500, lineHeight: 1.5 }}>
                {task.description || 'User guest bisa cobain tanpa harus login'}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Checklist */}
        {activeTab === 'checklist' && (
          <div>
            <form onSubmit={handleAddChecklist} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="+ Tambah item checklist demo..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
              />
              <button type="submit" className={styles.primaryBlueBtn}>
                <Plus size={14} /> Tambah
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {taskChecklists.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem', fontSize: '0.875rem' }}>
                  Belum ada item checklist.
                </div>
              ) : (
                taskChecklists.map((chk) => (
                  <div
                    key={chk.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: chk.isCompleted ? '#94a3b8' : '#0f172a', textDecoration: chk.isCompleted ? 'line-through' : 'none' }}>
                      <input
                        type="checkbox"
                        checked={chk.isCompleted}
                        onChange={() => toggleChecklistItem(chk.id)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      {chk.title}
                    </label>
                    <button
                      onClick={() => deleteChecklistItem(chk.id)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 2 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Komentar */}
        {activeTab === 'comments' && (
          <div>
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Tulis komentar demo..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
              />
              <button type="submit" className={styles.primaryBlueBtn}>
                Kirim
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {taskComments.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem', fontSize: '0.875rem' }}>
                  Belum ada komentar pada task ini.
                </div>
              ) : (
                taskComments.map((com) => (
                  <div
                    key={com.id}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{com.userName}</span>
                      <button onClick={() => deleteComment(com.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155' }}>{com.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Lampiran */}
        {activeTab === 'attachments' && (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <Paperclip size={24} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Tidak ada lampiran</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Fitur unggah lampiran aktif pada akun produksi TaskTuntas.</div>
          </div>
        )}

        {/* Tab 5: Riwayat */}
        {activeTab === 'history' && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>
              <History size={15} color="#2563eb" /> Task dibuat pada {new Date(task.createdAt).toLocaleDateString('id-ID')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoTaskDetailModal;
