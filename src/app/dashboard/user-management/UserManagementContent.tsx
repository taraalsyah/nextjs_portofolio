'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Users as UsersIcon, Edit2, Trash2, X, Save, AlertTriangle, CheckCircle, Unlock } from 'lucide-react';
import { ButtonLoading, InlineSpinner } from '@/components/ui/loading';
import styles from './users.module.css';

interface UserData {
  id: number;
  name: string;
  username: string | null;
  email: string;
  role: string;
  roleId: number | null;
  roleRel: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  status: string;
  phone: string | null;
  otpSoftBlockUntil?: string | null;
  otpSoftBlockCount?: number;
  createdAt: string;
}

interface RoleData {
  id: number;
  name: string;
  description: string | null;
}

interface UserManagementContentProps {
  initialUsers: UserData[];
  availableRoles: RoleData[];
  sessionUserId: number;
  totalItems: number;
  currentPage: number;
}

/**
 * Calculates page numbers to display in a simplified pagination listing:
 * e.g. "1 ... 5 6 7 ... 20"
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  const delta = 1; // Show current page +/- delta

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (
      (i === currentPage - delta - 1 && i > 1) ||
      (i === currentPage + delta + 1 && i < totalPages)
    ) {
      pages.push('...');
    }
  }

  return pages.filter((item, index, arr) => {
    if (item === '...' && arr[index - 1] === '...') {
      return false;
    }
    return true;
  });
}

export default function UserManagementContent({
  initialUsers,
  availableRoles,
  sessionUserId,
  totalItems,
  currentPage,
}: UserManagementContentProps) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [unblockingUserId, setUnblockingUserId] = useState<number | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync users state when initialUsers updates (e.g. on server-side pagination page changes)
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleUnblockUser = async (userId: number, name: string) => {
    const confirmed = window.confirm(`Apakah Anda yakin ingin membuka blokir registrasi akun "${name}"?`);
    if (!confirmed) return;

    setUnblockingUserId(userId);
    setStatus(null);

    try {
      const res = await fetch(`/api/users/${userId}/unblock`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal membuka blokir user.');
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                status: 'PENDING',
                otpSoftBlockUntil: null,
                otpSoftBlockCount: 0,
              }
            : u
        )
      );

      setStatus({ type: 'success', message: `Berhasil membuka blokir akun "${name}". Status kembali PENDING.` });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Terjadi kesalahan saat membuka blokir.' });
    } finally {
      setUnblockingUserId(null);
    }
  };

  const handlePageNavigate = (targetPage: number) => {
    if (targetPage === currentPage || targetPage < 1 || targetPage > Math.ceil(totalItems / 10)) return;
    startTransition(() => {
      router.push(`/dashboard/user-management?page=${targetPage}`);
    });
  };

  // ─── HANDLERS ──────────────────────────────────────────────────────────────
  const openEditRoleModal = (user: UserData) => {
    setEditingUser(user);
    setSelectedRoleId(user.roleId || availableRoles[0]?.id || 0);
    setStatus(null);
  };

  const closeEditRoleModal = () => {
    setEditingUser(null);
    setStatus(null);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengubah role pengguna.');
      }

      // Update local users state
      const updatedRole = availableRoles.find((r) => r.id === selectedRoleId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                roleId: selectedRoleId,
                role: updatedRole?.name || u.role,
                roleRel: updatedRole ? { ...updatedRole, description: updatedRole.description } : u.roleRel,
              }
            : u
        )
      );

      setStatus({ type: 'success', message: `Berhasil mengubah role pengguna "${editingUser.name}".` });
      setTimeout(() => {
        closeEditRoleModal();
      }, 1000);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Terjadi kesalahan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (userId === sessionUserId) {
      alert('Tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus user "${name}"?`);
    if (!confirmed) return;

    setDeletingUserId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menghapus user.');
      }

      // Update local users list
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert(`User "${name}" berhasil dihapus.`);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menghapus user.');
    } finally {
      setDeletingUserId(null);
    }
  };

  // Calculate items range description
  const totalPages = Math.ceil(totalItems / 10);
  const itemFrom = totalItems === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const itemTo = Math.min(currentPage * 10, totalItems);

  // Generate page list configuration
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className={styles.container}>
      {/* Alert notification if not in modal */}
      {!editingUser && status && (
        <div className={`${styles.alert} ${status.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{status.message}</span>
        </div>
      )}

      <div className={`${styles.tableCard} glass`}>
        {/* Header */}
        <div className={styles.headerSection}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(265, 90%, 80%)'
          }}>
            <UsersIcon size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Manajemen Pengguna</h2>
            <p style={{ color: 'hsla(0, 0%, 100%, 0.5)', margin: '0.05rem 0 0', fontSize: '0.78rem' }}>
              Lihat daftar anggota, edit hak akses role, serta kelola akun secara aman
            </p>
          </div>
        </div>

        {/* User Table List */}
        {totalItems === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'hsla(0, 0%, 100%, 0.4)' }}>
            Belum ada pengguna terdaftar.
          </div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              {isPending && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'hsla(230, 20%, 5%, 0.45)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: '8px',
                }}>
                  <InlineSpinner size={28} color="var(--secondary)" />
                </div>
              )}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Pengguna</th>
                      <th>Alamat Email</th>
                      <th>Hak Akses (Role)</th>
                      <th>Status</th>
                      <th>Tanggal Gabung</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className={styles.userCol}>
                            <span className={styles.nameText}>{u.name}</span>
                            <span className={styles.usernameText}>@{u.username || 'user'}</span>
                          </div>
                        </td>
                        <td className={styles.emailCol}>{u.email}</td>
                        <td>
                          <span className={`${styles.badge} ${styles.roleBadge}`}>
                            {u.roleRel?.name || u.role || 'Staff'}
                          </span>
                        </td>
                        <td>
                          {(() => {
                            if (u.status === 'BLOCKED') {
                              return (
                                <span className={`${styles.badge} ${styles.statusBlocked}`}>
                                  BLOCKED
                                </span>
                              );
                            }
                            const isSoftBlocked = u.otpSoftBlockUntil && new Date(u.otpSoftBlockUntil) > new Date();
                            if (isSoftBlocked) {
                              const diffMs = new Date(u.otpSoftBlockUntil!).getTime() - Date.now();
                              const minsLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60)));
                              return (
                                <span
                                  className={`${styles.badge} ${styles.statusSoftBlocked}`}
                                  title={`Soft Blocked. Sisa waktu: ${minsLeft}m`}
                                >
                                  Soft Blocked ({minsLeft}m)
                                </span>
                              );
                            }
                            if (u.status === 'ACTIVE') {
                              return <span className={`${styles.badge} ${styles.statusActive}`}>Aktif</span>;
                            }
                            return <span className={`${styles.badge} ${styles.statusPending}`}>Tertunda</span>;
                          })()}
                        </td>
                        <td>
                          {new Date(u.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td>
                          <div className={styles.actionsCol} style={{ justifyContent: 'center' }}>
                            {u.status === 'BLOCKED' && (
                              <button
                                onClick={() => handleUnblockUser(u.id, u.name)}
                                disabled={unblockingUserId === u.id}
                                className={`${styles.actionBtn} ${styles.unblockBtn}`}
                                title="Buka Blokir (Unblock)"
                              >
                                {unblockingUserId === u.id ? (
                                  <InlineSpinner size={13} color="var(--secondary)" />
                                ) : (
                                  <Unlock size={13} />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => openEditRoleModal(u)}
                              className={styles.actionBtn}
                              title="Ubah Role"
                            >
                              <Edit2 size={13} />
                            </button>
                            {u.id !== sessionUserId && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                disabled={deletingUserId === u.id}
                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                title="Hapus Pengguna"
                              >
                                {deletingUserId === u.id ? (
                                  <InlineSpinner size={13} color="hsl(350, 80%, 75%)" />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className={styles.paginationSection}>
              <div className={styles.paginationInfo}>
                Showing {itemFrom}–{itemTo} of {totalItems} users
              </div>

              <div className={styles.paginationNav}>
                {/* Previous Button */}
                {currentPage === 1 ? (
                  <div className={`${styles.pageBtn} ${styles.disabledPageBtn}`}>
                    Previous
                  </div>
                ) : (
                  <button
                    onClick={() => handlePageNavigate(currentPage - 1)}
                    disabled={isPending}
                    className={styles.pageBtn}
                  >
                    Previous
                  </button>
                )}

                {/* Page Numbers */}
                {pageNumbers.map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
                        ...
                      </span>
                    );
                  }

                  const isCurrent = p === currentPage;

                  return (
                    <button
                      key={`page-${p}`}
                      onClick={() => handlePageNavigate(Number(p))}
                      disabled={isPending || isCurrent}
                      className={`${styles.pageBtn} ${isCurrent ? styles.activePageBtn : ''}`}
                    >
                      {p}
                    </button>
                  );
                })}

                {/* Next Button */}
                {currentPage === totalPages ? (
                  <div className={`${styles.pageBtn} ${styles.disabledPageBtn}`}>
                    Next
                  </div>
                ) : (
                  <button
                    onClick={() => handlePageNavigate(currentPage + 1)}
                    disabled={isPending}
                    className={styles.pageBtn}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleUpdateRole} className={`${styles.modalContent} glass`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Ubah Role Pengguna</h3>
              <button type="button" onClick={closeEditRoleModal} className={styles.closeModalBtn}>
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
              <span className={styles.label}>Nama Pengguna</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--fg-color)' }}>
                {editingUser.name} ({editingUser.email})
              </span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role-select" className={styles.label}>Pilih Role Baru</label>
              <select
                id="role-select"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(parseInt(e.target.value, 10))}
                className={styles.select}
              >
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" onClick={closeEditRoleModal} className={styles.btn}>
                Batal
              </button>
              <ButtonLoading
                type="submit"
                isLoading={isSubmitting}
                loadingText="Menyimpan..."
                disabled={selectedRoleId === editingUser.roleId}
                className={`${styles.btn} ${styles.saveBtn}`}
              >
                <Save size={14} />
                <span>Simpan</span>
              </ButtonLoading>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
