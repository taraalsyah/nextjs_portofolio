'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import styles from '@/app/dashboard/layout.module.css';

interface AuthenticatedNavbarProps {
  pageTitle: string;
  session: any;
  onToggleMenu: () => void;
}

export const AuthenticatedNavbar: React.FC<AuthenticatedNavbarProps> = ({
  pageTitle,
  session,
  onToggleMenu,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className={styles.topbar}>
      <div className={styles.leftSection}>
        <button
          onClick={onToggleMenu}
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
            aria-expanded={isDropdownOpen}
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
              <Link
                href="/dashboard/profile"
                className={styles.dropdownItem}
                onClick={() => setIsDropdownOpen(false)}
              >
                <User size={14} />
                <span>Profil Saya</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className={styles.dropdownItem}
                onClick={() => setIsDropdownOpen(false)}
              >
                <Settings size={14} />
                <span>Pengaturan</span>
              </Link>
              <div className={styles.dropdownDivider} />

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
  );
};

export default AuthenticatedNavbar;
