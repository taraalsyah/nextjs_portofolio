'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Send, 
  CheckCircle,
  BookOpen 
} from 'lucide-react';
import Navbar from "@/components/layout/Navbar";
import styles from "./blog.module.css";

interface BlogPost {
  id: string;
  title: string;
  snippet: string;
  category: string;
  tag: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
}

const CATEGORIES = ["All", "Technology", "UI/UX Design", "Development", "Productivity"];

const BLOG_POSTS: BlogPost[] = [
  {
    id: "nextjs-16-future",
    title: "The Future of Web Development: Next.js 16 and Beyond",
    snippet: "Deep dive into the latest updates of Next.js 16. Learn how Server Components, enhanced data caching, and native React 19 integration are reshaping modern web architectures.",
    category: "Technology",
    tag: "NEXTJS",
    date: "July 15, 2026",
    readTime: "6 min read",
    image: "/project2.png",
    featured: true,
  },
  {
    id: "mastering-glassmorphism",
    title: "Mastering Glassmorphism: Building Premium UI Layouts",
    snippet: "A comprehensive guide on styling modern glassmorphic layouts using pure CSS. We explore backdrop filters, subtle borders, shadows, and glowing accent highlights.",
    category: "UI/UX Design",
    tag: "CSS & DESIGN",
    date: "July 12, 2026",
    readTime: "5 min read",
    image: "/project3.png",
  },
  {
    id: "optimizing-nextjs-performance",
    title: "Optimizing Next.js for Maximum Core Web Vitals",
    snippet: "Performance matters. Explore actionable strategies to achieve 100% lighthouse scores using image optimization, dynamic imports, and streaming with Suspense boundaries.",
    category: "Development",
    tag: "PERFORMANCE",
    date: "June 28, 2026",
    readTime: "8 min read",
    image: "/project1.png",
  },
  {
    id: "why-framer-motion-is-essential",
    title: "Why We Chose Framer Motion for Our Interactive Dashboards",
    snippet: "Adding micro-interactions and smooth transitions turns simple MVPs into premium interfaces. Discover how to build fluid web applications using react animations.",
    category: "UI/UX Design",
    tag: "ANIMATIONS",
    date: "June 20, 2026",
    readTime: "4 min read",
    image: "/project2.png",
  },
  {
    id: "ai-driven-interface-design",
    title: "AI-Driven Interface Design: Hype or Reality?",
    snippet: "Analyzing the impact of LLMs and generative design tools on standard developer workflows. Will AI replace the UI/UX engineer, or enhance their capabilities?",
    category: "Technology",
    tag: "AI DEVELOPMENT",
    date: "June 14, 2026",
    readTime: "7 min read",
    image: "/project3.png",
  },
  {
    id: "staying-productive-remote-engineer",
    title: "How to Stay Productive as a Remote Web Engineer",
    snippet: "Practical techniques, mental strategies, and workspace setups to maximize your engineering efficiency while avoiding burnout working from home.",
    category: "Productivity",
    tag: "WORKSTYLE",
    date: "May 30, 2026",
    readTime: "5 min read",
    image: "/project1.png",
  }
];

