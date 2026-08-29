'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Inbox, ArrowUpRight } from 'lucide-react';
import styles from './notifications.module.css';
import { useNotifications, NotificationItem } from '@/hooks/useNotifications';

import { useProjectContext } from '@/context/ProjectContext';
import { useSafeToast } from '@/components/ui/Toast';

function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Baru saja';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function NotificationsContent() {
  const router = useRouter();
  const { activeProject, switchProject } = useProjectContext();
  const toastCtx = useSafeToast();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const { notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification } =
    useNotifications();

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'read') return n.isRead;
    return true;
  });

  const handleCardClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (!item.taskId) return;

    // Resolve target projectId
    let targetProjectId = item.projectId;
    if (!targetProjectId) {
      try {
        const res = await fetch(`/api/tasks/${item.taskId}`);
        if (res.ok) {
          const data = await res.json();
          targetProjectId = data.task?.projectId;
        }
      } catch (e) {
        console.error('Failed to resolve task project context:', e);
      }
    }

    const currentActiveId = activeProject?.projectId;

    // If notification belongs to a different project, switch project first
    if (targetProjectId && currentActiveId !== targetProjectId) {
      const success = await switchProject(targetProjectId);
      if (!success) {
        if (toastCtx?.showToast) {
          toastCtx.showToast('Anda tidak memiliki akses ke proyek task ini.', 'error');
        }
        return;
      }
    }

    router.push(`/dashboard/task-management/${item.taskId}`);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.mainCard}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.titleGroup}>
            <div className={styles.headerIcon}>
              <Bell size={20} />
            </div>
            <div>
              <h2 className={styles.pageTitle}>All Notifications</h2>
              <p className={styles.pageSubtitle}>
                Kelola seluruh riwayat pemberitahuan dan aktivitas penugasan akun Anda.
              </p>
            </div>
          </div>

          <div className={styles.actionGroup}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className={styles.markAllBtn}
                title="Tandai seluruh notifikasi sebagai dibaca"
              >
                <CheckCheck size={14} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.tabGroup}>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`${styles.tabBtn} ${activeTab === 'unread' ? styles.tabBtnActive : ''}`}
            >
              Belum Dibaca ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('read')}
              className={`${styles.tabBtn} ${activeTab === 'read' ? styles.tabBtnActive : ''}`}
            >
              Sudah Dibaca ({notifications.length - unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount} Belum Dibaca</span>
          )}
        </div>

        {/* Notification List */}
        <div className={styles.notificationList}>
          {filteredNotifications.length === 0 ? (
            <div className={styles.emptyState}>
              <Inbox className={styles.emptyIcon} size={36} />
              <span className={styles.emptyTitle}>No notifications</span>
              <span className={styles.emptyText}>
                {activeTab === 'unread'
                  ? 'Tidak ada notifikasi yang belum dibaca.'
                  : 'Belum ada notifikasi pada kategori ini.'}
              </span>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`${styles.itemCard} ${!item.isRead ? styles.unreadCard : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.dotWrapper}>
                  <div className={!item.isRead ? styles.unreadDot : styles.readDot} />
                </div>

                <div className={styles.contentWrapper}>
                  <div className={styles.itemHeader}>
                    <span
                      className={`${styles.itemTitle} ${
                        !item.isRead ? styles.unreadTitle : ''
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className={styles.itemTime}>
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <p className={styles.itemMessage}>{item.message}</p>

                  {item.assignedBy && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.4rem' }}>
                      Assigned by: {item.assignedBy}
                    </div>
                  )}

                  <div className={styles.itemActions}>
                    {item.taskId && (
                      <span className={styles.actionLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <span>Lihat Task</span>
                        <ArrowUpRight size={13} />
                      </span>
                    )}
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                        }}
                        className={styles.actionLink}
                      >
                        Tandai Dibaca
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      className={styles.deleteBtn}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
