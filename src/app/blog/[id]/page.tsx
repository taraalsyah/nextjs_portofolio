import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Tag } from 'lucide-react';
import Navbar from "@/components/layout/Navbar";
import { BLOG_POSTS } from "@/data/blogPosts";
import type { Metadata } from 'next';

import styles from "@/components/blog/BlogDetail.module.css";
import TableOfContents, { type TocHeading } from "@/components/blog/TableOfContents";
import DetailSearchForm from "@/components/blog/DetailSearchForm";
import PromoCard from "@/components/blog/PromoCard";
import NewsletterBlock from "@/components/blog/NewsletterBlock";
import BlogCard from "@/components/blog/BlogCard";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = BLOG_POSTS.find((p) => p.id === id);

  if (!post) {
    return {
      title: "Artikel Tidak Ditemukan",
    };
  }

  const title = post.seoTitle || post.title;
  const description = post.metaDescription || post.snippet;
  const ogTitle = post.ogTitle || post.title;
  const ogDescription = post.ogDescription || description;

  return {
    title,
    description,
    keywords: post.keywords,
    alternates: {
      canonical: `https://tasktuntas.com/blog/${post.id}`,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: `https://tasktuntas.com/blog/${post.id}`,
      type: "article",
      siteName: "TaskTuntas",
      images: [
        {
          url: `https://tasktuntas.com${post.image}`,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [`https://tasktuntas.com${post.image}`],
    },
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractHeadings(content: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      const text = trimmed.replace(/^##\s+/, '').replace(/\*\*/g, '').trim();
      if (text) {
        headings.push({ id: slugify(text), text, level: 2 });
      }
    } else if (trimmed.startsWith('### ')) {
      const text = trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '').trim();
      if (text) {
        headings.push({ id: slugify(text), text, level: 3 });
      }
    }
  }

  return headings;
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  const post = BLOG_POSTS.find((p) => p.id === id);

  if (!post) {
    notFound();
  }

  // Related posts from the same category
  const relatedPosts = BLOG_POSTS.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 2);

  const headings = extractHeadings(post.content);

  const authorName = (post as any).author?.name || 'TaskTuntas Team';
  const authorAvatar = (post as any).author?.avatar || '/favicon.png';

  return (
    <main style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--background)' }}>
      <Navbar />

      <div className={styles.pageContainer}>
        {/* Navigation back */}
        <Link href="/blog" className={styles.backLink} aria-label="Kembali ke daftar blog">
          <ArrowLeft size={16} /> Kembali ke Blog
        </Link>

        {/* HEADER ARTIKEL (LEBAR PENUH CONTAINER) */}
        <header className={styles.articleHeader}>
          <div className={styles.categoryBadge}>
            <Tag size={13} aria-hidden="true" />
            <span>{post.category}</span>
          </div>

          <h1 className={styles.articleTitle}>
            {post.title}
          </h1>

          <div className={styles.articleMetaRow}>
            {/* "Tayang <tanggal>" (label tebal, tanggal normal) */}
            <span className={styles.metaItem}>
              <strong className={styles.metaLabel}>Tayang</strong>
              <span className={styles.metaValue}>{post.date}</span>
            </span>

            <span className={styles.metaSeparator} aria-hidden="true">•</span>

            {/* "Ditulis oleh:" + avatar bulat + nama penulis berwarna link */}
            <span className={styles.authorMeta}>
              <strong className={styles.metaLabel}>Ditulis oleh:</strong>
              <Image
                src={authorAvatar}
                alt={authorName}
                width={22}
                height={22}
                className={styles.authorAvatar}
              />
              <Link href="/blog" className={styles.authorLink}>
                {authorName}
              </Link>
            </span>

            <span className={styles.metaSeparator} aria-hidden="true">•</span>

            <span className={styles.metaItem}>
              <span className={styles.metaValue}>{post.readTime}</span>
            </span>
          </div>
        </header>

        {/* Garis pemisah putus-putus (dotted) di bawah header */}
        <hr className={styles.dottedDivider} aria-hidden="true" />

        {/* BODY TIGA KOLOM (DESKTOP) */}
        <div className={styles.bodyLayout}>
          {/* Kolom Kiri: Sticky (± 20%) */}
          <aside className={styles.leftColumn} aria-label="Navigasi dan Pencarian Artikel">
            <DetailSearchForm />
            <TableOfContents headings={headings} />
          </aside>

          {/* Kolom Tengah: Konten (± 60%) */}
          <article className={styles.centerColumn}>
            {/* Gambar utama artikel (sudut membulat) */}
            <figure style={{ margin: 0 }}>
              <div className={styles.mainImageWrapper}>
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 720px"
                  className={styles.mainImage}
                />
              </div>
              {/* Caption kecil di tengah di bawahnya */}
              <figcaption className={styles.imageCaption}>
                Ilustrasi: {post.title}
              </figcaption>
            </figure>

            {/* Isi artikel dengan tipografi nyaman */}
            <div className={styles.contentBody}>
              {post.content.split('\n\n').map((paragraph, idx) => {
                const text = paragraph.trim();

                if (!text) return null;

                if (text.startsWith('## ')) {
                  const headingText = text.replace('## ', '').replace(/\*\*/g, '').trim();
                  const headingId = slugify(headingText);
                  return (
                    <h2 key={idx} id={headingId} className={styles.heading2}>
                      {headingText}
                    </h2>
                  );
                }

                if (text.startsWith('### ')) {
                  const headingText = text.replace('### ', '').replace(/\*\*/g, '').trim();
                  const headingId = slugify(headingText);
                  return (
                    <h3 key={idx} id={headingId} className={styles.heading3}>
                      {headingText}
                    </h3>
                  );
                }

                if (text.startsWith('> ')) {
                  return (
                    <blockquote key={idx} className={styles.blockquote}>
                      {text.replace('> ', '').replace(/"/g, '')}
                    </blockquote>
                  );
                }

                if (text.startsWith('---')) {
                  return <hr key={idx} className={styles.contentDivider} />;
                }

                if (text.startsWith('|')) {
                  const rows = text.split('\n').filter(row => !row.includes('---'));
                  const headers = rows[0]?.split('|').map(cell => cell.trim()).filter(Boolean) || [];
                  const bodyRows = rows.slice(1).map(row => row.split('|').map(cell => cell.trim()).filter(Boolean));

                  return (
                    <div key={idx} className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            {headers.map((h, i) => (
                              <th key={i} className={styles.tableTh}>
                                {h.replace(/\*\*/g, '')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bodyRows.map((r, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 1 ? styles.tableTrAlt : undefined}>
                              {r.map((c, cIdx) => (
                                <td key={cIdx} className={styles.tableTd}>
                                  {c.replace(/\*\*/g, '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                if (text.startsWith('* ') || text.startsWith('- ')) {
                  const items = text.split('\n').map(item => item.replace(/^[\*\-]\s*/, ''));
                  return (
                    <ul key={idx} className={styles.list}>
                      {items.map((it, i) => (
                        <li key={i} className={styles.listItem}>
                          {it.split('**').map((part, pIdx) => 
                            pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--foreground)' }}>{part}</strong> : part
                          )}
                        </li>
                      ))}
                    </ul>
                  );
                }

                return (
                  <p key={idx} className={styles.paragraph}>
                    {text.split('**').map((part, pIdx) => 
                      pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--foreground)' }}>{part}</strong> : part
                    )}
                  </p>
                );
              })}

              {/* Bottom Call to Action Card inside article */}
              <div className={styles.bottomCtaCard}>
                <h3 className={styles.bottomCtaTitle}>
                  Kelola Proyek &amp; Task Tim Anda dengan TaskTuntas
                </h3>
                <p className={styles.bottomCtaDesc}>
                  Coba platform TaskTuntas secara gratis. Kelola task, kanban board, workflow request-to-done, dan laporan produktivitas dalam satu platform terintegrasi.
                </p>
                <div>
                  <Link href="/register" className={styles.bottomCtaBtn}>
                    Mulai Gunakan TaskTuntas <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Related Articles Footer */}
            {relatedPosts.length > 0 && (
              <section className={styles.relatedSection} aria-label="Artikel Terkait">
                <h3 className={styles.relatedHeading}>
                  Artikel Terkait Lainnya
                </h3>
                <div className={styles.relatedGrid}>
                  {relatedPosts.map((rel) => (
                    <BlogCard key={rel.id} post={rel} />
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Kolom Kanan: Sticky (± 20%) */}
          <aside className={styles.rightColumn} aria-label="Informasi & Promosi Tambahan">
            <PromoCard />
            <NewsletterBlock
              title="Kurasi Newsletter"
              description="Dapatkan kurasi newsletter terkait produktivitas, manajemen proyek, dan engineering terbaik langsung ke inbox Anda."
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
