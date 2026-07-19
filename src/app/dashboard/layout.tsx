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
  ChevronDown
} from 'lucide-react';
import styles from './layout.module.css';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const MENU_ITEMS: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Sidebar states
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Profile dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
        <div className={styles.spinner} style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderRadius: '50%', borderTopColor: 'var(--secondary)', animation: 'spin 0.8s linear infinite' }} />
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If unauthenticated, redirect handles are verified by middleware but fallback gracefully
  if (status === 'unauthenticated') {
    router.push('/login?error=SessionExpired');
    return null;
  }

  return (
    <div className={styles.layoutContainer}>
      {/* ─── MOBILE BACKDROP OVERLAY ─── */}
      <div
        className={`${styles.drawerOverlay} ${isMobileOpen ? styles.overlayActive : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* ─── COLLAPSIBLE SIDEBAR ─── */}
      <aside
        className={`${styles.sidebar} ${
          isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded
        } ${isMobileOpen ? styles.sidebarActive : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoArea}>
            <LayoutDashboard className={styles.logoIcon} size={18} />
            {!isCollapsed && <span className={`${styles.logoText} text-gradient`}>Tara Alsyah</span>}
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

        {/* Sidebar Nav Items */}
        <nav className={styles.navSection}>
          {MENU_ITEMS.map((item) => {
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
          })}
        </nav>

        {/* Sidebar footer collapse trigger */}
        <div className={styles.sidebarFooter}>
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
        className={`${styles.mainWrapper} ${
          isCollapsed ? styles.marginCollapsed : styles.marginExpanded
        }`}
      >
        {/* Top Header */}
        <header className={styles.topbar}>
          <div className={styles.leftSection}>
            {/* Hamburger toggle on mobile, or expand toggle when sidebar collapsed on desktop */}
            <button
              onClick={
                window.innerWidth <= 768
                  ? () => setIsMobileOpen(!isMobileOpen)
                  : toggleCollapse
              }
              className={styles.menuToggle}
              aria-label="Toggle menu"
            >
              <Menu size={16} />
            </button>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
          </div>

          <div className={styles.rightSection}>
            {/* Profile Dropdown */}
            <div className={styles.profileDropdownWrapper} ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={styles.profileTrigger}
              >
                <div className={styles.userAvatar}>
                  {session?.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      className={styles.avatarImage} 
                    />
                  ) : (
                    getInitials(session?.user?.name)
                  )}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{session?.user?.name || 'User'}</span>
                  <span className={styles.userRole}>
                    {(session?.user as any)?.role || 'user'}
                  </span>
                </div>
                <ChevronDown size={14} style={{ opacity: 0.6 }} />
              </button>

              {/* Absolute Dropdown container */}
              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <Link href="/dashboard/profile" className={styles.dropdownItem}>
                    <User size={14} />
                    <span>Profil Saya</span>
                  </Link>
                  <Link href="/dashboard/settings" className={styles.dropdownItem}>
                    <Settings size={14} />
                    <span>Pengaturan</span>
                  </Link>
                  <div className={styles.dropdownDivider} />
                  
                  {/* Standard form POST logout trigger */}
                  <form action="/api/auth/logout" method="POST" style={{ width: '100%' }}>
                    <button
                      type="submit"
                      className={`${styles.dropdownItem} ${styles.logoutItem}`}
                    >
                      <LogOut size={14} />
                      <span>Keluar</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content body layout */}
        <main className={styles.contentContainer}>
          {children}
        </main>
      </div>
    </div>
  );
}
