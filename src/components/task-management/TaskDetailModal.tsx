'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Edit3, ShieldAlert, CheckCircle, XCircle, Clock, Send, Ban, CheckSquare, ChevronDown, Check, User, UserCheck, Tag, Calendar, Hash } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { TaskChecklistSection, ChecklistItem } from './TaskChecklistSection';
import { TaskCommentSection } from './TaskCommentSection';
import { TaskAttachmentSection } from './TaskAttachmentSection';
import { TaskHistorySection } from './TaskHistorySection';
import { ProjectPermissions } from '@/lib/project';
import { notifyTaskMutated } from '@/lib/task-event';
import InlineSpinner from '@/components/ui/loading/InlineSpinner';

interface TaskDetailData {
  id: number;
  taskNumber: string;
  projectId: number;
  title: string;
  description: string;
  status: string;
  isLocked?: boolean;
  priority: string;
  assigneeId: number | null;
  createdById: number;
  categoryId: number | null;
  tags: string | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Done Request fields
  doneRequestStatus?: string;
  doneRequestedById?: number | null;
  doneRequestedAt?: string | null;
  doneRequestNote?: string | null;
  doneReviewedById?: number | null;
  doneReviewedAt?: string | null;
  doneRejectReason?: string | null;
  doneRequestedBy?: { id: number; name: string; username: string; email: string; image: string | null } | null;
  doneReviewedBy?: { id: number; name: string; username: string; email: string; image: string | null } | null;
  // Close Request fields
  closeRequestStatus?: string;
  closeRequestedById?: number | null;
  closeRequestedAt?: string | null;
  closeRequestReason?: string | null;
  closeReviewedById?: number | null;
  closeReviewedAt?: string | null;
  closeRejectReason?: string | null;
  closeRequestedBy?: { id: number; name: string; username: string; email: string; image: string | null } | null;
  closeReviewedBy?: { id: number; name: string; username: string; email: string; image: string | null } | null;
  assignee: { id: number; name: string; username: string; email: string; image: string | null } | null;
  createdBy: { id: number; name: string; username: string; email: string; image: string | null } | null;
  category: { id: number; name: string; description: string } | null;
  checklists: ChecklistItem[];
  comments: Array<{
    id: number;
    content: string;
    createdAt: string;
    userId: number;
    user: { id: number; name: string; username?: string; image?: string };
  }>;
  attachments: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    createdAt: string;
    uploadedById: number;
    uploadedBy: { id: number; name: string };
  }>;
  histories: Array<{
    id: number;
    action: string;
    fieldName: string | null;
    previousValue: string | null;
    newValue: string | null;
    createdAt: string;
    userId: number;
    user: { id: number; name: string };
  }>;
}

interface TaskDetailModalProps {
  taskId: number | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  onEditRequest: (task: TaskDetailData) => void;
  onTaskUpdated?: () => void;
}

const STATUS_OPTIONS: { key: string; label: string; color: string; bgColor: string; borderColor: string; dotColor: string }[] = [
  {
    key: 'BACKLOG',
    label: 'Backlog',
    color: '#475569',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    dotColor: '#64748B',
  },
  {
    key: 'OPEN',
    label: 'Open',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    dotColor: '#2563EB',
  },
  {
    key: 'IN_PROGRESS',
    label: 'In Progress',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    dotColor: '#D97706',
  },
  {
    key: 'DONE',
    label: 'Done',
    color: '#16A34A',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    dotColor: '#16A34A',
  },
  {
    key: 'CLOSED',
    label: 'Closed',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    dotColor: '#DC2626',
  },
];

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
  isOwnerOrAdmin: boolean;
  isUpdatingStatus: boolean;
}

