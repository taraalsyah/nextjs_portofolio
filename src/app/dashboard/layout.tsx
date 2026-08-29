'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  User,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  History,
  Users,
  Shield,
  ListTodo,
  FolderSync,
  Bot,
  Link2
} from 'lucide-react';
import styles from './layout.module.css';
import { FullPageLoader } from '@/components/ui/loading';
import { ProjectSwitcher } from '@/components/project/ProjectSwitcher';
import { ToastProvider } from '@/components/ui/Toast';
import { ProjectProvider, useProjectContext } from '@/context/ProjectContext';
import AuthenticatedNavbar from '@/components/layout/AuthenticatedNavbar';
import NotificationBell from '@/components/layout/NotificationBell';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const MENU_ITEMS: MenuItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Task Management', href: '/dashboard/task-management', icon: ListTodo },
  { name: 'AI Assistant', href: '/dashboard/ai-chat', icon: Bot },
  { name: 'User Management', href: '/dashboard/user-management', icon: Users },
  { name: 'Role Management', href: '/dashboard/role-management', icon: Shield },
  { name: 'Activity History', href: '/dashboard/activity-history', icon: History },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Account Linked', href: '/dashboard/account-linked', icon: Link2 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const { isSwitching, optimisticProject } = useProjectContext();

  // Sidebar states
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Load sidebar collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Sync state changes with localStorage
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Determine dynamic page title
  const activeMenu = MENU_ITEMS.find((item) => item.href === pathname);
  const pageTitle = activeMenu ? activeMenu.name : 'Dashboard';

  // Get initials for avatar
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Render client loading state while session is being fetched
  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?error=SessionExpired');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <FullPageLoader label="Memuat dashboard..." />;
  }

  // If unauthenticated, redirect handles are verified by useEffect but fallback gracefully
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className={`${styles.layoutContainer} ${isSwitching ? styles.isSwitchingCursor : ''}`}>
      {/* ─── MOBILE BACKDROP OVERLAY ─── */}
      <div
        className={`${styles.drawerOverlay} ${isMobileOpen ? styles.overlayActive : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* ─── COLLAPSIBLE SIDEBAR ─── */}
      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded
          } ${isMobileOpen ? styles.sidebarActive : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoArea}>
            <LayoutDashboard className={styles.logoIcon} size={18} />
            {!isCollapsed && <span className={styles.logoText}>TaskTuntas</span>}
          </div>
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className={`${styles.menuToggle} hidden-mobile`}
              aria-label="Collapse sidebar"
              style={{ padding: '0.25rem' }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* ─── PROJECT SWITCHER ─── */}
        {(!isCollapsed || isMobileOpen) && <ProjectSwitcher />}

        {/* Sidebar Nav Items */}
        <nav className={styles.navSection}>
          {(() => {
            const userRole = (session?.user as any)?.role || 'Staff';
            const userPermissions = (session?.user as any)?.permissions || [];

            const visibleItems = MENU_ITEMS.filter((item) => {
              if (userRole === 'Admin') return true;

              if (item.href === '/dashboard') {
                return userPermissions.includes('Dashboard.View');
              }
              if (item.href === '/dashboard/user-management') {
                return userPermissions.includes('User Management.View');
              }
              if (item.href === '/dashboard/role-management') {
                return userPermissions.includes('Role Management.View');
              }
              if (item.href === '/dashboard/activity-history') {
                return userPermissions.includes('Activity History.View');
              }
              if (item.href === '/dashboard/profile') {
                return userPermissions.includes('Profile.View');
              }
              if (item.href === '/dashboard/settings') {
                return userPermissions.includes('Settings.View');
              }
              return true;
            });

            return visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                >
                  <Icon className={styles.menuIcon} size={16} />
                  {(!isCollapsed || isMobileOpen) && (
                    <span className={styles.menuLabel}>{item.name}</span>
                  )}
                </Link>
              );
            });
          })()}
        </nav>

        {/* Sidebar footer: Notification bell & collapse trigger */}
        <div className={styles.sidebarFooter}>
          <NotificationBell isCollapsed={isCollapsed} isMobileOpen={isMobileOpen} />

          {isCollapsed ? (
            <button
              onClick={toggleCollapse}
              className={styles.collapseBtn}
              aria-label="Expand sidebar"
            >
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={toggleCollapse}
              className={styles.collapseBtn}
            >
              <ChevronLeft size={16} />
              <span>Sembunyikan</span>
            </button>
          )}
        </div>
      </aside>

      {/* ─── RIGHT HAND CONTENT CONTAINER ─── */}
      <div
        className={`${styles.mainWrapper} ${isCollapsed ? styles.marginCollapsed : styles.marginExpanded
          }`}
      >
        {/* Global Authenticated Navbar for all authenticated pages */}
        <AuthenticatedNavbar
          pageTitle={pageTitle}
          session={session}
          onToggleMenu={
            typeof window !== 'undefined' && window.innerWidth <= 768
              ? () => setIsMobileOpen(!isMobileOpen)
              : toggleCollapse
          }
        />

        {/* Content body layout */}
        <main className={styles.contentContainer}>
          {/* Glassmorphic switching loading overlay over main content area */}
          {isSwitching && (
            <div className={styles.switchingOverlay}>
              <div className={styles.switchingCard}>
                <div className={styles.switchingSpinner} />
                <div className={styles.switchingTitle}>Mengalihkan Proyek...</div>
                {optimisticProject && (
                  <div className={styles.switchingSubtext}>
                    <FolderSync size={14} style={{ color: '#60a5fa' }} /> Memuat workspace{' '}
                    <span className={styles.switchingProjectBadge}>
                      {optimisticProject.projectName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ProjectProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </ProjectProvider>
    </ToastProvider>
  );
}
