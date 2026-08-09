'use client';

import React from 'react';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content: string;
}

/**
 * Pure React XSS-safe Markdown Renderer.
 * Parses Markdown structures into native React components without using dangerouslySetInnerHTML.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const elements = parseMarkdown(content);

  return <div className={styles.markdownBody}>{elements}</div>;
};

function parseInline(text: string): React.ReactNode[] {
  // Regex for code, bold, italic
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

    // Match bold **text** or __text__
    const boldMatch = /^(\*\*|__)(.*?)\1/.exec(remaining);
    if (boldMatch) {
      parts.push(<strong key={key++}>{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Match italic *text* or _text_
    const italicMatch = /^(\*|_)(.*?)\1/.exec(remaining);
    if (italicMatch) {
      parts.push(<em key={key++}>{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Next plain character/segment
    const nextSpecial = remaining.search(/[`*_]/);
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
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      index++;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index++;
      }
      if (index < lines.length) index++; // skip closing ```

      result.push(
        <pre key={elementKey++} className={styles.codeBlock}>
          {language && <div className={styles.codeLanguage}>{language}</div>}
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

    // 3. Headings #, ##, ###, ####
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line.trim());
    if (headingMatch) {
      const level = headingMatch[1].length;
      const titleText = headingMatch[2];
      const inlineContent = parseInline(titleText);

      if (level === 1) {
        result.push(<h2 key={elementKey++} className={styles.h2}>{inlineContent}</h2>);
      } else if (level === 2) {
        result.push(<h3 key={elementKey++} className={styles.h3}>{inlineContent}</h3>);
      } else if (level === 3) {
        result.push(<h4 key={elementKey++} className={styles.h4}>{inlineContent}</h4>);
      } else {
        result.push(<h5 key={elementKey++} className={styles.h5}>{inlineContent}</h5>);
      }
      index++;
      continue;
    }

    // 4. Tables (| col | col |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        tableLines.push(lines[index].trim());
        index++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
        const hasDivider = tableLines[1].includes('---');
        const bodyRows = (hasDivider ? tableLines.slice(2) : tableLines.slice(1)).map(row =>
          row.split('|').slice(1, -1).map(c => c.trim())
        );

        result.push(
          <div key={elementKey++} className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {headerRow.map((h, i) => (
                    <th key={i}>{parseInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{parseInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 5. Unordered List (- or *)
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

    // 6. Ordered List (1. 2. etc.)
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

    // 7. Empty line
    if (line.trim() === '') {
      index++;
      continue;
    }

    // 8. Normal Paragraph
    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== '' &&
      !lines[index].trim().startsWith('```') &&
      !lines[index].trim().startsWith('>') &&
      !/^(#{1,4})\s+/.test(lines[index].trim()) &&
      !/^[\*\-]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !(lines[index].trim().startsWith('|') && lines[index].trim().endsWith('|'))
    ) {
      paragraphLines.push(lines[index]);
      index++;
    }

    if (paragraphLines.length > 0) {
      result.push(
        <p key={elementKey++} className={styles.paragraph}>
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