export default function BlogLanding() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  // Filter posts based on search query and category
  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tag.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        activeCategory === 'All' || 
        post.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  // Separate featured post if it matches the current filter
  const featuredPost = useMemo(() => {
    // If filtering by search/category, check if the standard featured post matches
    const mainFeatured = BLOG_POSTS.find(p => p.featured);
    if (mainFeatured && filteredPosts.includes(mainFeatured)) {
      return mainFeatured;
    }
    return null;
  }, [filteredPosts]);

  // Regular grid posts (exclude the featured post if displayed as featured)
  const gridPosts = useMemo(() => {
    if (featuredPost) {
      return filteredPosts.filter(post => post.id !== featuredPost.id);
    }
    return filteredPosts;
  }, [filteredPosts, featuredPost]);

  return (
    <main style={{ minHeight: '100vh', width: '100%' }}>
      <Navbar />

      <div className={styles.blogContainer}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <Link href="/" className={styles.backHomeLink}>
            <ArrowLeft size={16} /> Back to Portfolio
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={styles.title}
          >
            The <span className="text-gradient">Insights</span> Blog
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={styles.subtitle}
          >
            Explore clean code guides, UI/UX trends, frontend architectural patterns, and engineering insights.
          </motion.p>

          {/* Search & Categories */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={styles.controls}
          >
            <div className={styles.searchWrapper}>
              <input 
                type="text" 
                placeholder="Search articles by title, keywords..." 
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className={styles.searchIcon} size={18} />
            </div>

            <div className={styles.categories}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.categoryChip} ${activeCategory === cat ? styles.activeChip : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Featured Post (only shown if not actively filtering or if featured post matches criteria) */}
        {featuredPost && (
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={styles.featuredSection}
          >
            <h2 className={styles.sectionTitle}>
              <BookOpen size={20} style={{ color: 'var(--primary)' }} /> Featured Article
            </h2>
            <Link href={`/blog/${featuredPost.id}`}>
              <div className={styles.featuredCard}>
                <div className={styles.featuredImageWrapper}>
                  <Image 
                    src={featuredPost.image} 
                    alt={featuredPost.title}
                    fill
                    className={styles.featuredImage}
                    sizes="(max-width: 900px) 100vw, 55vw"
                    priority
                  />
                </div>
                <div className={styles.featuredContent}>
                  <span className={styles.cardTag}>{featuredPost.tag}</span>
                  <div className={styles.postMeta}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={14} /> {featuredPost.date}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} /> {featuredPost.readTime}
                    </span>
                  </div>
                  <h3>{featuredPost.title}</h3>
                  <p className={styles.postSnippet}>{featuredPost.snippet}</p>
                  <span className={styles.readMoreBtn}>
                    Read Article <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          </motion.section>
        )}

        {/* Grid of Posts */}
        <section className={styles.gridSection}>
          <h2 className={styles.sectionTitle}>
            <BookOpen size={20} style={{ color: 'var(--secondary)' }} /> 
            {searchQuery || activeCategory !== 'All' ? 'Search Results' : 'Latest Articles'}
          </h2>
          
          <AnimatePresence mode="popLayout">
            {filteredPosts.length === 0 ? (
              <motion.div 
                key="no-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={styles.noResults}
              >
                No articles match your criteria. Try searching for something else!
              </motion.div>
            ) : (
              <motion.div 
                key="grid-container"
                className={styles.blogGrid}
                layout
              >
                {gridPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.1, 0.4) }}
                  >
                    <Link href={`/blog/${post.id}`} style={{ height: '100%', display: 'block' }}>
                      <div className={styles.blogCard}>
                        <div className={styles.cardImageWrapper}>
                          <Image 
                            src={post.image} 
                            alt={post.title}
                            fill
                            className={styles.cardImage}
                            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 30vw"
                          />
                        </div>
                        <div className={styles.cardContent}>
                          <span className={styles.cardTag}>{post.tag}</span>
                          <div className={styles.postMeta}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={13} /> {post.date}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={13} /> {post.readTime}
                            </span>
                          </div>
                          <h3>{post.title}</h3>
                          <p className={styles.postSnippet}>{post.snippet}</p>
                          <span className={styles.readMoreBtn} style={{ marginTop: 'auto' }}>
                            Read Article <ArrowRight size={15} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Newsletter Signup */}
        <section className={styles.newsletterSection}>
          <div className={styles.newsletterCard}>
            <h2 className={styles.newsletterTitle}>
              Get the Latest <span className="text-gradient">Insights</span>
            </h2>
            <p className={styles.newsletterDesc}>
              Subscribe to receive high-quality technical writeups, design walkthroughs, and performance optimization guides. No spam, unsubscribe anytime.
            </p>

            <AnimatePresence mode="wait">
              {!subscribed ? (
                <motion.form 
                  key="subscribe-form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={styles.newsletterForm} 
                  onSubmit={handleSubscribe}
                >
                  <input 
                    type="email" 
                    placeholder="Enter your email address" 
                    required 
                    className={styles.emailInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="submit" className={styles.submitBtn}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      Subscribe <Send size={15} />
                    </span>
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="subscribe-success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.successMsg}
                >
                  <CheckCircle size={20} /> Thank you! You've successfully subscribed to the newsletter.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}
