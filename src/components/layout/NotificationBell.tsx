'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Inbox, ChevronRight, UserCheck } from 'lucide-react';
import styles from './NotificationBell.module.css';
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface NotificationBellProps {
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  isCollapsed = false,
  isMobileOpen = false,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  const displayBadge = () => {
    if (unreadCount === 0) return null;
    if (unreadCount > 99) return '99+';
    return unreadCount.toString();
  };

  // Close dropdown on click outside or ESC key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const { activeProject, switchProject } = useProjectContext();
  const toastCtx = useSafeToast();

  const handleItemClick = async (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);

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

  const isCollapsedView = isCollapsed && !isMobileOpen;

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${styles.bellTrigger} ${isOpen ? styles.bellTriggerActive : ''} ${
          isCollapsedView ? styles.collapsedTrigger : ''
        }`}
        aria-label="Notifications"
        aria-expanded={isOpen}
        title={isCollapsedView ? `Notifikasi (${unreadCount} belum dibaca)` : undefined}
      >
        <div className={styles.iconWrapper}>
          <Bell className={styles.bellIcon} size={16} />
          {unreadCount > 0 && (
            <span className={`${styles.badge} ${isCollapsedView ? styles.collapsedBadge : ''}`}>
              {displayBadge()}
            </span>
          )}
        </div>
        {!isCollapsedView && <span className={styles.label}>Notifikasi</span>}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          className={`${styles.dropdownPanel} ${
            isCollapsedView ? styles.dropdownPanelCollapsed : ''
          }`}
          role="dialog"
          aria-label="Notification Panel"
        >
          {/* Panel Header */}
          <div className={styles.panelHeader}>
            <div className={styles.headerTitleArea}>
              <span className={styles.panelTitle}>Notifikasi</span>
              {unreadCount > 0 && (
                <span className={styles.headerBadge}>{unreadCount} Baru</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className={styles.markAllBtn}
                title="Tandai semua telah dibaca"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className={styles.notificationList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <Inbox className={styles.emptyIcon} size={32} />
                <span className={styles.emptyTitle}>No notifications</span>
                <span className={styles.emptyText}>You have no notifications at this time.</span>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`${styles.notificationItem} ${
                    !item.isRead ? styles.unreadItem : ''
                  }`}
                >
                  <div className={!item.isRead ? styles.unreadDot : styles.readDot} />
                  <div className={styles.notificationContent}>
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
                      <span className={styles.assignedByText}>
                        Assigned by: {item.assignedBy}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panel Footer: View All Notifications Link */}
          <div className={styles.panelFooter}>
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className={styles.viewAllLink}
            >
              <span>View All Notifications</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
