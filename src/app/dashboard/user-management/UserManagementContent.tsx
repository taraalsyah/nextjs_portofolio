'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Users as UsersIcon, Edit2, Trash2, X, Save, AlertTriangle, CheckCircle, Unlock, Search, Mail, Shield, Filter, Calendar, RotateCcw } from 'lucide-react';
import { ButtonLoading, InlineSpinner } from '@/components/ui/loading';
import { formatShortWIB, getRemainingTimeString, isExpired } from '@/lib/date';
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

interface FilterParams {
  name: string;
  email: string;
  roleId: string;
  status: string;
  joinedDate: string;
}

interface UserManagementContentProps {
  initialUsers: UserData[];
  availableRoles: RoleData[];
  sessionUserId: number;
  totalItems: number;
  currentPage: number;
  filterParams: FilterParams;
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
  filterParams,
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

  // Local filter states for real-time typing and UI responsiveness
  const [nameFilter, setNameFilter] = useState<string>(filterParams?.name || '');
  const [emailFilter, setEmailFilter] = useState<string>(filterParams?.email || '');
  const [roleIdFilter, setRoleIdFilter] = useState<string>(filterParams?.roleId || '');
  const [statusFilter, setStatusFilter] = useState<string>(filterParams?.status || '');
  const [joinedDateFilter, setJoinedDateFilter] = useState<string>(filterParams?.joinedDate || '');

  // Sync state when initialUsers or filterParams props update (e.g. from server page navigation)
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    setNameFilter(filterParams?.name || '');
    setEmailFilter(filterParams?.email || '');
    setRoleIdFilter(filterParams?.roleId || '');
    setStatusFilter(filterParams?.status || '');
    setJoinedDateFilter(filterParams?.joinedDate || '');
  }, [filterParams]);

  // Helper to build URL & navigate router with transition
  const applyFilters = (overrides?: Partial<FilterParams & { page: number }>) => {
    const params = new URLSearchParams();

    const name = overrides?.name !== undefined ? overrides.name : nameFilter;
    const email = overrides?.email !== undefined ? overrides.email : emailFilter;
    const roleId = overrides?.roleId !== undefined ? overrides.roleId : roleIdFilter;
    const statusVal = overrides?.status !== undefined ? overrides.status : statusFilter;
    const joinedDate = overrides?.joinedDate !== undefined ? overrides.joinedDate : joinedDateFilter;
    const page = overrides?.page !== undefined ? overrides.page : 1;

    if (name.trim()) params.set('name', name.trim());
    if (email.trim()) params.set('email', email.trim());
    if (roleId.trim()) params.set('roleId', roleId.trim());
    if (statusVal.trim()) params.set('status', statusVal.trim());
    if (joinedDate.trim()) params.set('joinedDate', joinedDate.trim());
    if (page > 1) params.set('page', page.toString());

    const queryString = params.toString();
    const targetUrl = `/dashboard/user-management${queryString ? `?${queryString}` : ''}`;

    startTransition(() => {
      router.push(targetUrl);
    });
  };

  // Debounce URL updates for text search inputs (Name & Email)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentNameProp = filterParams?.name || '';
      const currentEmailProp = filterParams?.email || '';
      if (nameFilter !== currentNameProp || emailFilter !== currentEmailProp) {
        applyFilters({ name: nameFilter, email: emailFilter, page: 1 });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [nameFilter, emailFilter]);

  const handleResetFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setRoleIdFilter('');
    setStatusFilter('');
    setJoinedDateFilter('');

    startTransition(() => {
      router.push('/dashboard/user-management');
    });
  };

  const activeFilterCount = [
    nameFilter,
    emailFilter,
    roleIdFilter,
    statusFilter,
    joinedDateFilter,
  ].filter((f) => f.trim() !== '').length;

  const hasActiveFilters = activeFilterCount > 0;

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
    applyFilters({ page: targetPage });
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
            background: 'var(--primary-soft)',
            border: '1px solid var(--primary-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <UsersIcon size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>Manajemen Pengguna</h2>
            <p style={{ color: 'var(--muted-foreground)', margin: '0.05rem 0 0', fontSize: '0.78rem' }}>
              Lihat daftar anggota, edit hak akses role, serta kelola akun secara aman
            </p>
          </div>
        </div>

        {/* Filter Section Toolbar */}
        <div className={styles.filterSection}>
          <div className={styles.filterGrid}>
            {/* 1. Kolom Pengguna (Text Search) */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <Search size={13} /> Pengguna
              </label>
              <input
                type="text"
                placeholder="Cari nama atau username..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>

            {/* 2. Kolom Alamat Email (Text Search) */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <Mail size={13} /> Alamat Email
              </label>
              <input
                type="text"
                placeholder="Cari alamat email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>

            {/* 3. Kolom Hak Akses / Role (Select Dropdown) */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <Shield size={13} /> Hak Akses (Role)
              </label>
              <select
                value={roleIdFilter}
                onChange={(e) => {
                  setRoleIdFilter(e.target.value);
                  applyFilters({ roleId: e.target.value, page: 1 });
                }}
                className={styles.filterSelect}
              >
                <option value="">Semua Role</option>
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id.toString()}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Kolom Status (Select Dropdown) */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <Filter size={13} /> Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  applyFilters({ status: e.target.value, page: 1 });
                }}
                className={styles.filterSelect}
              >
                <option value="">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="PENDING">Tertunda</option>
                <option value="SOFT_BLOCKED">Soft Blocked</option>
                <option value="BLOCKED">Terblokir (Blocked)</option>
              </select>
            </div>

            {/* 5. Kolom Tanggal Gabung (Date Picker) */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <Calendar size={13} /> Tanggal Gabung
              </label>
              <input
                type="date"
                value={joinedDateFilter}
                onChange={(e) => {
                  setJoinedDateFilter(e.target.value);
                  applyFilters({ joinedDate: e.target.value, page: 1 });
                }}
                className={styles.filterDateInput}
              />
            </div>
          </div>

          {/* Filter Actions (Reset & Active Indicator) */}
          {hasActiveFilters && (
            <div className={styles.filterActions}>
              <span className={styles.activeFilterCount}>
                <Filter size={13} /> {activeFilterCount} Filter Aktif
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className={styles.resetFilterBtn}
                title="Hapus seluruh filter pencarian"
              >
                <RotateCcw size={13} /> Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* User Table List */}
        {totalItems === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            Belum ada pengguna terdaftar.
          </div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              {isPending && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: '8px',
                }}>
                  <InlineSpinner size={28} color="var(--primary)" />
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
                            const isSoftBlocked = u.otpSoftBlockUntil && !isExpired(u.otpSoftBlockUntil);
                            if (isSoftBlocked) {
                              const remaining = getRemainingTimeString(u.otpSoftBlockUntil!);
                              return (
                                <span
                                  className={`${styles.badge} ${styles.statusSoftBlocked}`}
                                  title={`Soft Blocked. Sisa waktu: ${remaining}`}
                                >
                                  Soft Blocked ({remaining})
                                </span>
                              );
                            }
                            if (u.status === 'ACTIVE') {
                              return <span className={`${styles.badge} ${styles.statusActive}`}>Aktif</span>;
                            }
                            return <span className={`${styles.badge} ${styles.statusPending}`}>Tertunda</span>;
                          })()}
                        </td>
                        <td className={styles.dateCol}>
                          {formatShortWIB(u.createdAt)}
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
                                  <InlineSpinner size={13} color="#16A34A" />
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
                                  <InlineSpinner size={13} color="var(--error)" />
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
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>
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
