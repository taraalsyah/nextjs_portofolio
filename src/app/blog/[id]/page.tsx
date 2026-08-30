import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Tag, Share2, ArrowRight } from 'lucide-react';
import Navbar from "@/components/layout/Navbar";
import { BLOG_POSTS } from "@/data/blogPosts";
import styles from "../blog.module.css";
import type { Metadata } from 'next';

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

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  const post = BLOG_POSTS.find((p) => p.id === id);

  if (!post) {
    notFound();
  }

  // Related posts from the same category
  const relatedPosts = BLOG_POSTS.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 2);

  return (
    <main style={{ minHeight: '100vh', width: '100%', background: 'var(--background)' }}>
      <Navbar />

      <div className={styles.blogContainer} style={{ paddingTop: '7rem', paddingBottom: '5rem' }}>
        {/* Navigation back */}
        <Link href="/blog" className={styles.backHomeLink} style={{ marginBottom: '2rem', display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Kembali ke Artikel Blog
        </Link>

        <article style={{ maxWidth: '840px', margin: '0 auto' }}>
          {/* Article Header */}
          <header style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span className={styles.cardTag}>{post.tag}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--secondary-text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Tag size={13} /> {post.category}
              </span>
            </div>

            <h1 style={{ 
              fontSize: '2.4rem', 
              fontWeight: 800, 
              lineHeight: 1.25, 
              letterSpacing: '-0.02em', 
              color: 'var(--foreground)',
              marginBottom: '1.25rem' 
            }}>
              {post.title}
            </h1>

            <div className={styles.postMeta} style={{ fontSize: '0.9rem', color: 'var(--secondary-text)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={15} /> {post.date}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={15} /> {post.readTime}
              </span>
            </div>
          </header>

          {/* Featured Image */}
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '420px', 
            borderRadius: 'var(--radius-modal)', 
            overflow: 'hidden', 
            marginBottom: '3rem',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)'
          }}>
            <Image
              src={post.image}
              alt={post.title}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>

          {/* Article Content Body */}
          <div style={{
            fontSize: '1.05rem',
            lineHeight: 1.8,
            color: 'var(--foreground)',
            background: 'var(--surface)',
            padding: '2.5rem',
            borderRadius: 'var(--radius-modal)',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)'
          }}>
            {post.content.split('\n\n').map((paragraph, idx) => {
              const text = paragraph.trim();

              if (!text) return null;

              if (text.startsWith('## ')) {
                return (
                  <h2 key={idx} style={{ 
                    fontSize: '1.6rem', 
                    fontWeight: 700, 
                    marginTop: '2.5rem', 
                    marginBottom: '1rem',
                    color: 'var(--foreground)',
                    borderBottom: '2px solid var(--primary-soft)',
                    paddingBottom: '0.5rem'
                  }}>
                    {text.replace('## ', '')}
                  </h2>
                );
              }

              if (text.startsWith('### ')) {
                return (
                  <h3 key={idx} style={{ 
                    fontSize: '1.3rem', 
                    fontWeight: 700, 
                    marginTop: '2rem', 
                    marginBottom: '0.75rem',
                    color: 'var(--foreground)'
                  }}>
                    {text.replace('### ', '')}
                  </h3>
                );
              }

              if (text.startsWith('> ')) {
                return (
                  <blockquote key={idx} style={{
                    borderLeft: '4px solid var(--primary)',
                    paddingLeft: '1.25rem',
                    margin: '1.5rem 0',
                    fontStyle: 'italic',
                    color: 'var(--secondary-text)',
                    background: 'var(--primary-soft)',
                    padding: '1rem 1.25rem',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                  }}>
                    {text.replace('> ', '').replace(/"/g, '')}
                  </blockquote>
                );
              }

              if (text.startsWith('---')) {
                return <hr key={idx} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />;
              }

              if (text.startsWith('|')) {
                const rows = text.split('\n').filter(row => !row.includes('---'));
                const headers = rows[0]?.split('|').map(cell => cell.trim()).filter(Boolean) || [];
                const bodyRows = rows.slice(1).map(row => row.split('|').map(cell => cell.trim()).filter(Boolean));

                return (
                  <div key={idx} style={{ overflowX: 'auto', margin: '1.5rem 0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <thead>
                        <tr style={{ background: 'var(--primary-soft)', borderBottom: '2px solid var(--border)' }}>
                          {headers.map((h, i) => (
                            <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.92rem' }}>
                              {h.replace(/\*\*/g, '')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bodyRows.map((r, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: '1px solid var(--border)', background: rIdx % 2 === 1 ? 'var(--background)' : 'var(--surface)' }}>
                            {r.map((c, cIdx) => (
                              <td key={cIdx} style={{ padding: '0.75rem 1rem', fontSize: '0.92rem' }}>
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
                  <ul key={idx} style={{ margin: '1rem 0 1.5rem 1.5rem', listStyleType: 'disc' }}>
                    {items.map((it, i) => (
                      <li key={i} style={{ marginBottom: '0.4rem' }}>
                        {it.split('**').map((part, pIdx) => 
                          pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--foreground)' }}>{part}</strong> : part
                        )}
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p key={idx} style={{ marginBottom: '1.4rem' }}>
                  {text.split('**').map((part, pIdx) => 
                    pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--foreground)' }}>{part}</strong> : part
                  )}
                </p>
              );
            })}

            {/* Bottom Call to Action Card inside article */}
            <div style={{
              marginTop: '3.5rem',
              padding: '2rem',
              borderRadius: 'var(--radius-modal)',
              background: 'linear-gradient(135deg, var(--primary-soft) 0%, #DBEAFE 100%)',
              border: '1px solid var(--primary-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                Kelola Proyek & Task Tim Anda dengan TaskTuntas
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#1E3A8A', margin: 0 }}>
                Coba platform TaskTuntas secara gratis. Kelola task, kanban board, workflow request-to-done, dan laporan produktivitas dalam satu platform terintegrasi.
              </p>
              <div>
                <Link 
                  href="/register" 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    background: 'var(--primary)', 
                    color: '#fff', 
                    padding: '0.7rem 1.4rem', 
                    borderRadius: 'var(--radius-md)', 
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                >
                  Mulai Gunakan TaskTuntas <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Related Articles Footer */}
          {relatedPosts.length > 0 && (
            <div style={{ marginTop: '4rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--foreground)' }}>
                Artikel Terkait Lainnya
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {relatedPosts.map(rel => (
                  <Link key={rel.id} href={`/blog/${rel.id}`} style={{ textDecoration: 'none' }}>
                    <div className={styles.blogCard} style={{ background: 'var(--surface)' }}>
                      <div className={styles.cardImageWrapper}>
                        <Image src={rel.image} alt={rel.title} fill className={styles.cardImage} sizes="400px" />
                      </div>
                      <div className={styles.cardContent}>
                        <span className={styles.cardTag}>{rel.tag}</span>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--foreground)' }}>{rel.title}</h4>
                        <p className={styles.postSnippet}>{rel.snippet}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
