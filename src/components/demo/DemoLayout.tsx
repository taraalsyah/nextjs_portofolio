'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';
import {
  LayoutDashboard,
  ListTodo,
  Bot,
  Users,
  Shield,
  History,
  User as UserIcon,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  RotateCcw,
  Sparkles,
  UserPlus,
  FolderKanban,
  Lock,
  ChevronDown,
} from 'lucide-react';
import styles from './demo.module.css';

import { DemoJoinProjectModal } from './DemoJoinProjectModal';
import { DemoProjectModal } from './DemoProjectModal';
import { Check, Plus } from 'lucide-react';

interface DemoLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export const DemoLayoutInner: React.FC<DemoLayoutProps> = ({ children, pageTitle }) => {
  const pathname = usePathname();
  const { projects, activeProjectId, setActiveProjectId, resetDemo } = useDemo();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState<boolean>(false);

  const [joinModalOpen, setJoinModalOpen] = useState<boolean>(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const menuItems = [
    { name: 'Overview', href: '/explore-demo', icon: LayoutDashboard },
    { name: 'Task Management', href: '/explore-demo/tasks', icon: ListTodo },
    { name: 'Activity History', href: '/explore-demo/activity', icon: History },
    { name: 'Profile', href: '/explore-demo/profile', icon: UserIcon },
    { name: 'Account Linked', href: '/explore-demo/account-linked', icon: Link2 },
    { name: 'Settings', href: '/explore-demo/settings', icon: Settings },
  ];

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const activeProjectName = activeProjectId === 'ALL' ? 'Semua Project' : activeProject?.projectName || 'Web Portofolio ...';

  return (
    <div className={styles.layoutContainer}>
      {/* Mobile Drawer Overlay */}
      <div
        className={`${styles.drawerOverlay} ${isMobileOpen ? styles.overlayActive : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* ─── SIDEBAR MATCHING SCREENSHOT ─── */}
      <aside
        className={`${styles.sidebar} ${
          isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded
        } ${isMobileOpen ? styles.sidebarActive : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logoArea}>
            <div className={styles.logoIcon}>
              <img src="/logo.png" alt="TaskTuntas Logo" width={22} height={22} style={{ borderRadius: '4px', objectFit: 'contain' }} />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <span className={styles.logoText}>
                Task<span>tuntas</span>
              </span>
            )}
          </Link>
          {(!isCollapsed || isMobileOpen) && (
            <button
              onClick={toggleCollapse}
              className={styles.menuToggleBtn}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Project Switcher Box matching Screenshot */}
        {(!isCollapsed || isMobileOpen) && (
          <div className={styles.sidebarProjectSwitcher}>
            <div
              className={styles.projectTrigger}
              onClick={() => setProjectDropdownOpen((prev) => !prev)}
            >
              <div className={styles.projectIconBox}>
                <FolderKanban size={15} />
              </div>
              <div className={styles.projectInfo}>
                <div className={styles.projectNameRow}>
                  <span className={styles.projectNameText}>{activeProjectName}</span>
                </div>
                <div className={styles.projectMetaBadges}>
                  <span className={styles.visibilityTag}>
                    <Lock size={10} /> Private
                  </span>
                  <span className={styles.ownerBadge}>OWNER</span>
                </div>
              </div>
              <ChevronDown size={14} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
            </div>

            {projectDropdownOpen && (
              <div className={styles.projectDropdownMenu}>
                {projects.map((p) => {
                  const isSelected = activeProjectId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`${styles.projectDropdownItemBox} ${
                        isSelected ? styles.projectDropdownItemActiveBox : ''
                      }`}
                      onClick={() => {
                        setActiveProjectId(p.id);
                        setProjectDropdownOpen(false);
                      }}
                    >
                      <div>
                        <div
                          className={`${styles.projectItemNameTitle} ${
                            isSelected ? styles.projectItemActiveTitle : ''
                          }`}
                        >
                          {p.projectName}
                        </div>
                        <div
                          className={`${styles.projectItemSub} ${
                            isSelected ? styles.projectItemActiveSub : ''
                          }`}
                        >
                          Private • OWNER
                        </div>
                      </div>
                      {isSelected && <Check size={16} color="#2563eb" />}
                    </div>
                  );
                })}

                <div className={styles.dropdownDividerLine} />

                {/* Join Proyek via Code */}
                <button
                  className={styles.dropdownActionItem}
                  style={{ color: '#0284c7' }}
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    setJoinModalOpen(true);
                  }}
                >
                  <UserPlus size={16} color="#0284c7" />
                  <span>Join Proyek via Code</span>
                </button>

                {/* Buat Proyek Baru */}
                <button
                  className={styles.dropdownActionItem}
                  style={{ color: '#2563eb' }}
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    setCreateProjectModalOpen(true);
                  }}
                >
                  <Plus size={16} color="#2563eb" />
                  <span>Buat Proyek Baru</span>
                </button>

