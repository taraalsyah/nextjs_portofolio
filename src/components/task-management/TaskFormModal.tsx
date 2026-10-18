'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, Plus } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { CustomDropdown, CustomDropdownOption } from '@/components/ui/CustomDropdown';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { DateTimePicker } from '@/components/ui/DateTimePicker';

export interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => Promise<void>;
  initialData?: any;
  categories: { id: number; name: string }[];
  users: { id: number; name: string }[];
}

const STATUS_FORM_OPTIONS: CustomDropdownOption[] = [
  { value: 'BACKLOG', label: 'Backlog', dotColor: '#94a3b8' },
  { value: 'IN_PROGRESS', label: 'In Progress', dotColor: '#3b82f6' },
  { value: 'IN_REVIEW', label: 'In Review', dotColor: '#a855f7' },
];

const PRIORITY_FORM_OPTIONS: CustomDropdownOption[] = [
  { value: 'LOW', label: 'Low', dotColor: '#10b981' },
  { value: 'MEDIUM', label: 'Medium', dotColor: '#f59e0b' },
  { value: 'HIGH', label: 'High', dotColor: '#ef4444' },
  { value: 'URGENT', label: 'Urgent', dotColor: '#dc2626' },
];

const DEFAULT_PHASE_SUGGESTIONS = [
  'Tanpa Phase',
  'Discovery & Planning',
  'Development',
  'Testing / QA',
  'Deployment / Release',
];

