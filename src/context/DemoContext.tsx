'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface DemoProject {
  id: string;
  projectName: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  userRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  description?: string;
  createdAt: string;
}

export type TaskStatus = 'BACKLOG' | 'OPEN' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DemoTask {
  id: string;
  taskNumber: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  dueTime?: string;
  category?: string;
  tags?: string;
  createdAt: string;
}

export interface DemoChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
}

export interface DemoComment {
  id: string;
  taskId: string;
  userName: string;
  content: string;
  createdAt: string;
}

// Initial Seed Data matching the TaskTuntas dashboard screenshot
export const INITIAL_DEMO_USERS: DemoUser[] = [
  { id: 'user-1', name: 'Tara Alsyah Icode', email: 'tara@demo.local', role: 'ADMIN' },
  { id: 'user-2', name: 'Budi Santoso', email: 'budi@demo.local', role: 'MEMBER' },
  { id: 'user-3', name: 'Andi Wijaya', email: 'andi@demo.local', role: 'MEMBER' },
  { id: 'user-4', name: 'Siti Rahma', email: 'siti@demo.local', role: 'MEMBER' },
];

export const INITIAL_DEMO_PROJECTS: DemoProject[] = [
  {
    id: 'proj-1',
    projectName: 'Web Portofolio ...',
    visibility: 'PRIVATE',
    userRole: 'OWNER',
    description: 'Aplikasi Portofolio & Platform Management TaskTuntas',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    projectName: 'Mobile App Project',
    visibility: 'PRIVATE',
    userRole: 'OWNER',
    description: 'Capacitor Android & iOS Mobile Integration',
    createdAt: new Date().toISOString(),
  },
];

const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const getTodayStr = () => {
  return new Date().toISOString().split('T')[0];
};

