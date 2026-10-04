'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Inbox, ChevronRight, UserCheck, X, Smartphone } from 'lucide-react';
import styles from './NotificationBell.module.css';
import { useNotifications, NotificationItem } from '@/hooks/useNotifications';
import { useProjectContext } from '@/context/ProjectContext';
import { useSafeToast } from '@/components/ui/Toast';
import {
  getPushSubscriptionStatus,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from '@/lib/push-client';

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
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [pushLoading, setPushLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAllAsRead, markAsRead, latestRealtimeToast } = useNotifications();
  const { activeProject, switchProject } = useProjectContext();
  const toastCtx = useSafeToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check Web Push subscription status on mount
  useEffect(() => {
    getPushSubscriptionStatus().then((status) => {
      setIsPushSubscribed(status.isSubscribed);
    });
  }, []);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isCollapsedView = isCollapsed && !isMobileOpen;
      const bottom = window.innerHeight - rect.top + 8;
      const left = isCollapsedView ? Math.max(12, rect.left) : rect.left;
      const width = isCollapsedView ? 310 : Math.max(rect.width, 280);

      setPanelStyle({
        position: 'fixed',
        bottom: `${bottom}px`,
        left: `${left}px`,
        width: `${width}px`,
        zIndex: 9999,
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  const handleTogglePush = async () => {
    setPushLoading(true);
    if (isPushSubscribed) {
      const res = await unsubscribeUserFromPush();
      if (res.success) {
        setIsPushSubscribed(false);
        if (toastCtx?.showToast) toastCtx.showToast('Notifikasi HP dinonaktifkan.', 'info');
      } else {
        if (toastCtx?.showToast) toastCtx.showToast(res.error || 'Gagal menonaktifkan.', 'error');
      }
    } else {
      const res = await subscribeUserToPush();
      if (res.success) {
        setIsPushSubscribed(true);
        if (toastCtx?.showToast) toastCtx.showToast('Notifikasi HP berhasil diaktifkan!', 'success');
      } else {
        if (toastCtx?.showToast) toastCtx.showToast(res.error || 'Gagal mengaktifkan notifikasi.', 'error');
      }
    }
    setPushLoading(false);
  };

  // Sync activeToast when a new realtime notification arrives via Pusher
  useEffect(() => {
    if (latestRealtimeToast) {
      setActiveToast(latestRealtimeToast);
    }
  }, [latestRealtimeToast]);

  // Auto-hide toast after 4 seconds (does NOT mark notification as read)
  useEffect(() => {
    if (!activeToast) return;

    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [activeToast]);

  const displayBadge = () => {
    if (unreadCount === 0) return null;
    if (unreadCount > 99) return '99+';
    return unreadCount.toString();
  };

  // Close dropdown on click outside or ESC key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedBtn = buttonRef.current && buttonRef.current.contains(target);
      const clickedPanel = panelRef.current && panelRef.current.contains(target);

      if (!clickedBtn && !clickedPanel) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    function handleReposition() {
      updatePosition();
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleReposition);
      window.addEventListener('scroll', handleReposition, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen]);

  const handleItemClick = async (item: NotificationItem) => {
    markAsRead(item.id);
    setActiveToast(null);
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

  const dropdownPanelElement = (
    <div
      ref={panelRef}
      style={panelStyle}
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
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={handleTogglePush}
            disabled={pushLoading}
            className={`${styles.pushToggleBtn} ${isPushSubscribed ? styles.pushActive : ''}`}
            title={isPushSubscribed ? 'Matikan Notifikasi HP' : 'Aktifkan Notifikasi HP'}
          >
            <Smartphone size={13} />
            <span>{isPushSubscribed ? 'Notifikasi HP Aktif' : 'Aktifkan HP'}</span>
          </button>
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
  );

  return (
    <div className={styles.container}>
      {/* Realtime Toast Popup (Positioned Above Notification Bell) */}
      {activeToast && (
        <div
          className={styles.toastPopup}
          onClick={() => handleItemClick(activeToast)}
          role="alert"
          aria-live="polite"
        >
          <div className={styles.toastHeader}>
            <div className={styles.toastTitleArea}>
              <Bell className={styles.toastIcon} size={14} />
              <span className={styles.toastTitle}>{activeToast.title}</span>
            </div>
            <button
              type="button"
              className={styles.toastCloseBtn}
              onClick={(e) => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              aria-label="Tutup notifikasi"
              title="Tutup"
            >
              <X size={14} />
            </button>
          </div>
          <p className={styles.toastMessage}>{activeToast.message}</p>
          {activeToast.assignedBy && (
            <span className={styles.toastAssignedBy}>
              Assigned by: {activeToast.assignedBy}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        ref={buttonRef}
        onClick={handleToggle}
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
        <span className={styles.label}>Notifikasi</span>
      </button>

      {/* Notification Dropdown Panel via Portal */}
      {isOpen && mounted && createPortal(dropdownPanelElement, document.body)}
    </div>
  );
};

export default NotificationBell;
