'use client';

import React, { useState } from 'react';
import { X, Check, LayoutGrid, ArrowRight } from 'lucide-react';
import { FLOW_TEMPLATES, FlowTemplate } from '@/lib/flow/templates';
import styles from './flowComponents.module.css';

interface FlowTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: FlowTemplate) => void;
}

export function FlowTemplateModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: FlowTemplateModalProps) {
  const [selectedId, setSelectedId] = useState<string>('blank');

  if (!isOpen) return null;

  const currentTemplate = FLOW_TEMPLATES.find((t) => t.id === selectedId) || FLOW_TEMPLATES[0];

  const handleApply = () => {
    onSelectTemplate(currentTemplate);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>Pilih Template Alur Kerja</div>
          <button type="button" className={styles.toolbarBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
            Mulai membuat alur dari struktur siap pakai atau kanvas kosong.
          </p>

          <div className={styles.templateGrid}>
            {FLOW_TEMPLATES.map((tpl) => {
              const isSelected = tpl.id === selectedId;
              return (
                <div
                  key={tpl.id}
                  className={`${styles.templateCard} ${isSelected ? styles.templateCardSelected : ''}`}
                  onClick={() => setSelectedId(tpl.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      {tpl.category}
                    </span>
                    {isSelected && <Check size={16} color="var(--primary)" />}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>
                    {tpl.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                    {tpl.description}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 8, fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
                    {tpl.data.nodes.length} Node • {tpl.data.edges.length} Koneksi
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.backBtn} onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className={styles.backBtn}
            style={{
              background: 'var(--primary)',
              color: '#ffffff',
              borderColor: 'var(--primary-hover)',
              fontWeight: 600,
            }}
            onClick={handleApply}
          >
            <span>Terapkan Template</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
