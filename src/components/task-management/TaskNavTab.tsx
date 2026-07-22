'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ListTodo,
  UserCheck,
  Kanban,
  Calendar,
  FolderKanban,
  BarChart3,
} from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';

export function TaskNavTab() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || 'Staff';
  const isAdmin = role === 'Admin';

  const navItems = [
    ...(isAdmin
      ? [
          {
            name: 'All Tasks',
            href: '/dashboard/task-management',
            icon: ListTodo,
          },
        ]
      : []),
    {
      name: 'My Tasks',
      href: '/dashboard/task-management/my-tasks',
      icon: UserCheck,
    },
    {
      name: 'Kanban Board',
      href: '/dashboard/task-management/kanban',
      icon: Kanban,
    },
    {
      name: 'Calendar',
      href: '/dashboard/task-management/calendar',
      icon: Calendar,
    },
    ...(isAdmin
      ? [
          {
            name: 'Categories',
            href: '/dashboard/task-management/categories',
            icon: FolderKanban,
          },
          {
            name: 'Reports',
            href: '/dashboard/task-management/reports',
            icon: BarChart3,
          },
        ]
      : []),
  ];

  return (
    <nav className={styles.tabNav}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.tabItem} ${isActive ? styles.activeTabItem : ''}`}
          >
            <Icon size={16} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
