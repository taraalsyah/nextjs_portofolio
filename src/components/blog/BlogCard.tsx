import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { BlogPost } from '@/data/blogPosts';
import styles from './BlogCard.module.css';

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  // Use existing post fields; fallback to editorial team if author object is not in data
  const authorName = (post as any).author?.name || 'TaskTuntas Team';
  const authorAvatar = (post as any).author?.avatar || '/favicon.png';

  return (
    <article className={styles.cardContainer}>
      <Link 
        href={`/blog/${post.id}`} 
        className={styles.cardLink}
        aria-label={`Baca artikel: ${post.title}`}
      >
        {/* 1. Thumbnail rasio tetap (16:9, sudut membulat, object-fit: cover) */}
        <div className={styles.thumbnailWrapper}>
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={styles.thumbnail}
          />
        </div>

        {/* 2. Label kategori (abu-abu kecil) */}
        <span className={styles.categoryLabel}>{post.category}</span>

        {/* 3. Judul artikel (tebal, maksimal 4 baris dengan line-clamp) */}
        <h3 className={styles.title}>{post.title}</h3>

        {/* 4. Baris "tanggal • X mins read" */}
        <div className={styles.metaRow}>
          <span>{post.date}</span>
          <span className={styles.dotSeparator} aria-hidden="true">•</span>
          <span>{post.readTime}</span>
        </div>

        {/* 5. Penulis (avatar bulat kecil + nama berwarna link) */}
        <div className={styles.authorRow}>
          <div className={styles.avatarWrapper}>
            <Image
              src={authorAvatar}
              alt={authorName}
              width={22}
              height={22}
              className={styles.avatar}
            />
          </div>
          <span className={styles.authorName}>{authorName}</span>
        </div>
      </Link>

      {/* 6. Garis bawah tipis sebagai pemisah */}
      <div className={styles.bottomDivider} aria-hidden="true" />
    </article>
  );
};

export default BlogCard;