function StatusDropdown({
  currentStatus,
  onStatusChange,
  disabled = false,
  isOwnerOrAdmin,
  isUpdatingStatus,
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = STATUS_OPTIONS.find((opt) => opt.key === currentStatus) || {
    key: currentStatus,
    label: currentStatus,
    color: '#fff',
    bgColor: 'hsla(0,0%,100%,0.1)',
    borderColor: 'hsla(0,0%,100%,0.2)',
    dotColor: '#38bdf8',
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const availableOptions = STATUS_OPTIONS.filter(
    (opt) => opt.key !== 'CLOSED' || currentStatus === 'CLOSED'
  );

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', minWidth: '180px' }}>
      <button
        type="button"
        onClick={() => !disabled && !isUpdatingStatus && setIsOpen((prev) => !prev)}
        disabled={disabled || isUpdatingStatus}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          width: '100%',
          padding: '0.45rem 0.75rem',
          borderRadius: '8px',
          background: activeOption.bgColor,
          border: `1px solid ${activeOption.borderColor}`,
          color: activeOption.color,
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: disabled || isUpdatingStatus ? 'not-allowed' : 'pointer',
          opacity: disabled || isUpdatingStatus ? 0.7 : 1,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen
            ? `0 0 0 2px ${activeOption.borderColor}, 0 4px 14px rgba(0, 0, 0, 0.35)`
            : '0 2px 6px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: activeOption.dotColor,
              boxShadow: `0 0 6px ${activeOption.dotColor}`,
              flexShrink: 0,
            }}
          />
          <span>{activeOption.label}</span>
        </div>
        {isUpdatingStatus ? (
          <InlineSpinner size={14} color={activeOption.dotColor} />
        ) : (
          <ChevronDown
            size={14}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              opacity: 0.8,
            }}
          />
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            minWidth: '210px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '0.35rem',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
          }}
        >
          {availableOptions.map((opt) => {
            const isSelected = opt.key === currentStatus;
            const isOptionDisabled = opt.key === 'DONE' && !isOwnerOrAdmin;

            return (
              <button
                key={opt.key}
                type="button"
                disabled={isOptionDisabled}
                onClick={() => {
                  if (isOptionDisabled || isSelected) return;
                  setIsOpen(false);
                  onStatusChange(opt.key);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  border: isSelected ? `1px solid ${opt.borderColor}` : '1px solid transparent',
                  background: isSelected ? opt.bgColor : 'transparent',
                  color: isOptionDisabled ? 'var(--muted-foreground)' : opt.color,
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: isOptionDisabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  opacity: isOptionDisabled ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isOptionDisabled) {
                    e.currentTarget.style.background = 'var(--surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isOptionDisabled) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: isOptionDisabled ? '#64748b' : opt.dotColor,
                      flexShrink: 0,
                    }}
                  />
                  <span>{opt.label}</span>
                  {isOptionDisabled && (
                    <span style={{ fontSize: '0.7rem', color: 'hsla(0, 0%, 100%, 0.35)', marginLeft: '0.2rem' }}>
                      (Needs Approval)
                    </span>
                  )}
                </div>
                {isSelected && <Check size={14} style={{ color: opt.dotColor }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'BACKLOG':
      return styles.statusBacklog;
    case 'OPEN':
      return styles.statusOpen;
    case 'IN_PROGRESS':
      return styles.statusInProgress;
    case 'DONE':
      return styles.statusDone;
    case 'CLOSED':
    case 'LOCKED':
      return styles.statusLocked;
    default:
      return styles.statusBacklog;
  }
};

const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case 'LOW':
    case 'Low':
      return styles.priorityLow;
    case 'MEDIUM':
    case 'Medium':
      return styles.priorityMedium;
    case 'HIGH':
    case 'High':
      return styles.priorityHigh;
    case 'CRITICAL':
    case 'Critical':
      return styles.priorityCritical;
    default:
      return styles.priorityLow;
  }
};

const renderFormattedStatusMsg = (msg: string) => {
  const statusKeys = ['BACKLOG', 'OPEN', 'IN_PROGRESS', 'DONE', 'CLOSED'];
  const foundStatus = statusKeys.find((key) => msg.includes(key));

  if (foundStatus) {
    const parts = msg.split(foundStatus);
    const displayLabel = foundStatus === 'IN_PROGRESS' ? 'IN PROGRESS' : foundStatus;
    const badgeClass = getStatusBadgeClass(foundStatus);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.2rem' }}>
        <span>{parts[0]}</span>
        <span
          className={`${styles.badge} ${badgeClass}`}
          style={{
            margin: '0 0.25rem',
            padding: '0.2rem 0.55rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.03em',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          {displayLabel}
        </span>
        <span>{parts[1]}</span>
      </span>
    );
  }

  return <span>{msg}</span>;
};

export function TaskDetailModal({
  taskId,
  isOpen,
  onClose,
  currentUserId,
  onEditRequest,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<TaskDetailData | null>(null);
  const [userPermissions, setUserPermissions] = useState<ProjectPermissions | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'checklist' | 'comments' | 'attachments' | 'history'>('info');
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const hasChangesRef = React.useRef(false);

  const notifyUpdate = React.useCallback(() => {
    hasChangesRef.current = true;
    onTaskUpdated?.();
    if (taskId) {
      notifyTaskMutated(taskId);
    }
  }, [onTaskUpdated, taskId]);

  // Close Request state
  const [isCloseRequestLoading, setIsCloseRequestLoading] = useState(false);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [requestReasonText, setRequestReasonText] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState('');

  // Done Request state
  const [isDoneRequestLoading, setIsDoneRequestLoading] = useState(false);
  const [showDoneNoteInput, setShowDoneNoteInput] = useState(false);
  const [doneRequestNoteText, setDoneRequestNoteText] = useState('');
  const [showDoneRejectModal, setShowDoneRejectModal] = useState(false);
  const [doneRejectReasonText, setDoneRejectReasonText] = useState('');

  const isLoading = task === null && isOpen && taskId !== null;

  const fetchTaskDetails = React.useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const json = await res.json();
        setTask(json.task);
        setUserPermissions(json.userPermissions);
      } else {
        setStatusMsg({
          type: 'error',
          message: 'Gagal memuat detail task.',
        });
      }
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memuat detail task.',
      });
    }
  }, [taskId]);

  const handleCloseWithReset = () => {
    if (hasChangesRef.current) {
      onTaskUpdated?.();
      if (taskId) {
        notifyTaskMutated(taskId);
      }
      hasChangesRef.current = false;
    }
    setTask(null);
    setUserPermissions(null);
    setStatusMsg(null);
    setShowReasonInput(false);
    setRequestReasonText('');
    setShowRejectModal(false);
    setRejectReasonText('');
    setShowDoneNoteInput(false);
    setDoneRequestNoteText('');
    setShowDoneRejectModal(false);
    setDoneRejectReasonText('');
    onClose();
  };

  useEffect(() => {
    if (isOpen && taskId) {
      hasChangesRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState only fires after await; this is a false positive
      fetchTaskDetails();
    }
  }, [isOpen, taskId, fetchTaskDetails]);

  if (!isOpen || !taskId) return null;

  const isTaskDone = Boolean(task?.status === 'DONE' || task?.status === 'CLOSED' || task?.status === 'LOCKED' || task?.isLocked);
  const role = userPermissions?.role || 'MEMBER';
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';
  const isAssignee = task?.assigneeId === currentUserId;
  const canEditMetadata = !isTaskDone && isOwnerOrAdmin;
  const canUpdateProgress = !isTaskDone && (isOwnerOrAdmin || isAssignee);

  // Done Request State
  const doneRequestStatus = task?.doneRequestStatus || 'NONE';
  const showRequestDoneButton = !isTaskDone && isAssignee && !isOwnerOrAdmin && task?.status === 'IN_PROGRESS' && doneRequestStatus !== 'PENDING';
  const showPendingDoneBadge = !isTaskDone && isAssignee && doneRequestStatus === 'PENDING';
  const showDoneApprovalCard = !isTaskDone && isOwnerOrAdmin && doneRequestStatus === 'PENDING';
  const showDoneRejectedInfo = !isTaskDone && doneRequestStatus === 'REJECTED' && !isOwnerOrAdmin;

  // Close Request State
  const closeRequestStatus = task?.closeRequestStatus || 'NONE';
  const showRequestCloseButton = !isTaskDone && isAssignee && !isOwnerOrAdmin && (task?.status === 'IN_PROGRESS' || task?.status === 'DONE') && closeRequestStatus !== 'PENDING';
  const showPendingBadge = !isTaskDone && isAssignee && closeRequestStatus === 'PENDING';
  const showApprovalCard = !isTaskDone && isOwnerOrAdmin && closeRequestStatus === 'PENDING';
  const showRejectedInfo = !isTaskDone && closeRequestStatus === 'REJECTED' && !isOwnerOrAdmin;

  const handleStatusChange = async (newStatus: string) => {
    if (!task || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          message: data.error || 'Anda tidak memiliki izin untuk mengubah bidang ini.',
        });
        return;
      }

      setTask((prev: TaskDetailData | null) => prev ? { ...prev, status: data.task.status } : prev);
      setStatusMsg({
        type: 'success',
        message: `Workflow status berhasil diubah ke ${data.task.status}.`,
      });
      notifyUpdate();
      fetchTaskDetails();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal mengubah status workflow.';
      setStatusMsg({
        type: 'error',
        message: errMsg,
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ─── Done Request Handlers ──────────────────────────────────────────────────
  const handleRequestDone = async () => {
    if (!task || isDoneRequestLoading) return;
    setIsDoneRequestLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/request-done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: doneRequestNoteText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          message: data.error || 'Gagal mengajukan Request to Done.',
        });
        return;
      }

      setStatusMsg({
        type: 'success',
        message: 'Request to Done berhasil diajukan. Menunggu persetujuan Owner/Admin.',
      });
      setShowDoneNoteInput(false);
      setDoneRequestNoteText('');
      notifyUpdate();
      fetchTaskDetails();
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengajukan Request to Done.',
      });
    } finally {
      setIsDoneRequestLoading(false);
    }
  };

  const handleApproveDone = async () => {
    if (!task || isDoneRequestLoading) return;
    setIsDoneRequestLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/approve-done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          message: data.error || 'Gagal menyetujui Done Request.',
        });
        return;
      }

      setStatusMsg({
        type: 'success',
        message: 'Done Request disetujui. Task status otomatis diperbarui menjadi Done.',
      });
      notifyUpdate();
      fetchTaskDetails();
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyetujui Done Request.',
      });
    } finally {
      setIsDoneRequestLoading(false);
    }
  };

  const handleRejectDone = async () => {
    if (!task || isDoneRequestLoading) return;
    setIsDoneRequestLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/reject-done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectReason: doneRejectReasonText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          message: data.error || 'Gagal menolak Done Request.',
        });
        return;
      }

      setStatusMsg({
        type: 'success',
        message: 'Done Request ditolak. Task tetap berada dalam status In Progress.',
      });
      setShowDoneRejectModal(false);
      setDoneRejectReasonText('');
      notifyUpdate();
      fetchTaskDetails();
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menolak Done Request.',
      });
    } finally {
      setIsDoneRequestLoading(false);
    }
  };

  const handleCancelDone = async () => {
    if (!task || isDoneRequestLoading) return;
    setIsDoneRequestLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/cancel-done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          message: data.error || 'Gagal membatalkan Done Request.',
        });
        return;
      }

      setStatusMsg({
        type: 'success',
        message: 'Done Request berhasil dibatalkan.',
      });
      notifyUpdate();
      fetchTaskDetails();
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal membatalkan Done Request.',
      });
    } finally {
      setIsDoneRequestLoading(false);
    }
  };

  // ─── Close Request Handlers ─────────────────────────────────────────────────
  const handleRequestClose = async () => {
    if (!task || isCloseRequestLoading) return;
    setIsCloseRequestLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/request-close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestReason: requestReasonText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          message: data.error || 'Gagal mengajukan Close Request.',
        });
        return;
      }

      setStatusMsg({
        type: 'success',
        message: 'Close Request berhasil diajukan. Menunggu persetujuan Owner/Admin.',
      });
      setShowReasonInput(false);
      setRequestReasonText('');
      notifyUpdate();
      fetchTaskDetails();
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengajukan Close Request.',
      });
    } finally {
      setIsCloseRequestLoading(false);
    }
  };

  const handleApproveClose = async () => {
    if (!task || isCloseRequestLoading) return;
    setIsCloseRequestLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/approve-close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          message: data.error || 'Gagal menyetujui Close Request.',
        });
        return;
      }

      setStatusMsg({
        type: 'success',
        message: 'Close Request disetujui. Task telah ditutup (Closed).',
      });
      notifyUpdate();
      fetchTaskDetails();
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyetujui Close Request.',
      });
    } finally {
      setIsCloseRequestLoading(false);
    }
  };

  const handleRejectClose = async () => {
    if (!task || isCloseRequestLoading) return;
    setIsCloseRequestLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/reject-close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectReason: rejectReasonText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          message: data.error || 'Gagal menolak Close Request.',
        });
        return;
      }

      setStatusMsg({
        type: 'success',
        message: 'Close Request ditolak. Task kembali ke status DONE.',
      });
      setShowRejectModal(false);
      setRejectReasonText('');
      notifyUpdate();
      fetchTaskDetails();
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menolak Close Request.',
      });
    } finally {
      setIsCloseRequestLoading(false);
    }
  };

  const handleCancelClose = async () => {
    if (!task || isCloseRequestLoading) return;
    setIsCloseRequestLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/cancel-close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          message: data.error || 'Gagal membatalkan Close Request.',
        });
        return;
      }

      setStatusMsg({
        type: 'success',
        message: 'Close Request berhasil dibatalkan.',
      });
      notifyUpdate();
      fetchTaskDetails();
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal membatalkan Close Request.',
      });
    } finally {
      setIsCloseRequestLoading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={handleCloseWithReset}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className={styles.modalHeader}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '0.75rem' }}>
            <span className={styles.taskNumber}>{task?.taskNumber || 'Task Detail'}</span>
            <h3 className={styles.modalTitle} style={{ marginTop: '0.2rem' }}>
              {task?.title || 'Memuat...'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
            {task && (() => {
              const isDone = task.status === 'DONE' || task.status === 'CLOSED' || task.isLocked === true;
              const isEditBtnDisabled = isDone || !isOwnerOrAdmin;

              const editBtnTooltip = isDone
                ? 'Task yang telah selesai tidak dapat diedit atau dihapus.'
                : !isOwnerOrAdmin
                ? 'Anda tidak memiliki izin untuk mengubah atribut task ini.'
                : 'Edit Task';

              return (
                <button
                  type="button"
                  disabled={isEditBtnDisabled}
                  onClick={(e) => {
                    if (isEditBtnDisabled) {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isDone && !isOwnerOrAdmin) {
                        setStatusMsg({
                          type: 'error',
                          message: 'Anda tidak memiliki izin untuk mengubah atribut task ini.',
                        });
                      }
                      return;
                    }
                    onClose();
                    onEditRequest(task);
                  }}
                  className={`${styles.actionBtn} ${isEditBtnDisabled ? styles.lockedOrDoneBtn : ''}`}
                  style={{ cursor: isEditBtnDisabled ? 'not-allowed' : 'pointer' }}
                  title={editBtnTooltip}
                >
                  <Edit3 size={15} />
                </button>
              );
            })()}
            <button onClick={handleCloseWithReset} className={styles.closeBtn}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Top Banners Container */}
        <div className={styles.detailBannerSection}>
          {/* Task Completed Read-Only Banner */}
          {isTaskDone && (
            <div className={styles.lockedBanner}>
              <span className={`${styles.badge} ${styles.statusDone}`}>Done</span>
              <span>Task yang telah selesai tidak dapat diedit atau dihapus.</span>
            </div>
          )}

        {/* Status Alert Banner */}
        {statusMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              margin: '0.65rem 0',
              background: statusMsg.type === 'error' ? '#FEF2F2' : '#F0FDF4',
              border: statusMsg.type === 'error' ? '1px solid #FCA5A5' : '1px solid #BBF7D0',
              color: statusMsg.type === 'error' ? '#991B1B' : '#15803D',
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
              {statusMsg.type === 'error' ? (
                <ShieldAlert size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
              ) : (
                <CheckCircle size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
              )}
              <div style={{ lineHeight: '1.4' }}>
                {renderFormattedStatusMsg(statusMsg.message)}
              </div>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: statusMsg.type === 'error' ? '#991B1B' : '#15803D',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.7,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              title="Tutup notifikasi"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* ─── DONE REQUEST PANELS ───────────────────────────────────────────── */}

        {/* Done Request Approval Card - for Owner/Admin */}
        {showDoneApprovalCard && task && (
          <div
            style={{
              padding: '0.85rem',
              borderRadius: '10px',
              margin: '0.5rem 0',
              background: 'hsla(145, 80%, 45%, 0.1)',
              border: '1px solid hsla(145, 80%, 45%, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} style={{ color: 'hsl(145, 80%, 65%)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'hsl(145, 80%, 85%)' }}>
                  Done Request Pending (Permintaan Penyelesaian)
                </span>
              </div>
              <button
                onClick={handleCancelDone}
                disabled={isDoneRequestLoading}
                title="Batalkan Done Request"
                style={{
                  background: 'transparent',
                  border: '1px solid hsla(0,0%,100%,0.2)',
                  color: 'hsla(0,0%,100%,0.7)',
                  borderRadius: '4px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <Ban size={12} />
                Cancel Request
              </button>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'hsla(0,0%,100%,0.7)', marginBottom: '0.3rem' }}>
              <strong>Requested By:</strong> {task.doneRequestedBy?.name || 'Assignee'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'hsla(0,0%,100%,0.7)', marginBottom: '0.3rem' }}>
              <strong>Requested At:</strong> {formatDate(task.doneRequestedAt)}
            </div>
            {task.doneRequestNote && (
              <div style={{ fontSize: '0.8rem', color: 'hsla(0,0%,100%,0.7)', marginBottom: '0.5rem' }}>
                <strong>Completion Note:</strong> {task.doneRequestNote}
              </div>
            )}

            {showDoneRejectModal ? (
              <div style={{ marginTop: '0.6rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#fff', marginBottom: '0.3rem' }}>
                  Alasan Penolakan Done (Opsional):
                </label>
                <input
                  type="text"
                  value={doneRejectReasonText}
                  onChange={(e) => setDoneRejectReasonText(e.target.value)}
                  placeholder="Masukkan alasan penolakan..."
                  className={styles.input}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', marginBottom: '0.5rem', width: '100%' }}
                />
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={handleRejectDone}
                    disabled={isDoneRequestLoading}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'hsl(350, 90%, 55%)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Konfirmasi Tolak
                  </button>
                  <button
                    onClick={() => setShowDoneRejectModal(false)}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid hsla(0,0%,100%,0.2)',
                      background: 'transparent',
                      color: '#fff',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleApproveDone}
                  disabled={isDoneRequestLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'hsl(145, 80%, 45%)',
                    color: '#fff',
                    cursor: isDoneRequestLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    opacity: isDoneRequestLoading ? 0.6 : 1,
                  }}
                >
                  <CheckCircle size={14} />
                  Approve Done
                </button>
                <button
                  onClick={() => setShowDoneRejectModal(true)}
                  disabled={isDoneRequestLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'hsl(350, 90%, 55%)',
                    color: '#fff',
                    cursor: isDoneRequestLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    opacity: isDoneRequestLoading ? 0.6 : 1,
                  }}
                >
                  <XCircle size={14} />
                  Reject Request
                </button>
              </div>
            )}
          </div>
        )}

        {/* Done Request Button + Input - for Assignee */}
        {showRequestDoneButton && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              margin: '0.5rem 0',
              background: 'hsla(145, 80%, 45%, 0.1)',
              border: '1px solid hsla(145, 80%, 45%, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'hsla(145, 60%, 85%, 1)' }}>
                Pekerjaan telah selesai? Ajukan permintaan untuk mengubah status ke Done.
              </span>
              <button
                onClick={() => setShowDoneNoteInput(!showDoneNoteInput)}
                disabled={isDoneRequestLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'hsl(145, 80%, 40%)',
                  color: '#fff',
                  cursor: isDoneRequestLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  opacity: isDoneRequestLoading ? 0.6 : 1,
                }}
              >
                <CheckSquare size={14} />
                Request to Done
              </button>
            </div>

            {showDoneNoteInput && (
              <div style={{ marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px dashed hsla(145, 80%, 45%, 0.3)' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'hsla(0,0%,100%,0.8)', marginBottom: '0.3rem' }}>
                  Completion Note / Summary of Work (Opsional):
                </label>
                <input
                  type="text"
                  value={doneRequestNoteText}
                  onChange={(e) => setDoneRequestNoteText(e.target.value)}
                  placeholder="Rincian hasil pekerjaan & testing..."
                  className={styles.input}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', marginBottom: '0.5rem', width: '100%' }}
                />
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={handleRequestDone}
                    disabled={isDoneRequestLoading}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'hsl(145, 80%, 45%)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Kirim Request
                  </button>
                  <button
                    onClick={() => setShowDoneNoteInput(false)}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid hsla(0,0%,100%,0.2)',
                      background: 'transparent',
                      color: '#fff',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Done Badge View - for Assignee */}
        {showPendingDoneBadge && task && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              margin: '0.5rem 0',
              background: 'hsla(38, 95%, 55%, 0.1)',
              border: '1px solid hsla(38, 95%, 55%, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} style={{ color: 'hsl(38, 95%, 65%)' }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(38, 95%, 85%)' }}>
                  Badge: Waiting Owner Approval (Request to Done)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsla(0,0%,100%,0.7)', marginTop: '0.15rem' }}>
                  <strong>Requested By:</strong> {task.doneRequestedBy?.name || 'Assignee'} | <strong>Requested At:</strong> {formatDate(task.doneRequestedAt)}
                </div>
              </div>
            </div>
            <button
              onClick={handleCancelDone}
              disabled={isDoneRequestLoading}
              title="Batalkan Request"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid hsla(0,0%,100%,0.2)',
                background: 'transparent',
                color: 'hsla(0,0%,100%,0.8)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <Ban size={12} />
              Cancel Request
            </button>
          </div>
        )}

        {/* Done Rejected Info Banner */}
        {showDoneRejectedInfo && task && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              margin: '0.5rem 0',
              background: 'hsla(350, 90%, 55%, 0.1)',
              border: '1px solid hsla(350, 90%, 55%, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <XCircle size={16} style={{ color: 'hsl(350, 95%, 75%)' }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(350, 95%, 85%)' }}>
                Done Request Ditolak
              </div>
              <div style={{ fontSize: '0.72rem', color: 'hsla(0,0%,100%,0.5)', marginTop: '0.15rem' }}>
                {task.doneRejectReason
                  ? `Alasan: ${task.doneRejectReason}`
                  : 'Silakan perbaiki dan ajukan kembali jika diperlukan.'}
              </div>
            </div>
          </div>
        )}

        {/* ─── CLOSE REQUEST PANELS ──────────────────────────────────────────── */}

        {/* Close Request Approval Card - for Owner/Admin */}
        {showApprovalCard && task && (
          <div
            style={{
              padding: '0.85rem',
              borderRadius: '10px',
              margin: '0.5rem 0',
              background: 'hsla(38, 95%, 55%, 0.1)',
              border: '1px solid hsla(38, 95%, 55%, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} style={{ color: 'hsl(38, 95%, 65%)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'hsl(38, 95%, 85%)' }}>
                  Close Request Pending
                </span>
              </div>
              <button
                onClick={handleCancelClose}
                disabled={isCloseRequestLoading}
                title="Batalkan Close Request"
                style={{
                  background: 'transparent',
                  border: '1px solid hsla(0,0%,100%,0.2)',
                  color: 'hsla(0,0%,100%,0.7)',
                  borderRadius: '4px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <Ban size={12} />
                Cancel Request
              </button>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'hsla(0,0%,100%,0.7)', marginBottom: '0.3rem' }}>
              <strong>Requested By:</strong> {task.closeRequestedBy?.name || 'Unknown'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'hsla(0,0%,100%,0.7)', marginBottom: '0.3rem' }}>
              <strong>Tanggal:</strong> {formatDate(task.closeRequestedAt)}
            </div>
            {task.closeRequestReason && (
              <div style={{ fontSize: '0.8rem', color: 'hsla(0,0%,100%,0.7)', marginBottom: '0.5rem' }}>
                <strong>Alasan:</strong> {task.closeRequestReason}
              </div>
            )}

            {showRejectModal ? (
              <div style={{ marginTop: '0.6rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#fff', marginBottom: '0.3rem' }}>
                  Alasan Penolakan Close (Opsional):
                </label>
                <input
                  type="text"
                  value={rejectReasonText}
                  onChange={(e) => setRejectReasonText(e.target.value)}
                  placeholder="Masukkan alasan penolakan..."
                  className={styles.input}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', marginBottom: '0.5rem', width: '100%' }}
                />
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={handleRejectClose}
                    disabled={isCloseRequestLoading}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'hsl(350, 90%, 55%)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Konfirmasi Tolak
                  </button>
                  <button
                    onClick={() => setShowRejectModal(false)}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid hsla(0,0%,100%,0.2)',
                      background: 'transparent',
                      color: '#fff',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleApproveClose}
                  disabled={isCloseRequestLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'hsl(145, 80%, 45%)',
                    color: '#fff',
                    cursor: isCloseRequestLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    opacity: isCloseRequestLoading ? 0.6 : 1,
                  }}
                >
                  <CheckCircle size={14} />
                  Approve Close
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isCloseRequestLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'hsl(350, 90%, 55%)',
                    color: '#fff',
                    cursor: isCloseRequestLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    opacity: isCloseRequestLoading ? 0.6 : 1,
                  }}
                >
                  <XCircle size={14} />
                  Reject Request
                </button>
              </div>
            )}
          </div>
        )}

        {/* Close Request Button + Reason Input - for Assignee */}
        {showRequestCloseButton && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              margin: '0.5rem 0',
              background: 'var(--info-subtle)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                Pekerjaan selesai? Ajukan permintaan untuk menutup task.
              </span>
              <button
                onClick={() => setShowReasonInput(!showReasonInput)}
                disabled={isCloseRequestLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#fff',
                  cursor: isCloseRequestLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  opacity: isCloseRequestLoading ? 0.6 : 1,
                }}
              >
                <Send size={14} />
                Request to Close
              </button>
            </div>

            {showReasonInput && (
              <div style={{ marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(59, 130, 246, 0.3)' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--foreground)', marginBottom: '0.3rem' }}>
                  Alasan Permintaan Penutupan (Opsional):
                </label>
                <input
                  type="text"
                  value={requestReasonText}
                  onChange={(e) => setRequestReasonText(e.target.value)}
                  placeholder="Contoh: Seluruh fitur & pengujian telah selesai..."
                  className={styles.input}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', marginBottom: '0.5rem', width: '100%' }}
                />
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={handleRequestClose}
                    disabled={isCloseRequestLoading}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'var(--primary-hover)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Kirim Request
                  </button>
                  <button
                    onClick={() => setShowReasonInput(false)}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid hsla(0,0%,100%,0.2)',
                      background: 'transparent',
                      color: '#fff',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Close Badge View - for Assignee */}
        {showPendingBadge && task && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              margin: '0.5rem 0',
              background: 'hsla(38, 95%, 55%, 0.1)',
              border: '1px solid hsla(38, 95%, 55%, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} style={{ color: 'hsl(38, 95%, 65%)' }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(38, 95%, 85%)' }}>
                  Badge: Waiting Owner Approval (Request to Close)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsla(0,0%,100%,0.7)', marginTop: '0.15rem' }}>
                  <strong>Requested By:</strong> {task.closeRequestedBy?.name || 'Assignee'} | <strong>Requested At:</strong> {formatDate(task.closeRequestedAt)}
                </div>
              </div>
            </div>
            <button
              onClick={handleCancelClose}
              disabled={isCloseRequestLoading}
              title="Batalkan Request"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid hsla(0,0%,100%,0.2)',
                background: 'transparent',
                color: 'hsla(0,0%,100%,0.8)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <Ban size={12} />
              Cancel Request
            </button>
          </div>
        )}

        {/* Close Rejected Info Banner */}
        {showRejectedInfo && task && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              margin: '0.5rem 0',
              background: 'hsla(350, 90%, 55%, 0.1)',
              border: '1px solid hsla(350, 90%, 55%, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <XCircle size={16} style={{ color: 'hsl(350, 95%, 75%)' }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(350, 95%, 85%)' }}>
                Close Request Ditolak
              </div>
              <div style={{ fontSize: '0.72rem', color: 'hsla(0,0%,100%,0.5)', marginTop: '0.15rem' }}>
                {task.closeRejectReason
                  ? `Alasan: ${task.closeRejectReason}`
                  : 'Silakan perbaiki dan ajukan kembali jika diperlukan.'}
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Tab Navigation Sticky */}
        <div className={styles.detailStickyTabNav}>
          <button
            onClick={() => setActiveTab('info')}
            className={`${styles.tabItem} ${activeTab === 'info' ? styles.activeTabItem : ''}`}
          >
            Informasi Umum
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`${styles.tabItem} ${activeTab === 'checklist' ? styles.activeTabItem : ''}`}
          >
            Checklist ({task?.checklists?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`${styles.tabItem} ${activeTab === 'comments' ? styles.activeTabItem : ''}`}
          >
            Komentar ({task?.comments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`${styles.tabItem} ${activeTab === 'attachments' ? styles.activeTabItem : ''}`}
          >
            Lampiran ({task?.attachments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${styles.tabItem} ${activeTab === 'history' ? styles.activeTabItem : ''}`}
          >
            Riwayat ({task?.histories?.length || 0})
          </button>
        </div>

        {/* Content Body Scrollable Area */}
        <div className={styles.detailScrollBody}>
          {isLoading || !task ? (
            <div className={styles.loadingBox}>
              <InlineSpinner size={18} color="var(--primary)" />
              <span>Memuat detail task...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '300px' }}>
            {activeTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.infoGrid}>
                  {/* Status Workflow */}
                  <div className={styles.infoCard}>
                    <label className={styles.label}>Status Workflow</label>
                    <div className={styles.infoValue}>
                      {isAssignee || isOwnerOrAdmin ? (
                        <StatusDropdown
                          currentStatus={task.status}
                          onStatusChange={handleStatusChange}
                          disabled={isUpdatingStatus || task.status === 'CLOSED' || isTaskDone}
                          isOwnerOrAdmin={isOwnerOrAdmin}
                          isUpdatingStatus={isUpdatingStatus}
                        />
                      ) : (
                        <span className={`${styles.badge} ${getStatusBadgeClass(task.status)}`}>
                          {task.status} (Read Only)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Prioritas */}
                  <div className={styles.infoCard}>
                    <label className={styles.label}>Prioritas</label>
                    <div className={styles.infoValue}>
                      <span className={`${styles.badge} ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className={styles.infoCard}>
                    <label className={styles.label}>Assignee (Penanggung Jawab)</label>
                    <div className={styles.infoValue}>
                      <User size={15} className={styles.infoIcon} />
                      <span>{task.assignee?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* Reporter */}
                  <div className={styles.infoCard}>
                    <label className={styles.label}>Reporter (Dibuat Oleh)</label>
                    <div className={styles.infoValue}>
                      <UserCheck size={15} className={styles.infoIcon} />
                      <span>{task.createdBy?.name || '-'}</span>
                    </div>
                  </div>

                  {/* Kategori */}
                  <div className={styles.infoCard}>
                    <label className={styles.label}>Kategori</label>
                    <div className={styles.infoValue}>
                      <Tag size={15} className={styles.infoIcon} />
                      <span>{task.category?.name || '-'}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className={styles.infoCard}>
                    <label className={styles.label}>Tags</label>
                    <div className={styles.infoValue}>
                      <Hash size={15} className={styles.infoIcon} />
                      <span>{task.tags || '-'}</span>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className={styles.infoCard}>
                    <label className={styles.label}>Start Date</label>
                    <div className={styles.infoValue}>
                      <Calendar size={15} className={styles.infoIcon} />
                      <span>
                        {task.startDate
                          ? new Date(task.startDate).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className={styles.infoCard}>
                    <label className={styles.label}>Due Date (Deadline)</label>
                    <div className={styles.infoValue}>
                      <Calendar size={15} className={styles.infoIcon} />
                      <span>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Deskripsi Lengkap */}
                  <div className={`${styles.infoCard} ${styles.infoCardFull}`}>
                    <label className={styles.label}>Deskripsi Lengkap</label>
                    <div className={styles.descriptionBox}>
                      {task.description || 'Tidak ada deskripsi.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'checklist' && (
              <TaskChecklistSection
                taskId={task.id}
                checklists={task.checklists || []}
                onRefresh={() => {
                  notifyUpdate();
                  fetchTaskDetails();
                }}
                canUpdateProgress={canUpdateProgress}
              />
            )}

            {activeTab === 'comments' && (
              <TaskCommentSection
                taskId={task.id}
                comments={task.comments || []}
                currentUserId={currentUserId}
                onRefresh={() => {
                  notifyUpdate();
                  fetchTaskDetails();
                }}
                canUpdateProgress={canUpdateProgress}
              />
            )}

            {activeTab === 'attachments' && (
              <TaskAttachmentSection
                taskId={task.id}
                attachments={task.attachments || []}
                onRefresh={() => {
                  notifyUpdate();
                  fetchTaskDetails();
                }}
                canUpdateProgress={canUpdateProgress}
                currentUserId={currentUserId}
              />
            )}

            {activeTab === 'history' && (
              <TaskHistorySection histories={task.histories || []} />
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}