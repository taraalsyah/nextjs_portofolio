'use client';

import React, { useState } from 'react';
import { useDemo, DemoProject } from '@/context/DemoContext';
import { X, Plus, Save } from 'lucide-react';
import styles from './demo.module.css';

interface DemoProjectModalProps {
  projectToEdit?: DemoProject | null;
  onClose: () => void;
}

export const DemoProjectModal: React.FC<DemoProjectModalProps> = ({ projectToEdit, onClose }) => {
  const { createProject, updateProject } = useDemo();

  const [projectName, setProjectName] = useState(projectToEdit?.projectName || '');
  const [description, setDescription] = useState(projectToEdit?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    if (projectToEdit) {
      updateProject(projectToEdit.id, { projectName, description });
    } else {
      createProject({ projectName, description });
    }

    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            {projectToEdit ? 'Edit Project Demo' : 'Buat Project Demo Baru'}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nama Project *</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Contoh: Mobile App Revamp"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Deskripsi Project</label>
            <textarea
              className={styles.formTextarea}
              rows={4}
              placeholder="Deskripsi singkat mengenai project ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className={styles.formFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Batal
            </button>
            <button type="submit" className={styles.primaryBlueBtn}>
              {projectToEdit ? <Save size={15} /> : <Plus size={15} />}
              {projectToEdit ? 'Simpan Perubahan' : 'Buat Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DemoProjectModal;
