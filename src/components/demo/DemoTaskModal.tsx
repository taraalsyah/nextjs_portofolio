'use client';

import React, { useState } from 'react';
import { useDemo, DemoTask, TaskStatus, TaskPriority } from '@/context/DemoContext';
import { X, Plus, Save } from 'lucide-react';
import styles from './demo.module.css';

interface DemoTaskModalProps {
  taskToEdit?: DemoTask | null;
  onClose: () => void;
}

export const DemoTaskModal: React.FC<DemoTaskModalProps> = ({ taskToEdit, onClose }) => {
  const { projects, users, createTask, updateTask } = useDemo();

  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [status, setStatus] = useState<TaskStatus>(taskToEdit?.status || 'OPEN');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'MEDIUM');
  const [projectId, setProjectId] = useState(taskToEdit?.projectId || projects[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState(taskToEdit?.assigneeId || users[0]?.id || '');
  const [dueDate, setDueDate] = useState(taskToEdit?.dueDate || new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState(taskToEdit?.dueTime || '17:00');
  const [category, setCategory] = useState(taskToEdit?.category || 'Feature');
  const [tags, setTags] = useState(taskToEdit?.tags || 'Demo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (taskToEdit) {
      updateTask(taskToEdit.id, {
        title,
        description,
        status,
        priority,
        projectId,
        assigneeId,
        dueDate,
        dueTime,
        category,
        tags,
      });
    } else {
      createTask({
        title,
        description,
        status,
        priority,
        projectId,
        assigneeId,
        dueDate,
        dueTime,
        category,
        tags,
      });
    }

    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            {taskToEdit ? `Edit Task (${taskToEdit.taskNumber})` : 'Buat Task Baru'}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Judul Task *</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Contoh: Implementasi Payment Gateway"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Deskripsi</label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              placeholder="Deskripsi detail pekerjaan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Project</label>
              <select className={styles.formSelect} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Assignee</label>
              <select className={styles.formSelect} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">-- Unassigned --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <select className={styles.formSelect} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                <option value="BACKLOG">Backlog</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Priority</label>
              <select className={styles.formSelect} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Due Date</label>
              <input type="date" className={styles.formInput} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Due Time</label>
              <input type="time" className={styles.formInput} value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </div>
          </div>

          <div className={styles.formFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Batal
            </button>
            <button type="submit" className={styles.primaryBlueBtn}>
              {taskToEdit ? <Save size={15} /> : <Plus size={15} />}
              {taskToEdit ? 'Simpan Perubahan' : 'Buat Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DemoTaskModal;
