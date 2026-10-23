'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, RefreshCw, ChevronDown } from 'lucide-react';
import Navbar from "@/components/layout/Navbar";
import { BLOG_POSTS, type BlogPost } from "@/data/blogPosts";
import styles from "./blog.module.css";
import BlogCard from "@/components/blog/BlogCard";
import NewsletterBlock from "@/components/blog/NewsletterBlock";

function BlogListInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial states from URL query string
  const urlQuery = searchParams.get('q') || '';
  const urlCategory = searchParams.get('kategori') || 'All';
  const urlSort = searchParams.get('urut') || 'terbaru';

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [activeCategory, setActiveCategory] = useState(urlCategory);
  const [sortOrder, setSortOrder] = useState(urlSort);
  const [visibleCount, setVisibleCount] = useState(9);

  // Sync state if URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    setSearchQuery(urlQuery);
    setSearchInput(urlQuery);
    setActiveCategory(urlCategory);
    setSortOrder(urlSort);
  }, [urlQuery, urlCategory, urlSort]);

  // Synchronize state changes to URL query string
  const updateUrl = (q: string, cat: string, sort: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (cat && cat !== 'All') params.set('kategori', cat);
    if (sort && sort !== 'terbaru') params.set('urut', sort);

    const queryStr = params.toString();
    const destination = queryStr ? `${pathname}?${queryStr}` : pathname;
    router.replace(destination, { scroll: false });
  };

  // Build categories automatically from article data
  const categoryList = useMemo(() => {
    const counts: Record<string, number> = { All: BLOG_POSTS.length };
    BLOG_POSTS.forEach((post) => {
      counts[post.category] = (counts[post.category] || 0) + 1;
    });
    const unique = Array.from(new Set(BLOG_POSTS.map((p) => p.category)));
    return [
      { id: 'All', label: 'Semua Kategori', count: counts['All'] },
      ...unique.map((cat) => ({ id: cat, label: cat, count: counts[cat] || 0 })),
    ];
  }, []);

  // Check if any post has a "type" field
  const contentTypes = useMemo(() => {
    const types = Array.from(new Set(BLOG_POSTS.map((p) => (p as any).type).filter(Boolean)));
    return types;
  }, []);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchSearch =
        searchQuery === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tag.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = activeCategory === 'All' || post.category === activeCategory;

      return matchSearch && matchCategory;
    }).sort((a, b) => {
      if (sortOrder === 'terbaru') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortOrder === 'terlama') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortOrder === 'az') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [searchQuery, activeCategory, sortOrder]);

  const displayedPosts = filteredPosts.slice(0, visibleCount);

  // Search submission handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setVisibleCount(9);
    updateUrl(searchInput, activeCategory, sortOrder);
  };

  // Category change handler
  const handleCategorySelect = (catId: string) => {
    setActiveCategory(catId);
    setVisibleCount(9);
    updateUrl(searchQuery, catId, sortOrder);
  };

  // Sort change handler
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSortOrder(newSort);
    updateUrl(searchQuery, activeCategory, newSort);
  };

  // Reset filters handler
  const handleResetFilter = () => {
    setSearchQuery('');
    setSearchInput('');
    setActiveCategory('All');
    setSortOrder('terbaru');
    setVisibleCount(9);
    updateUrl('', 'All', 'terbaru');
  };

  return (
    <div className={styles.blogContainer}>
      {/* Hero Header */}
      <section className={styles.hero}>
        <Link href="/" className={styles.backHomeLink} aria-label="Kembali ke Portofolio">
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>
        <h1 className={styles.title}>Blog &amp; Wawasan</h1>
        <p className={styles.subtitle}>
          Kumpulan panduan alur kerja manajemen proyek, produktivitas tim, dan wawasan rekayasa sistem perangkat lunak modern.
        </p>
      </section>

      {/* === LAYOUT DESKTOP DUA KOLOM === */}
      <div className={styles.mainLayout}>
        {/* Kolom Kiri: Sidebar (± 30%, sticky) */}
        <aside className={styles.sidebar} aria-label="Navigasi dan Filter Sidebar">
          {/* a. Kotak pencarian "Cari artikel di sini..." dengan tombol "Cari" menyatu di sisi kanan */}
          <form onSubmit={handleSearchSubmit} className={styles.searchBox} role="search">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari artikel di sini..."
              aria-label="Cari artikel di sini"
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              Cari
            </button>
          </form>

          {/* b. Garis pemisah tipis */}
          <hr className={styles.sidebarDivider} aria-hidden="true" />

          {/* c. Judul "Kategori" lalu daftar kategori vertikal */}
          <div className={styles.categorySection}>
            <h3 className={styles.categoryTitle}>Kategori</h3>
            <div className={styles.categoryList}>
              {categoryList.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`${styles.categoryItem} ${isActive ? styles.categoryItemActive : ''}`}
                    aria-pressed={isActive}
                  >
                    <span>{cat.label}</span>
                    <span className={styles.categoryBadge}>{cat.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* b. Garis pemisah tipis */}
          <hr className={styles.sidebarDivider} aria-hidden="true" />

          {/* d. Blok ajakan newsletter */}
          <NewsletterBlock
            title="Dapatkan Kurasi Newsletter"
            description="Dapatkan kurasi newsletter mingguan terkait produktivitas, manajemen proyek, dan engineering terbaik langsung ke inbox Anda."
          />
        </aside>

        {/* Kolom Kanan: Konten (± 70%) */}
        <section className={styles.contentColumn} aria-label="Daftar Artikel Blog">
          {/* a. Baris filter di atas, rata kanan */}
          <div className={styles.filterRow}>
            <p className={styles.articleCount}>
              Menampilkan <strong>{filteredPosts.length}</strong> artikel
            </p>

            <div className={styles.filterControls}>
              {/* Dropdown "Tipe" hanya ditampilkan jika data punya field tipe konten */}
              {contentTypes.length > 0 && (
                <div className={styles.filterGroup}>
                  <label htmlFor="filterType" className={styles.filterLabel}>
                    Tipe:
                  </label>
                  <select id="filterType" className={styles.filterSelect}>
                    <option value="all">Pilih tipe konten</option>
                    {contentTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dropdown "Urutkan" (Urutkan artikel: Terbaru, Terlama, A–Z) */}
              <div className={styles.filterGroup}>
                <label htmlFor="sortOrderSelect" className={styles.filterLabel}>
                  Urutkan:
                </label>
                <select
                  id="sortOrderSelect"
                  value={sortOrder}
                  onChange={handleSortChange}
                  className={styles.filterSelect}
                  aria-label="Urutkan artikel"
                >
                  <option value="terbaru">Terbaru</option>
                  <option value="terlama">Terlama</option>
                  <option value="az">A–Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* b. Grid kartu artikel 3 kolom (desktop), 2 kolom (tablet), 1 kolom (mobile) */}
          {filteredPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <Search size={36} className={styles.emptyIcon} aria-hidden="true" />
              <h3 className={styles.emptyTitle}>Artikel Tidak Ditemukan</h3>
              <p className={styles.emptyDescription}>
                Tidak ada artikel yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo; pada kategori yang dipilih.
              </p>
              <button
                type="button"
                onClick={handleResetFilter}
                className={styles.resetButton}
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className={styles.articleGrid}>
              {displayedPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* e. Pagination atau tombol "Muat lebih banyak" jika data sudah banyak */}
          {filteredPosts.length > visibleCount && (
            <div className={styles.paginationWrapper}>
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className={styles.loadMoreBtn}
              >
                Muat Lebih Banyak ({filteredPosts.length - visibleCount} tersisa)
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function BlogLoadingFallback() {
  return (
    <div className={styles.loadingState}>
      <RefreshCw size={20} className="spin" aria-hidden="true" />
      <span>Memuat artikel blog...</span>
    </div>
  );
}

export default function BlogLanding() {
  return (
    <main style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--background)' }}>
      <Navbar />
      <Suspense fallback={<BlogLoadingFallback />}>
        <BlogListInner />
      </Suspense>
    </main>
  );
}
