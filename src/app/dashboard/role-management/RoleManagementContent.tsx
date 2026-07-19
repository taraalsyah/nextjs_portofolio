'use client';

import React, { useState } from 'react';
import { Shield, Plus, Edit2, Trash2, X, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import styles from './role.module.css';

interface RoleData {
  id: number;
  name: string;
  description: string | null;
  permissionIds: number[];
}

interface PermissionData {
  id: number;
  module: string;
  action: string;
  description: string | null;
}

interface RoleManagementContentProps {
  initialRoles: RoleData[];
  availablePermissions: PermissionData[];
}

const MODULES = [
  'Dashboard',
  'User Management',
  'Role Management',
  'Activity History',
  'Profile',
  'Settings',
];

const ACTIONS = ['View', 'Create', 'Update', 'Delete'];

export default function RoleManagementContent({
  initialRoles,
  availablePermissions,
}: RoleManagementContentProps) {
  const [roles, setRoles] = useState<RoleData[]>(initialRoles);
  const [activeRoleId, setActiveRoleId] = useState<number>(initialRoles[0]?.id || 0);

  // Modal dialog states
  const [modalType, setModalType] = useState<'add' | 'edit' | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });

  // Status/alert states
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dapatkan role aktif saat ini
  const activeRole = roles.find((r) => r.id === activeRoleId);

  // Map permissions ke lookup key: "Module_Action" -> permissionId
  const permissionLookup = new Map<string, number>(
    availablePermissions.map((p) => [`${p.module}_${p.action}`, p.id])
  );

  // ─── HANDLERS ──────────────────────────────────────────────────────────────

  const handleTogglePermission = (permissionId: number) => {
    if (!activeRole) return;

    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoleId) return r;
        const exists = r.permissionIds.includes(permissionId);
        const nextIds = exists
          ? r.permissionIds.filter((id) => id !== permissionId)
          : [...r.permissionIds, permissionId];
        return { ...r, permissionIds: nextIds };
      })
    );
  };

  const handleSavePermissions = async () => {
    if (!activeRole) return;

    setIsSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch(`/api/roles/${activeRole.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionIds: activeRole.permissionIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan hak akses.');
      }

      setStatus({ type: 'success', message: 'Hak akses (permissions) berhasil disimpan.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Terjadi kesalahan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddRoleModal = () => {
    setRoleForm({ name: '', description: '' });
    setModalType('add');
    setStatus(null);
  };

  const openEditRoleModal = () => {
    if (!activeRole) return;
    setRoleForm({ name: activeRole.name, description: activeRole.description || '' });
    setModalType('edit');
    setStatus(null);
  };

  const handleRoleCrudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      if (modalType === 'add') {
        const res = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roleForm),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Gagal menambahkan role.');
        }

        const newRole: RoleData = {
          id: data.role.id,
          name: data.role.name,
          description: data.role.description,
          permissionIds: [],
        };

        setRoles((prev) => [...prev, newRole]);
        setActiveRoleId(newRole.id);
        setModalType(null);
      } else if (modalType === 'edit' && activeRole) {
        const res = await fetch('/api/roles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: activeRole.id, ...roleForm }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Gagal mengubah role.');
        }

        setRoles((prev) =>
          prev.map((r) =>
            r.id === activeRole.id
              ? { ...r, name: data.role.name, description: data.role.description }
              : r
          )
        );
        setModalType(null);
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Terjadi kesalahan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!activeRole) return;

    // Prevent deleting Admin role
    if (activeRole.name === 'Admin') {
      alert('Role "Admin" merupakan sistem utama dan tidak boleh dihapus.');
      return;
    }

    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus role "${activeRole.name}"?`);
    if (!confirmed) return;

    setIsSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch(`/api/roles?id=${activeRole.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menghapus role.');
      }

      const remainingRoles = roles.filter((r) => r.id !== activeRole.id);
      setRoles(remainingRoles);
      setActiveRoleId(remainingRoles[0]?.id || 0);
      alert('Role berhasil dihapus.');
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menghapus role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Dynamic Sidebar + Panel Layout */}
      <div className={styles.panelGrid}>
        {/* Kiri: Daftar Role */}
        <div className={styles.leftPanel}>
          <button onClick={openAddRoleModal} className={styles.addRoleBtn}>
            <Plus size={14} />
            <span>Tambah Role</span>
          </button>

          <div className={`${styles.roleCardList} glass`}>
            {roles.map((r) => {
              const isActive = r.id === activeRoleId;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setActiveRoleId(r.id);
                    setStatus(null);
                  }}
                  className={`${styles.roleItem} ${isActive ? styles.roleItemActive : ''}`}
                >
                  <span className={styles.roleItemName}>{r.name}</span>
                  <span className={styles.roleItemDesc}>{r.description || 'Tidak ada deskripsi'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kanan: Detail Role & Permission Matrix */}
        {activeRole ? (
          <div className={`${styles.rightPanel} glass`}>
            <div className={styles.detailHeader}>
              <div className={styles.titleArea}>
                <h3 className={styles.detailTitle}>{activeRole.name}</h3>
                <span className={styles.detailDesc}>
                  {activeRole.description || 'Tidak ada deskripsi peran'}
                </span>
              </div>

              <div className={styles.roleCrudActions}>
                <button onClick={openEditRoleModal} className={styles.crudBtn}>
                  <Edit2 size={12} />
                  <span>Ubah</span>
                </button>
                {activeRole.name !== 'Admin' && (
                  <button onClick={handleDeleteRole} className={`${styles.crudBtn} ${styles.deleteCrudBtn}`}>
                    <Trash2 size={12} />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
            </div>

            {/* Alert info/status */}
            {status && (
              <div className={`${styles.alert} ${status.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span>{status.message}</span>
              </div>
            )}

            {/* Matrix Box */}
            <div className={styles.matrixSection}>
              <span className={styles.label}>Permission Matrix</span>

              <div className={styles.matrixCard}>
                <table className={styles.matrixTable}>
                  <thead>
                    <tr>
                      <th className={styles.moduleCol}>Module</th>
                      {ACTIONS.map((action) => (
                        <th key={action} className={styles.checkboxCell}>
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((module) => (
                      <tr key={module}>
                        <td className={styles.moduleCol}>{module}</td>
                        {ACTIONS.map((action) => {
                          const permId = permissionLookup.get(`${module}_${action}`);
                          if (!permId) {
                            return (
                              <td key={action} className={styles.checkboxCell}>
                                <span className={styles.emptyAction}>-</span>
                              </td>
                            );
                          }

                          const isChecked = activeRole.permissionIds.includes(permId);
                          const isAdmin = activeRole.name === 'Admin';

                          return (
                            <td key={action} className={styles.checkboxCell}>
                              <label className={styles.checkboxContainer}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isAdmin || isSubmitting}
                                  onChange={() => handleTogglePermission(permId)}
                                  className={styles.checkboxInput}
                                />
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save permissions matrix */}
            {activeRole.name !== 'Admin' && (
              <div className={styles.panelFooter}>
                <button
                  onClick={handleSavePermissions}
                  disabled={isSubmitting}
                  className={styles.saveBtn}
                >
                  {isSubmitting ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={`${styles.rightPanel} glass`} style={{ justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <span style={{ color: 'hsla(0, 0%, 100%, 0.4)', fontSize: '0.85rem' }}>
              Pilih role dari panel kiri untuk melihat hak akses.
            </span>
          </div>
        )}
      </div>

      {/* CRUD Add/Edit Role Modal */}
      {modalType && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleRoleCrudSubmit} className={`${styles.modalContent} glass`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalType === 'add' ? 'Tambah Role Baru' : 'Ubah Detail Role'}
              </h3>
              <button type="button" onClick={() => setModalType(null)} className={styles.closeModalBtn}>
                <X size={16} />
              </button>
            </div>

            {status && (
              <div className={`${styles.alert} ${status.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span>{status.message}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="role-name" className={styles.label}>Nama Role</label>
              <input
                id="role-name"
                type="text"
                value={roleForm.name}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                className={styles.input}
                placeholder="Contoh: Staff, Editor"
                disabled={modalType === 'edit' && activeRole?.name === 'Admin'}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role-desc" className={styles.label}>Deskripsi Peran</label>
              <input
                id="role-desc"
                type="text"
                value={roleForm.description}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                className={styles.input}
                placeholder="Menjelaskan batasan tugas user"
              />
            </div>

            <div className={styles.modalFooter}>
              <button type="button" onClick={() => setModalType(null)} className={styles.btn}>
                Batal
              </button>
              <button type="submit" disabled={isSubmitting} className={`${styles.btn} ${styles.saveBtn}`}>
                {isSubmitting ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
