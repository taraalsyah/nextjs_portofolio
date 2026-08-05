'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  X,
  Settings,
  Users,
  AlertTriangle,
  UserPlus,
  Trash2,
  Check,
  Crown,
  Star,
  User as UserIcon,
  Eye,
  Search,
  ArrowRightLeft,
  Shield,
  Save,
  Copy,
  RefreshCw,
  Key,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import styles from './project.module.css';
import InlineSpinner from '@/components/ui/loading/InlineSpinner';
import { notifyProjectMembersUpdated } from '@/hooks/useProjectMembers';
import {
  ALL_PERMISSIONS_LIST,
  ALL_WORKFLOW_TRANSITIONS,
  ProjectRole,
  ProjectPermissionKey,
} from '@/lib/project';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId: number;
  onProjectUpdated: () => void;
}

interface ProjectData {
  id: number;
  projectName: string;
  description: string | null;
  ownerUserId: number;
  visibility: 'PRIVATE' | 'TEAM';
  inviteCode?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: { id: number; name: string; email: string; image: string | null };
}

interface ProjectMemberItem {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  joinedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    username?: string | null;
    image?: string | null;
    status?: string;
  };
}

interface SearchUserItem {
  id: number;
  name: string;
  email: string;
  username?: string | null;
  image?: string | null;
}