const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const INITIAL_DEMO_TASKS: DemoTask[] = [
  {
    id: 'task-101',
    taskNumber: 'TSK-2070003',
    title: 'Buat explore demo',
    description: 'Implementasi fitur sandbox explore demo tanpa komunikasi database.',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    assigneeName: 'Tara Alsyah Icode',
    category: 'Enhancement',
    tags: 'Enhancement',
    dueDate: getTodayStr(),
    dueTime: '17:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-102',
    taskNumber: 'TSK-1800003',
    title: 'bikin aplikasi patungan',
    description: 'Modul pembayaran dan kalkulasi patungan bersama.',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    assigneeName: 'Tara Alsyah Icode',
    category: 'Enhancement',
    tags: 'Enhancement',
    dueDate: getTomorrowStr(),
    dueTime: '18:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-103',
    taskNumber: 'TSK-1800002',
    title: 'Build SEO nya',
    description: 'Optimasi SEO meta tag, sitemap XML dan Structured Data.',
    status: 'OPEN',
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    assigneeName: 'Tara Alsyah Icode',
    category: 'Enhancement',
    tags: 'Enhancement',
    dueDate: getTodayStr(),
    dueTime: '12:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-104',
    taskNumber: 'TSK-1110002',
    title: 'Tampilan Report Buatkan akses nya Ke redis saja',
    description: 'Optimasi caching report analytics menggunakan Redis cache.',
    status: 'OPEN',
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    assigneeName: 'Tara Alsyah Icode',
    category: 'Enhancement',
    tags: 'Enhancement',
    dueDate: getTomorrowStr(),
    dueTime: '15:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-105',
    taskNumber: 'TSK-1260002',
    title: 'Send email after pass deadline',
    description: 'Fitur Cronjob API pengiriman email notifikasi overdue task.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    assigneeName: 'Tara Alsyah Icode',
    category: 'Enhancement',
    tags: 'Enhancement',
    dueDate: getYesterdayStr(),
    dueTime: '09:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-106',
    taskNumber: 'TSK-480006',
    title: 'transaction Prisma sudah timeout',
    description: 'Penyesuaian maxWait dan timeout pada Prisma interactive transaction.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    assigneeName: 'Tara Alsyah Icode',
    category: 'Enhancement',
    tags: 'Enhancement',
    dueDate: getTodayStr(),
    dueTime: '14:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-107',
    taskNumber: 'TSK-1770002',
    title: 'buat linked akun ke gmail',
    description: 'Integrasi OAuth Google Account linking pada profile settings.',
    status: 'DONE',
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    assigneeName: 'Tara Alsyah Icode',
    category: 'Enhancement',
    tags: 'Enhancement',
    dueDate: getYesterdayStr(),
    dueTime: '10:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-108',
    taskNumber: 'TSK-1680003',
    title: 'Benerin notif lonceng',
    description: 'Perbaikan counter badge unread dan modal real-time notification.',
    status: 'DONE',
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    assigneeName: 'Tara Alsyah Icode',
    category: 'Enhancement',
    tags: 'Enhancement',
    dueDate: getYesterdayStr(),
    dueTime: '16:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-109',
    taskNumber: 'TSK-1710003',
    title: 'buat avatar profile',
    description: 'Upload dan kustomisasi avatar profil pengguna.',
    status: 'OPEN',
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    assigneeName: 'Tara Alsyah Icode',
    category: 'Enhancement',
    tags: 'Enhancement',
    dueDate: '2026-09-09',
    dueTime: '14:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-110',
    taskNumber: 'TSK-1710004',
    title: 'Enhance Database Query',
    description: 'Optimasi performa query database Prisma ORM.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    assigneeName: 'Tara Alsyah Icode',
    category: 'Enhancement',
    tags: 'Enhancement',
    dueDate: '2026-09-10',
    dueTime: '11:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-111',
    taskNumber: 'TSK-1740003',
    title: 'Buat tambahan di report',
    description: 'Penambahan grafik dan filter kustom pada laporan analytics.',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assigneeId: 'user-1',
    assigneeName: 'Tara Alsyah Icode',
    category: 'Enhancement',
    tags: 'Enhancement',
    dueDate: '2026-09-16',
    dueTime: '15:00',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_DEMO_CHECKLISTS: DemoChecklistItem[] = [
  { id: 'chk-1', taskId: 'task-101', title: 'Buat context state di memory', isCompleted: true },
  { id: 'chk-2', taskId: 'task-101', title: 'Samakan UI persis screenshot', isCompleted: true },
  { id: 'chk-3', taskId: 'task-105', title: 'Bearer auth token validation', isCompleted: true },
];

export const INITIAL_DEMO_COMMENTS: DemoComment[] = [
  {
    id: 'com-1',
    taskId: 'task-101',
    userName: 'Tara Alsyah Icode',
    content: 'Tampilan UI sandbox disesuaikan 100% dengan screenshot TaskTuntas.',
    createdAt: new Date().toISOString(),
  },
];

interface DemoContextType {
  projects: DemoProject[];
  tasks: DemoTask[];
  checklists: DemoChecklistItem[];
  comments: DemoComment[];
  users: DemoUser[];
  activeProjectId: string | 'ALL';
  setActiveProjectId: (id: string | 'ALL') => void;
  // Project CRUD
  createProject: (data: { projectName: string; description?: string }) => void;
  updateProject: (id: string, data: { projectName: string; description?: string }) => void;
  deleteProject: (id: string) => void;
  // Task CRUD
  createTask: (data: Omit<DemoTask, 'id' | 'taskNumber' | 'createdAt'>) => void;
  updateTask: (id: string, data: Partial<Omit<DemoTask, 'id' | 'taskNumber'>>) => void;
  deleteTask: (id: string) => void;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  // Checklist CRUD
  addChecklistItem: (taskId: string, title: string) => void;
  toggleChecklistItem: (checklistId: string) => void;
  deleteChecklistItem: (checklistId: string) => void;
  // Comment CRUD
  addComment: (taskId: string, userName: string, content: string) => void;
  deleteComment: (commentId: string) => void;
  // Controls
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<DemoProject[]>(INITIAL_DEMO_PROJECTS);
  const [tasks, setTasks] = useState<DemoTask[]>(INITIAL_DEMO_TASKS);
  const [checklists, setChecklists] = useState<DemoChecklistItem[]>(INITIAL_DEMO_CHECKLISTS);
  const [comments, setComments] = useState<DemoComment[]>(INITIAL_DEMO_COMMENTS);
  const [activeProjectId, setActiveProjectId] = useState<string | 'ALL'>('proj-1');

  const users = INITIAL_DEMO_USERS;

  const resetDemo = () => {
    setProjects(INITIAL_DEMO_PROJECTS);
    setTasks(INITIAL_DEMO_TASKS);
    setChecklists(INITIAL_DEMO_CHECKLISTS);
    setComments(INITIAL_DEMO_COMMENTS);
    setActiveProjectId('proj-1');
  };

  const createProject = (data: { projectName: string; description?: string }) => {
    const newProj: DemoProject = {
      id: `proj-${Date.now()}`,
      projectName: data.projectName,
      visibility: 'PRIVATE',
      userRole: 'OWNER',
      description: data.description,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
  };

  const updateProject = (id: string, data: { projectName: string; description?: string }) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, projectName: data.projectName, description: data.description } : p))
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
    if (activeProjectId === id) {
      setActiveProjectId('ALL');
    }
  };

  const createTask = (data: Omit<DemoTask, 'id' | 'taskNumber' | 'createdAt'>) => {
    const nextNum = tasks.length + 200;
    const newTask: DemoTask = {
      ...data,
      id: `task-${Date.now()}`,
      taskNumber: `TSK-${String(nextNum).padStart(6, '0')}`,
      category: data.category || 'Enhancement',
      tags: data.tags || 'Enhancement',
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const updateTask = (id: string, data: Partial<Omit<DemoTask, 'id' | 'taskNumber'>>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setChecklists((prev) => prev.filter((c) => c.taskId !== id));
    setComments((prev) => prev.filter((cm) => cm.taskId !== id));
  };

  const moveTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  const addChecklistItem = (taskId: string, title: string) => {
    const newItem: DemoChecklistItem = {
      id: `chk-${Date.now()}`,
      taskId,
      title,
      isCompleted: false,
    };
    setChecklists((prev) => [...prev, newItem]);
  };

  const toggleChecklistItem = (checklistId: string) => {
    setChecklists((prev) =>
      prev.map((item) => (item.id === checklistId ? { ...item, isCompleted: !item.isCompleted } : item))
    );
  };

  const deleteChecklistItem = (checklistId: string) => {
    setChecklists((prev) => prev.filter((item) => item.id !== checklistId));
  };

  const addComment = (taskId: string, userName: string, content: string) => {
    const newComment: DemoComment = {
      id: `com-${Date.now()}`,
      taskId,
      userName,
      content,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newComment]);
  };

  const deleteComment = (commentId: string) => {
    setComments((prev) => prev.filter((cm) => cm.id !== commentId));
  };

  return (
    <DemoContext.Provider
      value={{
        projects,
        tasks,
        checklists,
        comments,
        users,
        activeProjectId,
        setActiveProjectId,
        createProject,
        updateProject,
        deleteProject,
        createTask,
        updateTask,
        deleteTask,
        moveTaskStatus,
        addChecklistItem,
        toggleChecklistItem,
        deleteChecklistItem,
        addComment,
        deleteComment,
        resetDemo,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
