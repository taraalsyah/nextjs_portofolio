'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  ExternalLink,
  Trash2,
  Check,
} from 'lucide-react';
import styles from './RichTextEditor.module.css';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  required?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Tulis deskripsi task...',
  disabled = false,
  minHeight = '130px',
  required = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active state feedback
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isStrikeActive, setIsStrikeActive] = useState(false);
  const [activeHeading, setActiveHeading] = useState<'NORMAL' | 'H1' | 'H2' | 'H3'>('NORMAL');
  const [isBulletActive, setIsBulletActive] = useState(false);
  const [isNumberedActive, setIsNumberedActive] = useState(false);
  const [isQuoteActive, setIsQuoteActive] = useState(false);
  const [isLinkActive, setIsLinkActive] = useState(false);

  // Link Popover state
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [linkIsExisting, setLinkIsExisting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Convert markdown format to HTML for visual editor display
  const formatInitialHtml = useCallback((text: string): string => {
    if (!text) return '';
    // If it already contains HTML tags like <b>, <strong>, <p>, <a>, <img>, keep as is
    if (/<[a-z][\s\S]*>/i.test(text)) {
      return text;
    }
    // Convert markdown markers to HTML so they render visually bold, italic, images, etc.
    let html = text
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:8px;margin:0.5rem 0;display:block;" />')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/__(.*?)__/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    html = html.replace(/\n/g, '<br>');
    return html;
  }, []);

  // Sync value to contentEditable div
  useEffect(() => {
    if (editorRef.current) {
      const htmlToSet = formatInitialHtml(value || '');
      const currentHtml = editorRef.current.innerHTML;
      if (document.activeElement !== editorRef.current && currentHtml !== htmlToSet) {
        editorRef.current.innerHTML = htmlToSet;
      }
    }
  }, [value, formatInitialHtml]);

  // Update active state indicator buttons
  const updateActiveStates = useCallback(() => {
    if (typeof document === 'undefined') return;
    try {
      setIsBoldActive(document.queryCommandState('bold'));
      setIsItalicActive(document.queryCommandState('italic'));
      setIsStrikeActive(document.queryCommandState('strikethrough'));
      setIsBulletActive(document.queryCommandState('insertUnorderedList'));
      setIsNumberedActive(document.queryCommandState('insertOrderedList'));
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let parentEl = selection.getRangeAt(0).commonAncestorContainer as HTMLElement | null;
        if (parentEl && parentEl.nodeType === Node.TEXT_NODE) {
          parentEl = parentEl.parentElement;
        }
        if (parentEl) {
          const h1 = parentEl.closest('h1');
          const h2 = parentEl.closest('h2');
          const h3 = parentEl.closest('h3');
          if (h1) setActiveHeading('H1');
          else if (h2) setActiveHeading('H2');
          else if (h3) setActiveHeading('H3');
          else setActiveHeading('NORMAL');

          setIsQuoteActive(Boolean(parentEl.closest('blockquote')));
          setIsLinkActive(Boolean(parentEl.closest('a')));
        }
      }
    } catch (e) {
      // Ignore fallback errors
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      onChange(currentHtml);
      updateActiveStates();
    }
  };

  // Toggle Bold
  const toggleBold = () => {
    if (disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand('bold', false);
    handleInput();
  };

  // Toggle Italic
  const toggleItalic = () => {
    if (disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand('italic', false);
    handleInput();
  };

  // Toggle Strikethrough
  const toggleStrike = () => {
    if (disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand('strikeThrough', false);
    handleInput();
  };

  // Toggle Headings (H1, H2, H3, NORMAL)
  const toggleHeading = (targetLevel: 'H1' | 'H2' | 'H3' | 'NORMAL') => {
    if (disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const tag = targetLevel === 'NORMAL' ? '<p>' : `<${targetLevel.toLowerCase()}>`;
    document.execCommand('formatBlock', false, tag);
    handleInput();
  };

  // Toggle Lists
  const toggleList = (listType: 'bullet' | 'numbered') => {
    if (disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const cmd = listType === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList';
    document.execCommand(cmd, false);
    handleInput();
  };

  // Toggle Quote
  const toggleQuote = () => {
    if (disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (isQuoteActive) {
      document.execCommand('formatBlock', false, '<p>');
    } else {
      document.execCommand('formatBlock', false, 'blockquote');
    }
    handleInput();
  };

  // Toggle Code
  const toggleCode = () => {
    if (disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const parentCode = (range.commonAncestorContainer as HTMLElement).parentElement?.closest('code');
      if (parentCode) {
        // Unwrap code
        const text = parentCode.textContent || '';
        const textNode = document.createTextNode(text);
        parentCode.parentNode?.replaceChild(textNode, parentCode);
      } else {
        const codeEl = document.createElement('code');
        codeEl.style.background = 'hsla(215, 20%, 65%, 0.15)';
        codeEl.style.padding = '0.2rem 0.4rem';
        codeEl.style.borderRadius = '4px';
        codeEl.style.fontFamily = 'monospace';
        codeEl.appendChild(range.extractContents());
        range.insertNode(codeEl);
      }
    }
    handleInput();
  };

  // Open Link Popover
  const openLinkPopover = () => {
    if (disabled) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    setSavedRange(range.cloneRange());

    let parentAnchor = (range.commonAncestorContainer as HTMLElement).parentElement?.closest('a');
    if (!parentAnchor && range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE) {
      parentAnchor = (range.commonAncestorContainer as HTMLElement).closest('a');
    }

    if (parentAnchor) {
      setLinkText(parentAnchor.textContent || '');
      setLinkUrl(parentAnchor.getAttribute('href') || '');
      setLinkIsExisting(true);
    } else {
      setLinkText(sel.toString() || '');
      setLinkUrl('');
      setLinkIsExisting(false);
    }

    setLinkError(null);
    setShowLinkPopover(true);
  };

  // Apply Link from Popover
  const handleApplyLink = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    const trimmedText = linkText.trim() || 'Link';
    let trimmedUrl = linkUrl.trim();

    if (!trimmedUrl) {
      setLinkError('URL wajib diisi.');
      return;
    }

    if (/^(javascript|data|vbscript):/i.test(trimmedUrl)) {
      setLinkError('URL mengandung protokol berbahaya yang tidak diizinkan.');
      return;
    }

    if (!/^https?:\/\//i.test(trimmedUrl) && !trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('#')) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    if (editorRef.current) {
      editorRef.current.focus();
    }

    if (savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    }

    // Create anchor element
    const a = document.createElement('a');
    a.href = trimmedUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = trimmedText;

    if (savedRange) {
      savedRange.deleteContents();
      savedRange.insertNode(a);
    } else {
      document.execCommand('createLink', false, trimmedUrl);
    }

    setShowLinkPopover(false);
    handleInput();
  };

  // Remove Link from Popover
  const handleRemoveLink = () => {
    if (!linkIsExisting) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
      let parentAnchor = (savedRange.commonAncestorContainer as HTMLElement).parentElement?.closest('a');
      if (parentAnchor) {
        const textNode = document.createTextNode(parentAnchor.textContent || '');
        parentAnchor.parentNode?.replaceChild(textNode, parentAnchor);
      }
    }
    setShowLinkPopover(false);
    handleInput();
  };

  // Open Link in New Tab
  const handleOpenLinkInNewTab = () => {
    if (!linkUrl) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/') && !url.startsWith('#')) {
      url = `https://${url}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Helper to insert <img> element at cursor position inside contentEditable
  const insertImageAtCursor = useCallback((src: string, altText: string = 'Gambar deskripsi') => {
    if (disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let range = sel.getRangeAt(0);

    // If cursor is outside editor, collapse to end of editor
    if (editorRef.current && !editorRef.current.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    const img = document.createElement('img');
    img.src = src;
    img.alt = altText;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '8px';
    img.style.margin = '0.5rem 0';
    img.style.display = 'block';
    img.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';

    range.deleteContents();
    range.insertNode(img);

    // Move cursor after the image
    const newRange = document.createRange();
    newRange.setStartAfter(img);
    newRange.setEndAfter(img);
    sel.removeAllRanges();
    sel.addRange(newRange);

    // Ensure a paragraph/break exists after image for typing
    if (!img.nextSibling) {
      const br = document.createElement('br');
      img.parentNode?.appendChild(br);
    }

    handleInput();
  }, [disabled]);

// Helper to compress & resize pasted images for fast transmission and saving
const optimizeAndConvertImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        resolve('');
        return;
      }
      const img = document.createElement('img');
      img.onload = () => {
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1400;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(mimeType, 0.82);
          resolve(compressedDataUrl);
        } else {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

  // Handle Copy-Paste of image files from clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        optimizeAndConvertImage(file).then((base64Src) => {
          if (base64Src) {
            insertImageAtCursor(base64Src, file.name || 'Pasted image');
          }
        });
        return;
      }
    }
  };

  // Open file selector when Toolbar Image button is clicked
  const handleImageButtonClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  // Handle selected image file from file picker
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type.startsWith('image/')) {
      optimizeAndConvertImage(file).then((base64Src) => {
        if (base64Src) {
          insertImageAtCursor(base64Src, file.name);
        }
      });
    }
    e.target.value = '';
  };

  // Keyboard Shortcuts (Cmd+B, Cmd+I, Cmd+K)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isCmdOrCtrl = e.metaKey || e.ctrlKey;
    if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      toggleBold();
    } else if (isCmdOrCtrl && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      toggleItalic();
    } else if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openLinkPopover();
    }
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.headerBar}>
        <div className={styles.toolbarGroup}>
          {/* Bold Button */}
          <button
            type="button"
            className={`${styles.toolBtn} ${isBoldActive ? styles.toolBtnActive : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleBold}
            disabled={disabled}
            title="Tebal / Bold (Ctrl+B / Cmd+B)"
          >
            <Bold size={15} />
          </button>

          {/* Italic Button */}
          <button
            type="button"
            className={`${styles.toolBtn} ${isItalicActive ? styles.toolBtnActive : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleItalic}
            disabled={disabled}
            title="Miring / Italic (Ctrl+I / Cmd+I)"
          >
            <Italic size={15} />
          </button>

          {/* Strikethrough Button */}
          <button
            type="button"
            className={`${styles.toolBtn} ${isStrikeActive ? styles.toolBtnActive : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleStrike}
            disabled={disabled}
            title="Coret / Strikethrough"
          >
            <Strikethrough size={15} />
          </button>

          <div className={styles.divider} />

          {/* Heading Selector Dropdown */}
          <select
            className={`${styles.headingDropdown} ${activeHeading !== 'NORMAL' ? styles.headingDropdownActive : ''}`}
            value={activeHeading}
            onChange={(e) => toggleHeading(e.target.value as any)}
            disabled={disabled}
            title="Pilih Ukuran Heading"
          >
            <option value="NORMAL">Normal Text</option>
            <option value="H1">Heading 1 (H1)</option>
            <option value="H2">Heading 2 (H2)</option>
            <option value="H3">Heading 3 (H3)</option>
          </select>

          <div className={styles.divider} />

          {/* Bullet List */}
          <button
            type="button"
            className={`${styles.toolBtn} ${isBulletActive ? styles.toolBtnActive : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleList('bullet')}
            disabled={disabled}
            title="Daftar Poin / Bullet List"
          >
            <List size={15} />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            className={`${styles.toolBtn} ${isNumberedActive ? styles.toolBtnActive : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleList('numbered')}
            disabled={disabled}
            title="Daftar Terurut / Numbered List"
          >
            <ListOrdered size={15} />
          </button>

          <div className={styles.divider} />

          {/* Quote Button */}
          <button
            type="button"
            className={`${styles.toolBtn} ${isQuoteActive ? styles.toolBtnActive : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleQuote}
            disabled={disabled}
            title="Kutipan / Quote"
          >
            <Quote size={15} />
          </button>

          {/* Code Button */}
          <button
            type="button"
            className={styles.toolBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleCode}
            disabled={disabled}
            title="Kode / Inline Code"
          >
            <Code size={15} />
          </button>

          {/* Link Button */}
          <button
            type="button"
            className={`${styles.toolBtn} ${isLinkActive ? styles.toolBtnActive : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={openLinkPopover}
            disabled={disabled}
            title="Tautan / Link (Ctrl+K / Cmd+K)"
          >
            <LinkIcon size={15} />
            <span>Link</span>
          </button>

          {/* Image Upload Button */}
          <button
            type="button"
            className={styles.toolBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleImageButtonClick}
            disabled={disabled}
            title="Sisipkan Gambar (atau Paste langsung dengan Ctrl+V / Cmd+V)"
          >
            <ImageIcon size={15} />
            <span>Gambar</span>
          </button>

          {/* Hidden File Input for Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Editor Body */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onSelect={updateActiveStates}
        onKeyUp={updateActiveStates}
        onClick={updateActiveStates}
        onMouseUp={updateActiveStates}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={styles.editableArea}
        style={{ minHeight }}
      />

      {/* Inline Link Editing Popover */}
      {showLinkPopover && (
        <div className={styles.linkPopoverOverlay} onClick={() => setShowLinkPopover(false)}>
          <div className={styles.linkPopoverCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.linkPopoverTitle}>
              <span>{linkIsExisting ? 'Edit Tautan / Link' : 'Tambah Tautan / Link'}</span>
              <button
                type="button"
                className={styles.closePopoverBtn}
                onClick={() => setShowLinkPopover(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div className={styles.popoverField}>
                <label className={styles.popoverLabel}>Teks Tautan (Label)</label>
                <input
                  type="text"
                  className={styles.popoverInput}
                  placeholder="Contoh: Dokumentasi API"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyLink(e);
                  }}
                />
              </div>

              <div className={styles.popoverField}>
                <label className={styles.popoverLabel}>URL Tautan</label>
                <input
                  type="text"
                  className={styles.popoverInput}
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                    setLinkError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyLink(e);
                  }}
                  autoFocus
                />
              </div>

              {linkError && <div className={styles.popoverError}>{linkError}</div>}

              <div className={styles.popoverActions}>
                {linkIsExisting && (
                  <>
                    <button
                      type="button"
                      className={styles.popoverBtnSecondary}
                      onClick={handleOpenLinkInNewTab}
                      title="Buka Link di Tab Baru"
                    >
                      <ExternalLink size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.popoverBtnDanger}
                      onClick={handleRemoveLink}
                      title="Hapus Link"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className={styles.popoverBtnSecondary}
                  onClick={() => setShowLinkPopover(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className={styles.popoverBtnPrimary}
                  onClick={handleApplyLink}
                >
                  <Check size={13} style={{ marginRight: '4px' }} />
                  Simpan Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