function parseToDateTimeValue(dateString: string | null | undefined, defaultTime = '00:00'): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
  users,
}: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('BACKLOG');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [phaseId, setPhaseId] = useState<number | null>(null);
  const [phase, setPhase] = useState('Tanpa Phase');
  const [projectPhases, setProjectPhases] = useState<{ id: number; name: string; order: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Task projects state
  const [taskProjects, setTaskProjects] = useState<{ id: number; name: string }[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectCreateError, setProjectCreateError] = useState<string | null>(null);

  // Phase creation state
  const [isCreatingPhase, setIsCreatingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [phaseCreateError, setPhaseCreateError] = useState<string | null>(null);

  // Fetch task projects when modal opens
  const fetchTaskProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/task-projects');
      if (res.ok) {
        const data = await res.json();
        setTaskProjects(data.taskProjects || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Fetch phases for currently selected taskProjectId
  const fetchPhasesForProject = useCallback(async (tpId: string) => {
    if (!tpId) {
      setProjectPhases([]);
      return;
    }
    try {
      const res = await fetch(`/api/task-phases?taskProjectId=${tpId}`);
      if (res.ok) {
        const data = await res.json();
        setProjectPhases(data.phases || []);
      }
    } catch {
      setProjectPhases([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTaskProjects();
    }
  }, [isOpen, fetchTaskProjects]);

  // When taskProjectId changes, fetch phases for that project
  useEffect(() => {
    if (taskProjectId) {
      fetchPhasesForProject(taskProjectId);
    } else {
      setProjectPhases([]);
    }
  }, [taskProjectId, fetchPhasesForProject]);

  useEffect(() => {
    const uncategorizedCat = categories.find((c) => c.name === 'Uncategorized');
    const defaultCatId = uncategorizedCat ? String(uncategorizedCat.id) : '';

    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setStatus(initialData.status || 'BACKLOG');
      setPriority(initialData.priority || 'MEDIUM');
      setAssigneeId(initialData.assigneeId ? String(initialData.assigneeId) : '');
      setCategoryId(initialData.categoryId ? String(initialData.categoryId) : defaultCatId);
      setTags(initialData.tags || '');
      setStartDate(initialData.startDate ? parseToDateTimeValue(initialData.startDate, '09:00') : '');
      setDueDate(initialData.dueDate ? parseToDateTimeValue(initialData.dueDate, '17:00') : '');
      const initTpId = initialData.taskProjectId ? String(initialData.taskProjectId) : '';
      setTaskProjectId(initTpId);
      const initPhase = initialData.phase && initialData.phase.trim() ? initialData.phase.trim() : 'Tanpa Phase';
      setPhase(initPhase);
      setPhaseId(initialData.phaseId || null);
      if (initTpId) {
        fetchPhasesForProject(initTpId);
      }
    } else {
      setTitle('');
      setDescription('');
      setStatus('BACKLOG');
      setPriority('MEDIUM');
      setAssigneeId('');
      setCategoryId(defaultCatId);
      setTags('');
      setStartDate('');
      setDueDate('');
      setTaskProjectId('');
      setPhase('Tanpa Phase');
      setPhaseId(null);
      setProjectPhases([]);
    }
    setError(null);
    setIsCreatingProject(false);
    setNewProjectName('');
    setProjectCreateError(null);
    setIsCreatingPhase(false);
    setNewPhaseName('');
    setPhaseCreateError(null);
  }, [initialData, isOpen, categories, fetchPhasesForProject]);

  if (!isOpen) return null;

  const isTaskDone = Boolean(initialData?.status === 'DONE' || initialData?.status === 'CLOSED' || initialData?.isLocked);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setProjectCreateError(null);

    try {
      const res = await fetch('/api/task-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setTaskProjects((prev) => [...prev, data.taskProject]);
        setTaskProjectId(String(data.taskProject.id));
        setIsCreatingProject(false);
        setNewProjectName('');
      } else {
        const data = await res.json();
        setProjectCreateError(data.error || 'Gagal membuat proyek.');
      }
    } catch {
      setProjectCreateError('Gagal membuat proyek.');
    }
  };

  const handleCreatePhase = async () => {
    const trimmed = newPhaseName.trim();
    if (!trimmed) return;
    setPhaseCreateError(null);

    if (!taskProjectId) {
      setPhaseCreateError('Pilih Proyek/Fitur terlebih dahulu sebelum membuat Phase.');
      return;
    }

    try {
      const res = await fetch('/api/task-phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskProjectId: parseInt(taskProjectId, 10), name: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        setProjectPhases((prev) => [...prev, data.taskPhase]);
        setPhase(data.taskPhase.name);
        setPhaseId(data.taskPhase.id);
        setIsCreatingPhase(false);
        setNewPhaseName('');
      } else {
        const data = await res.json();
        setPhaseCreateError(data.error || 'Gagal membuat phase.');
      }
    } catch {
      setPhaseCreateError('Gagal membuat phase.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isTaskDone) {
      setError('Task yang telah selesai tidak dapat diubah atau dihapus.');
      return;
    }

    if (!title.trim()) {
      setError('Judul task wajib diisi.');
      return;
    }
    if (!description.trim()) {
      setError('Deskripsi task wajib diisi.');
      return;
    }

    let fullStartDate: string | null = null;
    if (startDate) {
      fullStartDate = new Date(startDate).toISOString();
    }

    let fullDueDate: string | null = null;
    if (dueDate) {
      fullDueDate = new Date(dueDate).toISOString();
    }

    if (fullStartDate && fullDueDate && new Date(fullDueDate) < new Date(fullStartDate)) {
      setError('Tanggal & jam deadline (End Date) tidak boleh lebih awal dari Start Date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const uncategorizedCat = categories.find((c) => c.name === 'Uncategorized');

    // Resolve matching phaseId from projectPhases
    let resolvedPhaseId = phaseId;
    if (phase && phase !== 'Tanpa Phase') {
      const matchingP = projectPhases.find((p) => p.name.toLowerCase() === phase.trim().toLowerCase());
      if (matchingP) resolvedPhaseId = matchingP.id;
    } else {
      resolvedPhaseId = null;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assigneeId: assigneeId || null,
        categoryId: categoryId || (uncategorizedCat ? String(uncategorizedCat.id) : null),
        tags: tags.trim() || null,
        startDate: fullStartDate,
        dueDate: fullDueDate,
        taskProjectId: taskProjectId || null,
        phaseId: resolvedPhaseId,
        phase: phase.trim() || 'Tanpa Phase',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uncategorizedCat = categories.find((c) => c.name === 'Uncategorized');
  const uncategorizedId = uncategorizedCat ? String(uncategorizedCat.id) : '';

  const categoryOptions: CustomDropdownOption[] = [
    { value: uncategorizedId, label: 'Uncategorized', dotColor: '#94a3b8' },
    ...categories
      .filter((c) => c.name !== 'Uncategorized')
      .map((c) => ({
        value: String(c.id),
        label: c.name,
        dotColor: '#3b82f6',
      })),
  ];

  const assigneeOptions: CustomDropdownOption[] = [
    { value: '', label: 'Pilih Assignee', dotColor: '#94a3b8' },
    ...users.map((u) => ({
      value: String(u.id),
      label: u.name,
      dotColor: '#06b6d4',
    })),
  ];

  // Options for Project/Fitur
  const taskProjectOptions: CustomDropdownOption[] = [
    { value: '', label: 'Tanpa Proyek', dotColor: '#94a3b8' },
    ...taskProjects.map((tp) => ({
      value: String(tp.id),
      label: tp.name,
      dotColor: '#8b5cf6',
    })),
    { value: '__ADD_NEW_PROJECT__', label: '+ Tambah Proyek Baru', dotColor: '#38bdf8' },
  ];

  // Options for Phase (scoped strictly to selected Project/Fitur)
  const phaseOptions: CustomDropdownOption[] = [
    { value: 'Tanpa Phase', label: 'Tanpa Phase', dotColor: '#94a3b8' },
    ...projectPhases.map((p) => ({
      value: p.name,
      label: p.name,
      dotColor: '#a855f7',
    })),
    ...(taskProjectId
      ? [{ value: '__ADD_NEW_PHASE__', label: '+ Tambah Phase Baru', dotColor: '#38bdf8' }]
      : []),
  ];

  return (
    <div className={`${styles.modalOverlay} ${styles.taskModalOverlay}`} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.taskModalContent}`} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.modalHeader} ${styles.taskModalHeader}`}>
          <h3 className={styles.modalTitle}>
            {initialData ? `Edit Task ${initialData.taskNumber || ''}` : 'Buat Task Baru'}
          </h3>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.formScrollContainer}>
          <div className={styles.formBody}>
            {isTaskDone && (
              <div className={styles.lockedBanner}>
                <span className={`${styles.badge} ${styles.statusDone}`}>Done</span>
                <span>Task yang telah selesai tidak dapat diedit atau dihapus.</span>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'hsla(350, 90%, 55%, 0.15)',
                  border: '1px solid hsla(350, 90%, 55%, 0.3)',
                  color: 'hsl(350, 95%, 85%)',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Field: Judul Task */}
            <div className={styles.formGroupFull}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Judul Task *</label>
                <span className={`${styles.charCounter} ${title.length >= 70 ? styles.charCounterMax : ''}`}>
                  {title.length}/70
                </span>
              </div>
              <input
                type="text"
                placeholder="Contoh: Implementasi fitur otentikasi dua faktor"
                maxLength={70}
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 70))}
                className={styles.input}
                required
              />
            </div>

            {/* Row right below Judul Task: Project/Fitur (left) & Phase (right) */}
            <div className={styles.formRowTwoCols}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Project / Fitur</label>
                {isCreatingProject ? (
                  <div className={styles.inlineCreateGroup}>
                    <input
                      type="text"
                      placeholder="Nama proyek baru..."
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className={styles.input}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateProject();
                        }
                        if (e.key === 'Escape') {
                          setIsCreatingProject(false);
                          setNewProjectName('');
                          setProjectCreateError(null);
                        }
                      }}
                    />
                    <div className={styles.inlineCreateActions}>
                      <button
                        type="button"
                        className={styles.inlineCreateBtn}
                        onClick={handleCreateProject}
                        disabled={!newProjectName.trim()}
                        title="Simpan Proyek"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.inlineCancelBtn}
                        onClick={() => {
                          setIsCreatingProject(false);
                          setNewProjectName('');
                          setProjectCreateError(null);
                        }}
                        title="Batal"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {projectCreateError && (
                      <span className={styles.inlineCreateError}>{projectCreateError}</span>
                    )}
                  </div>
                ) : (
                  <div className={styles.dropdownWithAction}>
                    <CustomDropdown
                      value={taskProjectId}
                      options={taskProjectOptions}
                      onChange={(val) => {
                        if (val === '__ADD_NEW_PROJECT__') {
                          setIsCreatingProject(true);
                        } else {
                          setTaskProjectId(val);
                        }
                      }}
                      disabled={isSubmitting}
                      minWidth="100%"
                    />
                    <button
                      type="button"
                      className={styles.addInlineBtn}
                      onClick={() => setIsCreatingProject(true)}
                      title="Tambah Proyek Baru"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Phase (Opsional)</label>
                {isCreatingPhase ? (
                  <div className={styles.inlineCreateGroup}>
                    <input
                      type="text"
                      placeholder="Nama phase baru..."
                      value={newPhaseName}
                      onChange={(e) => setNewPhaseName(e.target.value)}
                      className={styles.input}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreatePhase();
                        }
                        if (e.key === 'Escape') {
                          setIsCreatingPhase(false);
                          setNewPhaseName('');
                        }
                      }}
                    />
                    <div className={styles.inlineCreateActions}>
                      <button
                        type="button"
                        className={styles.inlineCreateBtn}
                        onClick={handleCreatePhase}
                        disabled={!newPhaseName.trim()}
                        title="Gunakan Phase"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.inlineCancelBtn}
                        onClick={() => {
                          setIsCreatingPhase(false);
                          setNewPhaseName('');
                        }}
                        title="Batal"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {phaseCreateError && (
                      <span className={styles.inlineCreateError}>{phaseCreateError}</span>
                    )}
                  </div>
                ) : (
                  <div className={styles.dropdownWithAction}>
                    <CustomDropdown
                      value={phase}
                      options={phaseOptions}
                      onChange={(val) => {
                        if (val === '__ADD_NEW_PHASE__') {
                          setIsCreatingPhase(true);
                        } else {
                          setPhase(val);
                        }
                      }}
                      disabled={isSubmitting || isTaskDone}
                      minWidth="100%"
                    />
                    <button
                      type="button"
                      className={styles.addInlineBtn}
                      onClick={() => setIsCreatingPhase(true)}
                      title="Tambah Phase Baru"
                      disabled={isSubmitting || isTaskDone}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Field: Deskripsi */}
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Deskripsi *</label>
              <RichTextEditor
                value={description}
                onChange={(val) => setDescription(val)}
                placeholder="Jelaskan kebutuhan, ruang lingkup, atau langkah pengerjaan task..."
                disabled={isSubmitting || isTaskDone}
                required
              />
            </div>

            {/* Row 1: Status Workflow (left) & Prioritas (right) */}
            <div className={styles.formRowTwoCols}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Status Workflow</label>
                <CustomDropdown
                  value={status}
                  options={STATUS_FORM_OPTIONS}
                  onChange={(val) => setStatus(val)}
                  disabled={isSubmitting}
                  minWidth="100%"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Prioritas</label>
                <CustomDropdown
                  value={priority}
                  options={PRIORITY_FORM_OPTIONS}
                  onChange={(val) => setPriority(val)}
                  disabled={isSubmitting}
                  minWidth="100%"
                />
              </div>
            </div>

            {/* Row 2: Kategori (left) & Penugasan (Assignee) (right) */}
            <div className={styles.formRowTwoCols}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Kategori</label>
                <CustomDropdown
                  value={categoryId}
                  options={categoryOptions}
                  onChange={(val) => setCategoryId(val)}
                  disabled={isSubmitting}
                  minWidth="100%"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Penugasan (Assignee)</label>
                <CustomDropdown
                  value={assigneeId}
                  options={assigneeOptions}
                  onChange={(val) => setAssigneeId(val)}
                  disabled={isSubmitting}
                  minWidth="100%"
                />
              </div>
            </div>

            {/* Row 3: Start Date & Time and End Date & Time */}
            <div className={styles.formRowTwoCols}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Start Date & Time</label>
                <DateTimePicker
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  defaultTime="09:00"
                  placeholder="Pilih Tanggal & Jam Mulai"
                  disabled={isSubmitting || isTaskDone}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>End Date & Time</label>
                <DateTimePicker
                  value={dueDate}
                  onChange={(val) => setDueDate(val)}
                  defaultTime="17:00"
                  minDate={startDate ? startDate.substring(0, 10) : undefined}
                  placeholder="Pilih Tanggal & Jam Selesai"
                  disabled={isSubmitting || isTaskDone}
                />
              </div>
            </div>

            {/* Tags */}
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Tags (Pisahkan dengan koma)</label>
              <input
                type="text"
                placeholder="Contoh: frontend, bugfix, api"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={`${styles.modalFooter} ${styles.modalFooterCompact}`}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.cancelBtn} ${styles.btnCompact}`}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className={`${styles.submitBtn} ${styles.btnCompact}`}
              disabled={isSubmitting || isTaskDone}
            >
              {isSubmitting ? 'Menyimpan...' : initialData ? 'Perbarui Task' : 'Buat Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
