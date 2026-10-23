'use client';

import React, { useState, useEffect } from 'react';
import { List, ChevronDown } from 'lucide-react';
import styles from './TableOfContents.module.css';

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: TocHeading[];
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ headings }) => {
  const [activeId, setActiveId] = useState<string>('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (headings.length === 0) return;

    // Set first heading as initial active
    setActiveId(headings[0].id);

    const headingElements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (headingElements.length === 0) return;

    // IntersectionObserver scrollspy
    const observer = new IntersectionObserver(
      (entries) => {
        // Collect visible elements
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by their position from top of viewport
          const topEntry = visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          )[0];
          if (topEntry?.target?.id) {
            setActiveId(topEntry.target.id);
          }
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: [0, 1],
      }
    );

    headingElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [headings]);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveId(id);
      setIsMobileOpen(false);
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className={styles.wrapper} aria-label="Daftar Isi Artikel">
      {/* Mobile Collapsible Button */}
      <button
        type="button"
        className={styles.mobileToggle}
        onClick={() => setIsMobileOpen((prev) => !prev)}
        aria-expanded={isMobileOpen}
        aria-controls="toc-list-nav"
      >
        <span className={styles.mobileToggleLabel}>
          <List size={16} /> Daftar Isi ({headings.length})
        </span>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isMobileOpen ? styles.chevronRotated : ''}`}
        />
      </button>

      {/* Desktop Header */}
      <div className={styles.header}>
        <List size={16} className={styles.headerIcon} />
        <h3 className={styles.headerTitle}>Daftar Isi</h3>
      </div>

      {/* List TOC */}
      <ul
        id="toc-list-nav"
        className={`${styles.list} ${isMobileOpen ? styles.listOpenMobile : ''}`}
      >
        {headings.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li
              key={item.id}
              className={`${styles.item} ${item.level === 3 ? styles.itemSub : ''} ${
                isActive ? styles.itemActive : ''
              }`}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => handleScrollTo(e, item.id)}
                className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
                aria-current={isActive ? 'true' : undefined}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default TableOfContents;