                {/* Pengaturan Proyek */}
                <button
                  className={styles.dropdownActionItem}
                  style={{ color: '#64748b' }}
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    alert('Pengaturan Proyek Sandbox Demo.');
                  }}
                >
                  <Settings size={16} color="#64748b" />
                  <span>Pengaturan Proyek</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sidebar Nav Links */}
        <nav className={styles.navSection}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <Icon className={styles.menuIcon} size={18} />
                {(!isCollapsed || isMobileOpen) && <span className={styles.menuLabel}>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          {(!isCollapsed || isMobileOpen) && (
            <div className={styles.demoSidebarCTA}>
              <button className={styles.resetBtnSidebar} onClick={resetDemo} title="Reset data ke kondisi awal">
                <RotateCcw size={14} /> Reset Demo
              </button>
            </div>
          )}

          <button onClick={toggleCollapse} className={styles.collapseBtn}>
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span>Sembunyikan</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT WRAPPER ─── */}
      <div
        className={`${styles.mainWrapper} ${
          isCollapsed ? styles.marginCollapsed : styles.marginExpanded
        }`}
      >
        {/* ─── TOPBAR HEADER MATCHING SCREENSHOT ─── */}
        <header className={styles.topbar}>
          <div className={styles.leftSection}>
            <button
              className={styles.topbarToggle}
              onClick={
                typeof window !== 'undefined' && window.innerWidth <= 768
                  ? () => setIsMobileOpen((prev) => !prev)
                  : toggleCollapse
              }
              aria-label="Toggle menu"
            >
              <Menu size={18} />
            </button>
            <div className={styles.topbarTitleGroup}>
              <h1 className={styles.topbarPageTitle}>{pageTitle}</h1>
              <div className={styles.demoModeBadge}>
                <Sparkles size={12} /> MODE DEMO
              </div>
            </div>
          </div>

          <div className={styles.rightSection}>
            <button className={styles.resetBtnHeader} onClick={resetDemo}>
              <RotateCcw size={13} /> Reset Demo
            </button>

            {/* Profile Dropdown matching Screenshot: TA Circle + Tara Alsyah Icode ADMIN */}
            <div className={styles.profileDropdownWrapper}>
              <button
                className={styles.profileTrigger}
                onClick={() => setUserDropdownOpen((prev) => !prev)}
              >
                <div className={styles.userAvatar}>TA</div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>Tara Alsyah Icode</span>
                  <span className={styles.userRole}>ADMIN</span>
                </div>
                <ChevronDown size={14} style={{ color: '#94a3b8' }} />
              </button>

              {userDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownItem} style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    <UserIcon size={14} /> Tara Alsyah (Demo)
                  </div>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      resetDemo();
                      setUserDropdownOpen(false);
                    }}
                  >
                    <RotateCcw size={14} /> Reset State Demo
                  </button>
                  <Link href="/register" className={styles.dropdownItem} style={{ color: '#2563eb' }}>
                    <UserPlus size={14} /> Buat Akun Gratis
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── CONTENT BODY ─── */}
        <main className={styles.contentContainer}>{children}</main>
      </div>

      {/* Demo Modals */}
      {joinModalOpen && (
        <DemoJoinProjectModal
          onClose={() => setJoinModalOpen(false)}
          onJoined={(code) => {
            alert(`Berhasil bergabung ke proyek demo menggunakan kode "${code}".`);
          }}
        />
      )}

      {createProjectModalOpen && (
        <DemoProjectModal
          projectToEdit={null}
          onClose={() => setCreateProjectModalOpen(false)}
        />
      )}
    </div>
  );
};

export const DemoLayout: React.FC<{ children: React.ReactNode; pageTitle: string }> = ({
  children,
  pageTitle,
}) => {
  return (
    <DemoLayoutInner pageTitle={pageTitle}>{children}</DemoLayoutInner>
  );
};

export default DemoLayout;