export function ProjectSettingsModal({
  isOpen,
  onClose,
  activeProjectId,
  onProjectUpdated,
}: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'roles' | 'danger'>('general');
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [currentRole, setCurrentRole] = useState<string>('VIEWER');
  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for General
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'TEAM'>('PRIVATE');
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  // Invite Modal Sub-Dialog states
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedInviteUser, setSelectedInviteUser] = useState<SearchUserItem | null>(null);
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);

  // Invite Code State
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isCopyingCode, setIsCopyingCode] = useState(false);
  const [updatingMemberUserId, setUpdatingMemberUserId] = useState<number | null>(null);

  // Transfer Ownership Dialog states
  const [transferTargetUser, setTransferTargetUser] = useState<ProjectMemberItem | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Matrix Roles state
  const [permMatrix, setPermMatrix] = useState<Record<string, Record<string, boolean>> | null>(null);
  const [wfMatrix, setWfMatrix] = useState<Record<string, Record<string, boolean>> | null>(null);
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);

  const fetchProjectDetails = async () => {
    if (!activeProjectId || !isOpen) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${activeProjectId}`);
      if (res.ok) {
        const data = await res.json();
        setProjectData(data.project);
        setCurrentRole(data.currentRole || 'VIEWER');
        setProjectName(data.project.projectName || '');
        setDescription(data.project.description || '');
        setVisibility(data.project.visibility || 'PRIVATE');
        setInviteCode(data.project.inviteCode || null);
      }

      const memRes = await fetch(`/api/projects/${activeProjectId}/members`);
      if (memRes.ok) {
        const memData = await memRes.json();
        setMembers(memData.members || []);
      }

      const matrixRes = await fetch(`/api/projects/${activeProjectId}/roles/permissions`);
      if (matrixRes.ok) {
        const matrixData = await matrixRes.json();
        setPermMatrix(matrixData.matrix);
        setWfMatrix(matrixData.workflowMatrix);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail proyek.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjectDetails();
    }
  }, [isOpen, activeProjectId]);

  // Debounced Search Users for Invite Modal
  useEffect(() => {
    const q = inviteSearchQuery.trim();
    if (!q || q.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      fetch(
        `/api/projects/${activeProjectId}/members/search-users?q=${encodeURIComponent(q)}`
      )
        .then((res) => res.json())
        .then((data) => setSearchResults(data.users || []))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [inviteSearchQuery, activeProjectId]);

  const { data: session } = useSession();
  const sessionUserId = parseInt((session?.user as any)?.id || '0', 10);

  if (!isOpen) return null;

  const isOwner =
    currentRole === 'OWNER' ||
    (projectData?.ownerUserId ? projectData.ownerUserId === sessionUserId : false);
  const isAdminOrOwner = isOwner || currentRole === 'ADMIN';

  const handleGenerateInviteCode = async () => {
    if (!isAdminOrOwner || isGeneratingCode) return;
    setIsGeneratingCode(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/projects/${activeProjectId}/invite-code`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses Invite Code.');

      setInviteCode(data.inviteCode);
      setSuccessMsg('Invite Code berhasil diperbarui.');
    } catch (err: any) {
      setError(err.message || 'Gagal memproses Invite Code.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleRevokeInviteCode = async () => {
    if (!isAdminOrOwner || isGeneratingCode) return;
    if (!confirm('Apakah Anda yakin ingin menonaktifkan Invite Code ini? User baru tidak akan dapat bergabung sampai Anda membuat kode baru.')) return;

    setIsGeneratingCode(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/projects/${activeProjectId}/invite-code`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menonaktifkan Invite Code.');

      setInviteCode(null);
      setSuccessMsg('Invite Code berhasil dinonaktifkan.');
    } catch (err: any) {
      setError(err.message || 'Gagal menonaktifkan Invite Code.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setIsCopyingCode(true);
    setTimeout(() => setIsCopyingCode(false), 2000);
  };

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || isSavingGeneral) return;

    setIsSavingGeneral(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/projects/${activeProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, description, visibility }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Gagal memperbarui detail proyek.');
      }

      setSuccessMsg('Detail proyek berhasil diperbarui.');
      onProjectUpdated();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInviteUser || isInviting) return;

    if ((inviteRole as string) === 'OWNER') {
      setError('Peran Owner tidak dapat dipilih saat mengundang anggota.');
      return;
    }

    setIsInviting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/projects/${activeProjectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedInviteUser.id,
          role: inviteRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengundang anggota.');
      }

      setInviteSearchQuery('');
      setSelectedInviteUser(null);
      setSearchResults([]);
      setIsInviteDialogOpen(false);
      setSuccessMsg(`Anggota "${data.member?.user?.name || 'User'}" berhasil diundang.`);

      if (data.member) {
        setMembers((prev) => {
          if (prev.some((m) => m.userId === data.member.userId)) return prev;
          return [...prev, data.member];
        });
      }

      notifyProjectMembersUpdated(activeProjectId);
      fetchProjectDetails();
    } catch (err: any) {
      setError(err.message || 'Gagal mengundang anggota.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleChangeRole = async (targetUserId: number, newRole: string) => {
    if (!isOwner) return;
    if (updatingMemberUserId) return;

    if (newRole === 'OWNER') {
      alert('Peran Owner hanya dapat dialihkan melalui fitur Transfer Ownership.');
      return;
    }

    const targetMember = members.find((m) => m.userId === targetUserId);
    const memberName = targetMember?.user?.name || 'anggota ini';

    if (!confirm(`Apakah Anda yakin ingin mengubah role anggota ini (${memberName}) menjadi ${newRole}?`)) {
      return;
    }

    setUpdatingMemberUserId(targetUserId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/projects/${activeProjectId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, role: newRole }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengubah peran anggota.');
      }

      setMembers((prev) =>
        prev.map((m) => (m.userId === targetUserId ? { ...m, role: newRole } : m))
      );
      setSuccessMsg(`Role "${memberName}" berhasil diubah menjadi ${newRole}.`);
      notifyProjectMembersUpdated(activeProjectId);
      fetchProjectDetails();
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah peran anggota.');
    } finally {
      setUpdatingMemberUserId(null);
    }
  };

  const handleRemoveMember = async (member: ProjectMemberItem) => {
    if (!isOwner) return;
    if (updatingMemberUserId) return;

    if (member.userId === projectData?.ownerUserId) {
      alert('Pemilik utama proyek tidak dapat dihapus.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus anggota ini (${member.user.name}) dari project?`)) return;

    setUpdatingMemberUserId(member.userId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(
        `/api/projects/${activeProjectId}/members?userId=${member.userId}`,
        { method: 'DELETE' }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menghapus anggota.');
      }

      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      setSuccessMsg(`Anggota "${member.user.name}" berhasil dihapus dari project.`);
      notifyProjectMembersUpdated(activeProjectId);
      fetchProjectDetails();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus anggota.');
    } finally {
      setUpdatingMemberUserId(null);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTargetUser || !isOwner || isTransferring) return;

    setIsTransferring(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${activeProjectId}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerUserId: transferTargetUser.userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mentransfer kepemilikan proyek.');
      }

      setSuccessMsg(data.message || 'Kepemilikan proyek berhasil dialihkan.');
      setTransferTargetUser(null);
      notifyProjectMembersUpdated(activeProjectId);
      onProjectUpdated();
      fetchProjectDetails();
    } catch (err: any) {
      setError(err.message || 'Gagal mentransfer kepemilikan.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSavePermissionMatrix = async () => {
    if (!isAdminOrOwner || !permMatrix || !wfMatrix || isSavingMatrix) return;

    setIsSavingMatrix(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/projects/${activeProjectId}/roles/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix: permMatrix, workflowMatrix: wfMatrix }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan matriks izin peran.');
      }

      setSuccessMsg(data.message || 'Matriks izin peran proyek berhasil diperbarui.');
      notifyProjectMembersUpdated(activeProjectId);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan matriks izin.');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  const togglePermission = (role: string, permKey: string) => {
    if (role === 'OWNER') return; // Owner permissions remain full for security
    setPermMatrix((prev) => {
      if (!prev) return prev;
      const roleMap = { ...prev[role] };
      roleMap[permKey] = !roleMap[permKey];
      return { ...prev, [role]: roleMap };
    });
  };

  const toggleWorkflow = (role: string, transitionKey: string) => {
    if (role === 'OWNER') return;
    setWfMatrix((prev) => {
      if (!prev) return prev;
      const roleMap = { ...prev[role] };
      roleMap[transitionKey] = !roleMap[transitionKey];
      return { ...prev, [role]: roleMap };
    });
  };

  const handleDeleteProject = async () => {
    if (!isOwner) return;
    const confirmName = prompt(
      `PERINGATAN: Tindakan ini akan menghapus proyek "${projectData?.projectName}" beserta SELURUH task di dalamnya secara permanen!\n\nKetik nama proyek untuk mengonfirmasi:`
    );

    if (confirmName !== projectData?.projectName) {
      alert('Nama proyek yang Anda ketikkan tidak cocok. Penghapusan dibatalkan.');
      return;
    }

    try {
      const res = await fetch(`/api/projects/${activeProjectId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Proyek berhasil dihapus.');
        onProjectUpdated();
        onClose();
      } else {
        const json = await res.json();
        alert(json.error || 'Gagal menghapus proyek.');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus proyek.');
    }
  };

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className={`${styles.roleBadge} ${styles.roleOwner}`}>
            <Crown size={12} /> Owner
          </span>
        );
      case 'ADMIN':
        return (
          <span className={`${styles.roleBadge} ${styles.roleAdmin}`}>
            <Star size={12} /> Admin
          </span>
        );
      case 'MEMBER':
        return (
          <span className={`${styles.roleBadge} ${styles.roleMember}`}>
            <UserIcon size={12} /> Member
          </span>
        );
      case 'VIEWER':
      default:
        return (
          <span className={`${styles.roleBadge} ${styles.roleViewer}`}>
            <Eye size={12} /> Viewer
          </span>
        );
    }
  };

  const rolesList: ProjectRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

  const categories = Array.from(new Set(ALL_PERMISSIONS_LIST.map((p) => p.category)));

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Settings size={20} style={{ color: '#38bdf8' }} />
            Pengaturan Proyek: {projectData?.projectName || '...'}
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className={styles.tabsList}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'general' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Settings size={14} /> General
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'members' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={14} /> Anggota ({members.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'roles' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <Shield size={14} /> Roles & Matrix
          </button>
          {isOwner && (
            <button
              className={`${styles.tabBtn} ${activeTab === 'danger' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('danger')}
              style={{ color: activeTab === 'danger' ? '#f87171' : undefined }}
            >
              <AlertTriangle size={14} /> Danger Zone
            </button>
          )}
        </div>

        <div className={styles.modalBody}>
          {error && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'hsla(350, 90%, 55%, 0.15)',
                border: '1px solid hsla(350, 90%, 55%, 0.3)',
                color: 'hsl(350, 95%, 85%)',
                fontSize: '0.8rem',
              }}
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'hsla(145, 80%, 45%, 0.15)',
                border: '1px solid hsla(145, 80%, 45%, 0.3)',
                color: 'hsl(145, 80%, 85%)',
                fontSize: '0.8rem',
              }}
            >
              {successMsg}
            </div>
          )}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              Memuat data proyek...
            </div>
          ) : (
            <>
              {/* GENERAL TAB */}
              {activeTab === 'general' && (
                <form
                  onSubmit={handleUpdateGeneral}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nama Proyek</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className={styles.input}
                      disabled={!isOwner}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Deskripsi Proyek</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={styles.textarea}
                      disabled={!isOwner}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Visibilitas</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as any)}
                      className={styles.select}
                      disabled={!isOwner}
                    >
                      <option value="PRIVATE">PRIVATE (Hanya Anggota Terdaftar)</option>
                      <option value="TEAM">TEAM (Dapat Diakses Seluruh Tim)</option>
                    </select>
                  </div>

                  {isOwner && (
                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={isSavingGeneral}
                      style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}
                    >
                      <Check size={16} /> {isSavingGeneral ? 'Memperbarui...' : 'Simpan Perubahan'}
                    </button>
                  )}
                </form>
              )}

              {/* MEMBERS TAB */}
              {activeTab === 'members' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Invite Code Management Card (for Owner / Admin) */}
                  {isAdminOrOwner && (
                    <div
                      style={{
                        background: 'var(--glass)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                          <Key size={16} style={{ color: 'var(--secondary)' }} />
                          Invite Code Proyek
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'hsla(0, 0%, 100%, 0.5)' }}>
                          Mekanisme bergabung ke proyek
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {inviteCode ? (
                          <>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'rgba(15, 23, 42, 0.7)',
                                border: '1px solid var(--secondary-glow)',
                                borderRadius: '8px',
                                padding: '0.45rem 0.85rem',
                                fontFamily: 'monospace',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                color: 'hsl(210, 90%, 82%)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                              }}
                            >
                              <span>{inviteCode}</span>
                              <button
                                type="button"
                                onClick={handleCopyInviteCode}
                                className={styles.iconBtn}
                                title="Salin Invite Code"
                                style={{ color: isCopyingCode ? '#10b981' : 'hsla(0, 0%, 100%, 0.7)' }}
                              >
                                {isCopyingCode ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={handleGenerateInviteCode}
                              disabled={isGeneratingCode}
                              className={styles.submitBtn}
                              style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
                              title="Buat kode baru & batalkan kode lama"
                            >
                              <RefreshCw size={14} />
                              Regenerate Code
                            </button>

                            <button
                              type="button"
                              onClick={handleRevokeInviteCode}
                              disabled={isGeneratingCode}
                              className={styles.iconBtn}
                              style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem', border: '1px solid hsla(350, 80%, 60%, 0.3)', color: 'hsl(350, 95%, 85%)' }}
                              title="Nonaktifkan Invite Code"
                            >
                              <Ban size={14} /> Nonaktifkan
                            </button>
                          </>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              Belum ada Invite Code aktif untuk proyek ini.
                            </span>
                            <button
                              type="button"
                              onClick={handleGenerateInviteCode}
                              disabled={isGeneratingCode}
                              className={styles.submitBtn}
                              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                            >
                              <Key size={14} /> Generate Invite Code
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                      Daftar Anggota Proyek ({members.length})
                    </div>
                  </div>

                  <div className={styles.tableContainer}>
                    <table className={styles.membersTable}>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Joined Date</th>
                          <th>Status</th>
                          {isOwner && <th>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m) => (
                          <tr key={m.id}>
                            <td>
                              <div className={styles.userCell}>
                                <div className={styles.userAvatar}>
                                  {m.user.image ? (
                                    <img
                                      src={m.user.image}
                                      alt={m.user.name}
                                      className={styles.avatarImg}
                                    />
                                  ) : m.user.name ? (
                                    m.user.name[0].toUpperCase()
                                  ) : (
                                    'U'
                                  )}
                                </div>
                                <div className={styles.userInfo}>
                                  <span className={styles.userName}>{m.user.name}</span>
                                  <span className={styles.userHandle}>
                                    {m.user.email}
                                    {m.user.username ? ` (@${m.user.username})` : ''}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>{renderRoleBadge(m.role)}</td>
                            <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              {m.joinedAt
                                ? format(new Date(m.joinedAt), 'dd MMM yyyy')
                                : '-'}
                            </td>
                            <td>
                              <span className={styles.statusActive}>Active</span>
                            </td>
                            {isOwner && (
                              <td>
                                <div className={styles.actionCell}>
                                  {m.userId !== projectData?.ownerUserId ? (
                                    <>
                                      <select
                                        value={m.role}
                                        onChange={(e) =>
                                          handleChangeRole(m.userId, e.target.value)
                                        }
                                        disabled={updatingMemberUserId === m.userId}
                                        className={styles.select}
                                        style={{
                                          padding: '0.3rem 0.5rem',
                                          fontSize: '0.75rem',
                                          width: 'auto',
                                          opacity: updatingMemberUserId === m.userId ? 0.6 : 1,
                                          cursor: updatingMemberUserId === m.userId ? 'not-allowed' : 'pointer',
                                        }}
                                      >
                                        <option value="ADMIN">Admin</option>
                                        <option value="MEMBER">Member</option>
                                        <option value="VIEWER">Viewer</option>
                                      </select>

                                      <button
                                        onClick={() => setTransferTargetUser(m)}
                                        disabled={updatingMemberUserId === m.userId}
                                        className={styles.transferBtn}
                                        title="Transfer Kepemilikan Proyek"
                                        style={{ opacity: updatingMemberUserId === m.userId ? 0.5 : 1 }}
                                      >
                                        <Crown size={12} /> Transfer
                                      </button>

                                      <button
                                        onClick={() => handleRemoveMember(m)}
                                        disabled={updatingMemberUserId === m.userId}
                                        className={styles.iconBtn}
                                        title="Hapus dari proyek"
                                        style={{
                                          opacity: updatingMemberUserId === m.userId ? 0.5 : 1,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem',
                                          padding: '0.35rem 0.65rem',
                                          background: 'rgba(239, 68, 68, 0.12)',
                                          border: '1px solid rgba(239, 68, 68, 0.3)',
                                          color: '#ef4444',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          fontWeight: 500,
                                          cursor: updatingMemberUserId === m.userId ? 'not-allowed' : 'pointer',
                                        }}
                                      >
                                        {updatingMemberUserId === m.userId ? (
                                          <InlineSpinner size={13} />
                                        ) : (
                                          <Trash2 size={13} />
                                        )}
                                        <span>Hapus</span>
                                      </button>
                                    </>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                                      Owner Utama
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ROLES & PERMISSION MATRIX TAB */}
              {activeTab === 'roles' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                        Configurable Project Role Permission Matrix
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                        Atur hak akses granular dan transisi workflow untuk setiap peran proyek.
                      </div>
                    </div>
                    {isAdminOrOwner && (
                      <button
                        onClick={handleSavePermissionMatrix}
                        className={styles.submitBtn}
                        disabled={isSavingMatrix}
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                      >
                        <Save size={15} /> {isSavingMatrix ? 'Menyimpan...' : 'Save Matrix'}
                      </button>
                    )}
                  </div>

                  {permMatrix && wfMatrix && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Permission Matrix Table */}
                      <div className={styles.tableContainer}>
                        <table className={styles.membersTable}>
                          <thead>
                            <tr>
                              <th>Permission</th>
                              <th style={{ textAlign: 'center' }}>Owner 👑</th>
                              <th style={{ textAlign: 'center' }}>Admin ⭐</th>
                              <th style={{ textAlign: 'center' }}>Member 👤</th>
                              <th style={{ textAlign: 'center' }}>Viewer 👀</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categories.map((cat) => (
                              <React.Fragment key={cat}>
                                <tr className={styles.matrixCategoryRow}>
                                  <td colSpan={5}>{cat}</td>
                                </tr>
                                {ALL_PERMISSIONS_LIST.filter((p) => p.category === cat).map(
                                  (perm) => (
                                    <tr key={perm.key}>
                                      <td style={{ fontSize: '0.8rem' }}>{perm.name}</td>
                                      {rolesList.map((r) => (
                                        <td key={r} style={{ textAlign: 'center' }}>
                                          <input
                                            type="checkbox"
                                            checked={!!permMatrix[r]?.[perm.key]}
                                            disabled={r === 'OWNER' || !isAdminOrOwner}
                                            onChange={() => togglePermission(r, perm.key)}
                                            className={styles.matrixCheckbox}
                                          />
                                        </td>
                                      ))}
                                    </tr>
                                  )
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Workflow Transition Matrix Table */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                          Workflow Transition Permission
                        </div>
                        <div className={styles.tableContainer}>
                          <table className={styles.membersTable}>
                            <thead>
                              <tr>
                                <th>Workflow Transition</th>
                                <th style={{ textAlign: 'center' }}>Owner 👑</th>
                                <th style={{ textAlign: 'center' }}>Admin ⭐</th>
                                <th style={{ textAlign: 'center' }}>Member 👤</th>
                                <th style={{ textAlign: 'center' }}>Viewer 👀</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ALL_WORKFLOW_TRANSITIONS.map((trans) => {
                                const key = `${trans.fromStatus}->${trans.toStatus}`;
                                return (
                                  <tr key={key}>
                                    <td style={{ fontSize: '0.8rem' }}>{trans.label}</td>
                                    {rolesList.map((r) => (
                                      <td key={r} style={{ textAlign: 'center' }}>
                                        <input
                                          type="checkbox"
                                          checked={!!wfMatrix[r]?.[key]}
                                          disabled={r === 'OWNER' || !isAdminOrOwner}
                                          onChange={() => toggleWorkflow(r, key)}
                                          className={styles.matrixCheckbox}
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DANGER ZONE TAB */}
              {activeTab === 'danger' && isOwner && (
                <div
                  style={{
                    padding: '1.25rem',
                    background: 'hsla(350, 85%, 50%, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid hsla(350, 85%, 50%, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'hsl(350, 95%, 85%)',
                      fontWeight: 600,
                    }}
                  >
                    <AlertTriangle size={20} />
                    Hapus Proyek Ini
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    Tindakan ini tidak dapat dibatalkan. Seluruh tugas, lampiran, komentar, dan
                    riwayat aktivitas yang terkait dengan proyek ini akan dihapus secara permanen dari
                    basis data.
                  </p>
                  <button
                    onClick={handleDeleteProject}
                    className={styles.dangerBtn}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Hapus Proyek Secara Permanen
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Tutup
          </button>
        </div>
      </div>

      {/* ─── INVITE MEMBER SUB-DIALOG ─── */}
      {isInviteDialogOpen && (
        <div
          className={styles.modalOverlay}
          style={{ zIndex: 1100 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsInviteDialogOpen(false);
            setInviteSearchQuery('');
            setSelectedInviteUser(null);
            setSearchResults([]);
          }}
        >
          <div
            className={styles.modalCard}
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <UserPlus size={18} style={{ color: '#38bdf8' }} />
                Invite Member
              </div>
              <button
                onClick={() => {
                  setIsInviteDialogOpen(false);
                  setInviteSearchQuery('');
                  setSelectedInviteUser(null);
                  setSearchResults([]);
                }}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInviteMember}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup} style={{ position: 'relative' }}>
                  <label className={styles.label}>Cari Pengguna (Email atau Username) *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Ketik minimal 3 karakter..."
                      value={inviteSearchQuery}
                      onChange={(e) => {
                        setInviteSearchQuery(e.target.value);
                        setSelectedInviteUser(null);
                      }}
                      className={styles.input}
                      style={{ paddingLeft: '2.2rem' }}
                      autoFocus
                    />
                    <Search
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '0.8rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                      }}
                    />
                  </div>

                  {inviteSearchQuery.trim().length > 0 &&
                    inviteSearchQuery.trim().length < 3 && (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        Ketik minimal 3 karakter untuk melakukan pencarian...
                      </span>
                    )}

                  {isSearching && (
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                      Mencari di server...
                    </span>
                  )}

                  {searchResults.length > 0 && !selectedInviteUser && (
                    <div
                      style={{
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        marginTop: '6px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                      }}
                    >
                      {searchResults.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedInviteUser(u);
                            setInviteSearchQuery(u.name);
                          }}
                          style={{
                            padding: '0.6rem 0.85rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                          }}
                        >
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: '#3b82f6',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {u.name ? u.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc' }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {u.email} {u.username ? `(@${u.username})` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedInviteUser && (
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc' }}>
                        {selectedInviteUser.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {selectedInviteUser.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInviteUser(null);
                        setInviteSearchQuery('');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Project Role *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className={styles.select}
                  >
                    <option value="ADMIN">Admin (Dapat mengelola task & mengundang anggota)</option>
                    <option value="MEMBER">Member (Dapat membuat & mengedit task milik sendiri)</option>
                    <option value="VIEWER">Viewer (Read-only / hanya membaca)</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteDialogOpen(false);
                    setInviteSearchQuery('');
                    setSelectedInviteUser(null);
                    setSearchResults([]);
                  }}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={!selectedInviteUser || isInviting}
                  style={{ opacity: !selectedInviteUser || isInviting ? 0.5 : 1 }}
                >
                  {isInviting ? 'Inviting...' : 'Invite Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TRANSFER OWNERSHIP CONFIRMATION DIALOG ─── */}
      {transferTargetUser && (
        <div
          className={styles.modalOverlay}
          style={{ zIndex: 1100 }}
          onClick={(e) => {
            e.stopPropagation();
            setTransferTargetUser(null);
          }}
        >
          <div
            className={styles.modalCard}
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle} style={{ color: '#fde047' }}>
                <Crown size={20} />
                Transfer Kepemilikan Proyek
              </div>
              <button
                onClick={() => setTransferTargetUser(null)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                Apakah Anda yakin ingin mentransfer kepemilikan proyek{' '}
                <strong>"{projectData?.projectName}"</strong> kepada{' '}
                <strong>"{transferTargetUser.user.name}"</strong>?
              </p>
              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  color: '#fde047',
                }}
              >
                ⚠️ Perhatian: Setelah transfer, Anda akan menjadi <strong>Admin</strong> proyek ini dan
                hanya <strong>{transferTargetUser.user.name}</strong> yang memiliki akses penuh sebagai Owner.
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setTransferTargetUser(null)}
                className={styles.cancelBtn}
                disabled={isTransferring}
              >
                Batal
              </button>
              <button
                onClick={handleTransferOwnership}
                className={styles.submitBtn}
                style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)' }}
                disabled={isTransferring}
              >
                <ArrowRightLeft size={16} />
                {isTransferring ? 'Mentransfer...' : 'Transfer Kepemilikan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
