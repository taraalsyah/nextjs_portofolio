'use client';

import React from 'react';
import styles from './RichTextRenderer.module.css';

interface RichTextRendererProps {
  content: string | null | undefined;
  className?: string;
}

/**
 * XSS-safe Rich Text / Markdown Renderer for Task Descriptions.
 * Renders formatted text into native semantic React components safely without dangerouslySetInnerHTML.
 * Fully backward-compatible with legacy plain-text descriptions.
 */
export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className }) => {
  if (!content || !content.trim()) {
    return <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Tidak ada deskripsi.</span>;
  }

  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  const elements = isHtml ? parseHtmlToReact(content) : parseMarkdown(content);

  return (
    <div className={`${styles.richTextContainer} ${className || ''}`.trim()}>
      {elements}
    </div>
  );
};

function parseHtmlToReact(htmlContent: string): React.ReactNode[] {
  if (typeof window === 'undefined') return [htmlContent];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    let keyCounter = 0;

    const domToReact = (node: Node): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        const children = Array.from(el.childNodes).map(domToReact);
        const key = keyCounter++;

        switch (tagName) {
          case 'b':
          case 'strong':
            return <strong key={key}>{children}</strong>;
          case 'i':
          case 'em':
            return <em key={key}>{children}</em>;
          case 'del':
          case 's':
          case 'strike':
            return <del key={key} className={styles.strikethrough}>{children}</del>;
          case 'a': {
            const rawUrl = el.getAttribute('href') || '';
            const safeUrl = sanitizeUrl(rawUrl);
            return (
              <a
                key={key}
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {children}
              </a>
            );
          }
          case 'code':
            return <code key={key} className={styles.inlineCode}>{children}</code>;
          case 'pre':
            return <pre key={key} className={styles.codeBlock}>{children}</pre>;
          case 'h1':
            return <h1 key={key} className={styles.h1}>{children}</h1>;
          case 'h2':
            return <h2 key={key} className={styles.h2}>{children}</h2>;
          case 'h3':
            return <h3 key={key} className={styles.h3}>{children}</h3>;
          case 'h4':
            return <h4 key={key} className={styles.h4}>{children}</h4>;
          case 'ul':
            return <ul key={key} className={styles.ul}>{children}</ul>;
          case 'ol':
            return <ol key={key} className={styles.ol}>{children}</ol>;
          case 'li':
            return <li key={key}>{children}</li>;
          case 'blockquote':
            return <blockquote key={key} className={styles.blockquote}>{children}</blockquote>;
          case 'br':
            return <br key={key} />;
          case 'p':
            return <p key={key}>{children}</p>;
          case 'div':
            return <div key={key}>{children}</div>;
          case 'span':
            return <span key={key}>{children}</span>;
          default:
            return <React.Fragment key={key}>{children}</React.Fragment>;
        }
      }
      return null;
    };

    return Array.from(doc.body.childNodes).map(domToReact);
  } catch (e) {
    return [htmlContent];
  }
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  // Reject dangerous pseudo-protocols like javascript:, data:, vbscript:
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '#';
  }
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/') && !trimmed.startsWith('#')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Match inline code `code`
    const codeMatch = /^`([^`]+)`/.exec(remaining);
    if (codeMatch) {
      parts.push(
        <code key={key++} className={styles.inlineCode}>
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Match links [label](url)
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)/.exec(remaining);
    if (linkMatch) {
      const label = linkMatch[1];
      const rawUrl = linkMatch[2];
      const safeUrl = sanitizeUrl(rawUrl);

      parts.push(
        <a
          key={key++}
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          {parseInline(label)}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Match strikethrough ~~text~~
    const strikeMatch = /^~~(.*?)~~/.exec(remaining);
    if (strikeMatch) {
      parts.push(
        <del key={key++} className={styles.strikethrough}>
          {parseInline(strikeMatch[1])}
        </del>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Match bold **text** or __text__
    const boldMatch = /^(\*\*|__)(.*?)\1/.exec(remaining);
    if (boldMatch) {
      parts.push(<strong key={key++}>{parseInline(boldMatch[2])}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Match italic *text* or _text_
    const italicMatch = /^(\*|_)(.*?)\1/.exec(remaining);
    if (italicMatch) {
      parts.push(<em key={key++}>{parseInline(italicMatch[2])}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Find next special marker
    const nextSpecial = remaining.search(/[`\[\*~_]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split(/\r?\n/);
  const result: React.ReactNode[] = [];
  let index = 0;
  let elementKey = 0;

  while (index < lines.length) {
    const line = lines[index];

    // 1. Code Block ```
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      index++;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index++;
      }
      if (index < lines.length) index++; // skip closing ```

      result.push(
        <pre key={elementKey++} className={styles.codeBlock}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // 2. Blockquote >
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].trim().replace(/^>\s*/, ''));
        index++;
      }
      result.push(
        <blockquote key={elementKey++} className={styles.blockquote}>
          {quoteLines.map((q, i) => (
            <p key={i}>{parseInline(q)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 3. Semantic Headings #, ##, ###, ####
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line.trim());
    if (headingMatch) {
      const level = headingMatch[1].length;
      const titleText = headingMatch[2];
      const inlineContent = parseInline(titleText);

      if (level === 1) {
        result.push(<h1 key={elementKey++} className={styles.h1}>{inlineContent}</h1>);
      } else if (level === 2) {
        result.push(<h2 key={elementKey++} className={styles.h2}>{inlineContent}</h2>);
      } else if (level === 3) {
        result.push(<h3 key={elementKey++} className={styles.h3}>{inlineContent}</h3>);
      } else {
        result.push(<h4 key={elementKey++} className={styles.h4}>{inlineContent}</h4>);
      }
      index++;
      continue;
    }

    // 4. Unordered List (- or *)
    const ulMatch = /^[\*\-]\s+(.+)$/.exec(line.trim());
    if (ulMatch) {
      const listItems: string[] = [];
      while (index < lines.length) {
        const itemMatch = /^[\*\-]\s+(.+)$/.exec(lines[index].trim());
        if (itemMatch) {
          listItems.push(itemMatch[1]);
          index++;
        } else {
          break;
        }
      }
      result.push(
        <ul key={elementKey++} className={styles.ul}>
          {listItems.map((item, i) => (
            <li key={i}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 5. Ordered List (1. 2. etc.)
    const olMatch = /^\d+\.\s+(.+)$/.exec(line.trim());
    if (olMatch) {
      const listItems: string[] = [];
      while (index < lines.length) {
        const itemMatch = /^\d+\.\s+(.+)$/.exec(lines[index].trim());
        if (itemMatch) {
          listItems.push(itemMatch[1]);
          index++;
        } else {
          break;
        }
      }
      result.push(
        <ol key={elementKey++} className={styles.ol}>
          {listItems.map((item, i) => (
            <li key={i}>{parseInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 6. Empty line
    if (line.trim() === '') {
      index++;
      continue;
    }

    // 7. Normal Paragraph
    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== '' &&
      !lines[index].trim().startsWith('```') &&
      !lines[index].trim().startsWith('>') &&
      !/^(#{1,4})\s+/.test(lines[index].trim()) &&
      !/^[\*\-]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index]);
      index++;
    }

    if (paragraphLines.length > 0) {
      result.push(
        <p key={elementKey++}>
          {paragraphLines.map((pLine, pIdx) => (
            <React.Fragment key={pIdx}>
              {pIdx > 0 && <br />}
              {parseInline(pLine)}
            </React.Fragment>
          ))}
        </p>
      );
    }
  }

  return result;
}
