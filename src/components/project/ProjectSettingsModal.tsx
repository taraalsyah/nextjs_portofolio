'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, Users, AlertTriangle, UserPlus, Trash2, Check, Shield } from 'lucide-react';
import styles from './project.module.css';
import { notifyProjectMembersUpdated } from '@/hooks/useProjectMembers';

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
    image?: string | null;
  };
}

interface SearchUserItem {
  id: number;
  name: string;
  email: string;
  image?: string | null;
}

export function ProjectSettingsModal({
  isOpen,
  onClose,
  activeProjectId,
  onProjectUpdated,
}: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'danger'>('general');
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [currentRole, setCurrentRole] = useState<string>('VIEWER');
  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'TEAM'>('PRIVATE');
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  // Invite states
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedInviteUser, setSelectedInviteUser] = useState<SearchUserItem | null>(null);
  const [inviteRole, setInviteRole] = useState<string>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);

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
      }

      const memRes = await fetch(`/api/projects/${activeProjectId}/members`);
      if (memRes.ok) {
        const memData = await memRes.json();
        setMembers(memData.members || []);
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

  // Search users for invite
  useEffect(() => {
    if (!inviteSearchQuery.trim() || inviteSearchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/projects/${activeProjectId}/members/search-users?q=${encodeURIComponent(inviteSearchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => setSearchResults(data.users || []))
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [inviteSearchQuery, activeProjectId]);

  if (!isOpen) return null;

  const isOwner = currentRole === 'OWNER';

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

  const handleInviteMember = async () => {
    if (!selectedInviteUser || isInviting) return;
    setIsInviting(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${activeProjectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedInviteUser.id,
          role: inviteRole,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Gagal mengundang anggota.');
      }

      const data = await res.json();
      setInviteSearchQuery('');
      setSelectedInviteUser(null);
      setSearchResults([]);
      setSuccessMsg('Anggota berhasil ditambahkan ke proyek.');
      
      // Update local modal state immediately
      if (data.member) {
        setMembers((prev) => {
          if (prev.some((m) => m.userId === data.member.userId)) return prev;
          return [...prev, data.member];
        });
      }

      // Notify all application components of updated members
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
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, role: newRole }),
      });

      if (!res.ok) {
        const json = await res.json();
        alert(json.error || 'Gagal mengubah peran anggota.');
        return;
      }

      setMembers((prev) =>
        prev.map((m) => (m.userId === targetUserId ? { ...m, role: newRole } : m))
      );
      notifyProjectMembersUpdated(activeProjectId);
      fetchProjectDetails();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah peran anggota.');
    }
  };

  const handleRemoveMember = async (member: any) => {
    if (!isOwner) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus "${member.user.name}" dari proyek ini?`)) return;

    try {
      const res = await fetch(`/api/projects/${activeProjectId}/members?userId=${member.userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
        notifyProjectMembersUpdated(activeProjectId);
        fetchProjectDetails();
      } else {
        const json = await res.json();
        alert(json.error || 'Gagal menghapus anggota.');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus anggota.');
    }
  };

  const handleDeleteProject = async () => {
    if (!isOwner) return;
    const confirmName = prompt(`PERINGATAN: Tindakan ini akan menghapus proyek "${projectData?.projectName}" beserta SELURUH task di dalamnya secara permanen!\n\nKetik nama proyek untuk mengonfirmasi:`);

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
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Memuat data proyek...</div>
          ) : (
            <>
              {/* GENERAL TAB */}
              {activeTab === 'general' && (
                <form onSubmit={handleUpdateGeneral} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  {/* Invite User Box */}
                  {(isOwner || currentRole === 'ADMIN') && (
                    <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <UserPlus size={16} style={{ color: '#38bdf8' }} /> Undang Anggota Baru
                      </div>

                      <div className={styles.formGroup} style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Cari pengguna berdasarkan nama atau email..."
                          value={inviteSearchQuery}
                          onChange={(e) => {
                            setInviteSearchQuery(e.target.value);
                            setSelectedInviteUser(null);
                          }}
                          className={styles.input}
                        />

                        {/* Search Dropdown Results */}
                        {searchResults.length > 0 && !selectedInviteUser && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', zIndex: 10, marginTop: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                            {searchResults.map((u) => (
                              <div
                                key={u.id}
                                onClick={() => {
                                  setSelectedInviteUser(u);
                                  setInviteSearchQuery(u.name);
                                }}
                                style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.85rem' }}
                              >
                                <div style={{ fontWeight: 600, color: '#f8fafc' }}>{u.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedInviteUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className={styles.select} style={{ flex: 1 }}>
                            {isOwner && <option value="OWNER">OWNER</option>}
                            <option value="ADMIN">ADMIN</option>
                            <option value="MEMBER">MEMBER</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                          <button onClick={handleInviteMember} className={styles.submitBtn} disabled={isInviting}>
                            {isInviting ? 'Menambahkan...' : 'Undang'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Members List */}
                  <div className={styles.memberList}>
                    {members.map((m) => (
                      <div key={m.id} className={styles.memberRow}>
                        <div className={styles.memberLeft}>
                          <div className={styles.memberAvatar}>
                            {m.user.name ? m.user.name[0].toUpperCase() : 'U'}
                          </div>
                          <div className={styles.memberMeta}>
                            <span className={styles.memberName}>{m.user.name}</span>
                            <span className={styles.memberEmail}>{m.user.email}</span>
                          </div>
                        </div>

                        <div className={styles.memberActions}>
                          {isOwner && m.userId !== projectData?.ownerUserId ? (
                            <select
                              value={m.role}
                              onChange={(e) => handleChangeRole(m.userId, e.target.value)}
                              className={styles.select}
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              <option value="OWNER">OWNER</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="MEMBER">MEMBER</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>
                          ) : (
                            <span className={`${styles.roleBadge} ${m.role === 'OWNER' ? styles.roleOwner : m.role === 'ADMIN' ? styles.roleAdmin : m.role === 'MEMBER' ? styles.roleMember : styles.roleViewer}`}>
                              {m.role}
                            </span>
                          )}

                          {isOwner && m.userId !== projectData?.ownerUserId && (
                            <button onClick={() => handleRemoveMember(m)} className={styles.iconBtn} title="Hapus dari proyek">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DANGER ZONE TAB */}
              {activeTab === 'danger' && isOwner && (
                <div style={{ padding: '1.25rem', background: 'hsla(350, 85%, 50%, 0.08)', borderRadius: '12px', border: '1px solid hsla(350, 85%, 50%, 0.25)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(350, 95%, 85%)', fontWeight: 600 }}>
                    <AlertTriangle size={20} />
                    Hapus Proyek Ini
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    Tindakan ini tidak dapat dibatalkan. Seluruh tugas, lampiran, komentar, dan riwayat aktivitas yang terkait dengan proyek ini akan dihapus secara permanen dari basis data.
                  </p>
                  <button onClick={handleDeleteProject} className={styles.dangerBtn} style={{ alignSelf: 'flex-start' }}>
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
    </div>
  );
}
