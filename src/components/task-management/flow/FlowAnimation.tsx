'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './FlowAnimation.module.css';

export interface StaticTask {
  id: string;
  title: string;
  category: string;
  assignee: string;
}

export interface ColumnData {
  name: string;
  baseCount: number;
  tasks: StaticTask[];
}

export const INITIAL_COLUMNS: ColumnData[] = [
  {
    name: 'Backlog',
    baseCount: 2,
    tasks: [
      {
        id: 'TSK-3210002',
        title: 'Update Tampilan tab kalender',
        category: 'Uncategorized',
        assignee: 'Tara Alsyah Icode',
      },
      {
        id: 'TSK-2760002',
        title: 'benerin AI',
        category: 'Uncategorized',
        assignee: 'Unassigned',
      },
    ],
  },
  {
    name: 'Open',
    baseCount: 25,
    tasks: [
      {
        id: 'TSK-3180002',
        title: 'Tinggi Navbar dan Logo samakan',
        category: 'Uncategorized',
        assignee: 'Tara Alsyah Icode',
      },
      {
        id: 'TSK-3150002',
        title: 'Update tampilan popup detail Task',
        category: 'Enhancement',
        assignee: 'Tara Alsyah Icode',
      },
    ],
  },
  {
    name: 'In Progress',
    baseCount: 3,
    tasks: [
      {
        id: 'TSK-1800002',
        title: 'Build SEO nya',
        category: 'Enhancement',
        assignee: 'Tara Alsyah Icode',
      },
      {
        id: 'TSK-480006',
        title: 'transaction Prisma sudah timeout',
        category: 'Bug',
        assignee: 'Tara Alsyah Icode',
      },
    ],
  },
  {
    name: 'Done',
    baseCount: 39,
    tasks: [
      {
        id: 'TSK-2910002',
        title: 'Buat Tracking level individu di kanban',
        category: 'Uncategorized',
        assignee: 'Unassigned',
      },
      {
        id: 'TSK-2430002',
        title: 'Update Kirim Email',
        category: 'Bug',
        assignee: 'Tara Alsyah Icode',
      },
    ],
  },
];

export const DEMO_NEW_TASK: StaticTask = {
  id: 'TSK-9990001',
  title: 'Implementasi fitur login Google',
  category: 'Enhancement',
  assignee: 'Tara Alsyah Icode',
};

export function FlowAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Modal, overlay, alert, counter refs
  const overlayRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLElement>(null);
  const btnNewRef = useRef<HTMLSpanElement>(null);
  const btnCreateRef = useRef<HTMLSpanElement>(null);

  // Form field refs inside modal
  const fTRef = useRef<HTMLDivElement>(null);
  const fPRef = useRef<HTMLDivElement>(null);
  const fDRef = useRef<HTMLDivElement>(null);
  const fSRef = useRef<HTMLDivElement>(null);
  const fRRef = useRef<HTMLDivElement>(null);
  const fKRef = useRef<HTMLDivElement>(null);
  const fARef = useRef<HTMLDivElement>(null);
  const fMRef = useRef<HTMLDivElement>(null);
  const fERef = useRef<HTMLDivElement>(null);
  const fGRef = useRef<HTMLDivElement>(null);

  // Column refs for counts, highlights, and card prepending
  const colElementRefs = useRef<(HTMLDivElement | null)[]>([]);
  const colCountRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const colBodyRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Arrow button refs on the created card
  const cardLeftArrowRef = useRef<HTMLElement>(null);
  const cardRightArrowRef = useRef<HTMLElement>(null);

  // Animation cancellation & scale tracking
  const isCancelledRef = useRef<boolean>(false);
  const isIntersectingRef = useRef<boolean>(true);
  const scaleRef = useRef<number>(1);
  const activeTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const currentColIndexRef = useRef<number>(-1);

  // Safe sleep promise with cancellation handling
  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isCancelledRef.current) {
        reject(new Error('Animation cancelled'));
        return;
      }
      const timer = setTimeout(() => {
        activeTimeoutsRef.current = activeTimeoutsRef.current.filter((t) => t !== timer);
        if (isCancelledRef.current) {
          reject(new Error('Animation cancelled'));
        } else {
          resolve();
        }
      }, ms);
      activeTimeoutsRef.current.push(timer);
    });
  }, []);

  // Step indicator callback (no-op as chips and caption are removed)
  const setStep = useCallback((_stepIndex?: number, _text?: string) => {}, []);

  // Calculate unscaled coordinates inside the 1000x600 stage
  const getCoordinates = useCallback((element: HTMLElement): [number, number] => {
    if (!stageRef.current) return [0, 0];
    const r = element.getBoundingClientRect();
    const s = stageRef.current.getBoundingClientRect();
    const currentScale = scaleRef.current || 1;
    return [
      (r.left - s.left + r.width / 2) / currentScale,
      (r.top - s.top + r.height / 2) / currentScale,
    ];
  }, []);

  // Smoothly move cursor to element
  const moveTo = useCallback(
    async (element: HTMLElement) => {
      if (isCancelledRef.current || !cursorRef.current) return;
      const [x, y] = getCoordinates(element);
      cursorRef.current.style.transform = `translate(${x - 4}px, ${y - 2}px)`;
      await sleep(1000);
    },
    [getCoordinates, sleep]
  );

  // Cursor tap animation with button press effect
  const tap = useCallback(
    async (targetBtn?: HTMLElement | null) => {
      if (isCancelledRef.current || !cursorRef.current) return;
      cursorRef.current.classList.add(styles.cursorTap);
      if (targetBtn) {
        targetBtn.classList.add(styles.btnPress);
      }
      await sleep(200);
      if (isCancelledRef.current || !cursorRef.current) return;
      cursorRef.current.classList.remove(styles.cursorTap);
      if (targetBtn) {
        targetBtn.classList.remove(styles.btnPress);
      }
      await sleep(200);
    },
    [sleep]
  );

  // Type text character by character into a field
  const typeText = useCallback(
    async (field: HTMLElement, text: string, counter?: HTMLElement | null) => {
      if (isCancelledRef.current) return;
      field.classList.add(styles.fieldOn);
      field.textContent = '';
      for (const char of text) {
        if (isCancelledRef.current) return;
        field.textContent += char;
        if (counter && field.textContent) {
          counter.textContent = `${field.textContent.length}/70`;
        }
        await sleep(42);
      }
      if (isCancelledRef.current) return;
      field.classList.remove(styles.fieldOn);
      field.classList.add(styles.fieldOk);
    },
    [sleep]
  );

  // Select dropdown option safely with DOM methods (no dangerouslySetInnerHTML)
  const selectOption = useCallback(
    async (
      field: HTMLElement,
      content: { dotColor?: string; text: string }
    ) => {
      if (isCancelledRef.current) return;
      await moveTo(field);
      await tap();
      if (isCancelledRef.current) return;
      field.classList.add(styles.fieldOn);
      await sleep(350);
      if (isCancelledRef.current) return;

      field.replaceChildren();
      if (content.dotColor) {
        const dot = document.createElement('span');
        dot.className = styles.dot;
        dot.style.background = content.dotColor;
        field.appendChild(dot);
      }
      field.appendChild(document.createTextNode(content.text));

      field.classList.remove(styles.fieldOn);
      field.classList.add(styles.fieldOk);
      await sleep(250);
    },
    [moveTo, tap, sleep]
  );

  // Update column counters
  const updateCounts = useCallback(() => {
    INITIAL_COLUMNS.forEach((col, idx) => {
      const countEl = colCountRefs.current[idx];
      if (countEl) {
        const extra = idx === currentColIndexRef.current ? 1 : 0;
        countEl.textContent = String(col.baseCount + extra);
      }
    });
  }, []);

  // Update arrow button visibility on created card
  const updateCardArrows = useCallback(() => {
    const ci = currentColIndexRef.current;
    if (cardLeftArrowRef.current) {
      cardLeftArrowRef.current.style.visibility = ci === 0 ? 'hidden' : 'visible';
    }
    if (cardRightArrowRef.current) {
      cardRightArrowRef.current.style.visibility = ci === 3 ? 'hidden' : 'visible';
    }
  }, []);

  // Update column border highlight
  const updateColumnHighlights = useCallback((activeIdx: number) => {
    colElementRefs.current.forEach((colEl, idx) => {
      if (colEl) {
        if (idx === activeIdx) {
          colEl.classList.add(styles.colHl);
        } else {
          colEl.classList.remove(styles.colHl);
        }
      }
    });
  }, []);

  // Move created card across columns using FLIP transition
  const moveCardTo = useCallback(
    async (targetColIdx: number) => {
      const card = cardRef.current;
      const targetBody = colBodyRefs.current[targetColIdx];
      if (!card || !targetBody || isCancelledRef.current) return;

      const rectBefore = card.getBoundingClientRect();
      targetBody.prepend(card);
      currentColIndexRef.current = targetColIdx;
      const rectAfter = card.getBoundingClientRect();

      const currentScale = scaleRef.current || 1;
      const deltaX = (rectBefore.left - rectAfter.left) / currentScale;
      const deltaY = (rectBefore.top - rectAfter.top) / currentScale;

      card.style.transition = 'none';
      card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      // Force layout reflow
      void card.offsetWidth;

      card.style.transition = 'transform 0.9s cubic-bezier(0.3, 0.7, 0.2, 1)';
      card.style.transform = '';

      updateCounts();
      updateCardArrows();
      updateColumnHighlights(targetColIdx);
      await sleep(1100);
    },
    [sleep, updateCounts, updateCardArrows, updateColumnHighlights]
  );

  // Reset form and board state for loop restart
  const resetState = useCallback(() => {
    const setField = (
      ref: React.RefObject<HTMLDivElement | null>,
      text: string,
      dotColor?: string,
      extraClass?: string
    ) => {
      const el = ref.current;
      if (!el) return;
      el.className = `${styles.field} ${extraClass ? styles[extraClass] || extraClass : ''}`;
      el.replaceChildren();
      if (dotColor) {
        const dot = document.createElement('span');
        dot.className = styles.dot;
        dot.style.background = dotColor;
        el.appendChild(dot);
      }
      el.appendChild(document.createTextNode(text));
    };

    setField(fTRef, 'Contoh: Implementasi fitur otentikasi dua faktor');
    setField(fPRef, 'Tanpa Proyek', '#94a3b8');
    setField(fDRef, 'Jelaskan kebutuhan, ruang lingkup, atau langkah pengerjaan task...', undefined, styles.editorField);
    setField(fSRef, 'Backlog', '#94a3b8', styles.fieldOk);
    setField(fRRef, 'Medium', '#f59e0b');
    setField(fKRef, 'Uncategorized', '#94a3b8');
    setField(fARef, 'Pilih Assignee');
    setField(fMRef, '📅 Pilih Tanggal & Jam Mulai');
    setField(fERef, '📅 Pilih Tanggal & Jam Selesai');
    setField(fGRef, 'Contoh: frontend, bugfix, api');

    if (counterRef.current) {
      counterRef.current.textContent = '0/70';
    }
    if (overlayRef.current) {
      overlayRef.current.classList.remove(styles.overlayShow);
    }
    if (alertRef.current) {
      alertRef.current.classList.remove(styles.alertShow);
    }

    // Hide animated card and reset
    if (cardRef.current) {
      cardRef.current.style.display = 'none';
      cardRef.current.className = `${styles.card} ${styles.cardNew}`;
      cardRef.current.style.transform = '';
    }

    currentColIndexRef.current = -1;
    updateCounts();
    colElementRefs.current.forEach((col) => col?.classList.remove(styles.colHl));

    if (cursorRef.current) {
      cursorRef.current.style.transform = 'translate(820px, 520px)';
    }

    setStep(-1, 'Memulai…');
  }, [setStep, updateCounts]);

  // Execute full animation sequence
  const runAnimation = useCallback(async () => {
    resetState();
    await sleep(1200);

    // Step 0: Click "+ Buat Task Baru" button
    setStep(0, '1. Klik tombol "+ Buat Task Baru" di Kanban Board');
    if (btnNewRef.current) {
      await moveTo(btnNewRef.current);
      await tap(btnNewRef.current);
    }

    // Show modal
    if (overlayRef.current) {
      overlayRef.current.classList.add(styles.overlayShow);
    }
    await sleep(700);

    // Step 0b: Fill in form fields
    setStep(0, '2. Popup form "Buat Task Baru" muncul, lalu form diisi');
    if (fTRef.current) {
      await moveTo(fTRef.current);
      await tap();
      await typeText(fTRef.current, 'Implementasi fitur login Google', counterRef.current);
    }

    if (fPRef.current) {
      await selectOption(fPRef.current, {
        dotColor: '#2563eb',
        text: 'Web Portofolio Tugas',
      });
    }

    if (fDRef.current) {
      await moveTo(fDRef.current);
      await tap();
      await typeText(
        fDRef.current,
        'Tambahkan login dengan akun Google di halaman masuk, termasuk tombol, redirect, dan penanganan error.'
      );
    }

    if (fRRef.current) {
      await selectOption(fRRef.current, {
        dotColor: '#f59e0b',
        text: 'Medium',
      });
    }

    if (fKRef.current) {
      await selectOption(fKRef.current, {
        dotColor: '#f59e0b',
        text: 'Enhancement',
      });
    }

    if (fARef.current) {
      await selectOption(fARef.current, {
        dotColor: '#2563eb',
        text: 'Tara Alsyah Icode',
      });
    }

    if (fMRef.current) {
      await selectOption(fMRef.current, {
        text: '📅 22 Okt 2026, 09:00',
      });
    }

    if (fERef.current) {
      await selectOption(fERef.current, {
        text: '📅 29 Okt 2026, 17:00',
      });
    }

    if (fGRef.current) {
      await moveTo(fGRef.current);
      await tap();
      await typeText(fGRef.current, 'auth, frontend');
    }

    // Step 0c: Submit form
    setStep(0, '3. Semua form terisi, klik tombol "Buat Task"');
    if (btnCreateRef.current) {
      await moveTo(btnCreateRef.current);
      await tap(btnCreateRef.current);
    }

    // Close modal & show alert
    if (overlayRef.current) {
      overlayRef.current.classList.remove(styles.overlayShow);
    }
    await sleep(500);

    if (alertRef.current) {
      alertRef.current.classList.add(styles.alertShow);
    }

    // Insert new card into Backlog (Column 0)
    const card = cardRef.current;
    const backlogBody = colBodyRefs.current[0];
    if (card && backlogBody) {
      card.style.display = 'block';
      card.className = `${styles.card} ${styles.cardNew}`;
      backlogBody.prepend(card);
      currentColIndexRef.current = 0;
      updateCounts();
      updateCardArrows();
      updateColumnHighlights(0);
    }

    setStep(1, 'Task berhasil dibuat dan masuk ke kolom Backlog');
    await sleep(2200);

    if (alertRef.current) {
      alertRef.current.classList.remove(styles.alertShow);
    }

    // Move across Kanban columns: Backlog (0) -> Open (1) -> In Progress (2) -> Done (3)
    const transitions: [number, string][] = [
      [1, 'Klik panah ›: Backlog → Open'],
      [2, 'Klik panah ›: Open → In Progress'],
      [3, 'Klik panah ›: In Progress → Closed (Done)'],
    ];

    for (const [targetIdx, label] of transitions) {
      setStep(targetIdx + 1, label);
      if (cardRightArrowRef.current) {
        await moveTo(cardRightArrowRef.current);
        await tap(cardRightArrowRef.current);
      }
      await moveCardTo(targetIdx);
      await sleep(700);
    }

    // Completion state
    if (cardRef.current) {
      cardRef.current.classList.remove(styles.cardNew);
      cardRef.current.classList.add(styles.cardFin);
    }

    await sleep(4000);
  }, [
    resetState,
    sleep,
    setStep,
    moveTo,
    tap,
    typeText,
    selectOption,
    updateCounts,
    updateCardArrows,
    updateColumnHighlights,
    moveCardTo,
  ]);

  // Reduced motion fallback state (instantly displays final Done state without animation)
  const applyReducedMotionState = useCallback(() => {
    resetState();
    const card = cardRef.current;
    const doneBody = colBodyRefs.current[3];
    if (card && doneBody) {
      card.style.display = 'block';
      card.className = `${styles.card} ${styles.cardFin}`;
      doneBody.prepend(card);
      currentColIndexRef.current = 3;
      updateCounts();
      updateCardArrows();
      updateColumnHighlights(3);
    }
  }, [resetState, updateCounts, updateCardArrows, updateColumnHighlights]);

  // Stage scaling function based on container width
  const fitStage = useCallback(() => {
    if (!wrapRef.current || !stageRef.current) return;
    const containerWidth = wrapRef.current.clientWidth;
    const nextScale = Math.min(1, containerWidth / 1000);
    scaleRef.current = nextScale;
    stageRef.current.style.transform = `scale(${nextScale})`;
    wrapRef.current.style.height = `${600 * nextScale}px`;
  }, []);

  // Main lifecycle effect: ResizeObserver, IntersectionObserver, and Animation Loop
  useEffect(() => {
    isCancelledRef.current = false;
    fitStage();

    // 1. ResizeObserver to keep stage scale accurate when container resizes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && wrapRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (!isCancelledRef.current) {
          fitStage();
        }
      });
      resizeObserver.observe(wrapRef.current);
    }

    // 2. IntersectionObserver to avoid CPU usage when out of view
    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            isIntersectingRef.current = entry.isIntersecting;
          }
        },
        { threshold: 0.05 }
      );
      intersectionObserver.observe(containerRef.current);
    }

    // 3. Check prefers-reduced-motion
    const mediaQuery =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    if (mediaQuery && mediaQuery.matches) {
      applyReducedMotionState();
      return () => {
        isCancelledRef.current = true;
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
      };
    }

    // 4. Run loop
    let isLoopRunning = true;
    (async () => {
      while (isLoopRunning && !isCancelledRef.current) {
        try {
          if (!isIntersectingRef.current) {
            await sleep(500);
            continue;
          }
          await runAnimation();
        } catch {
          if (isCancelledRef.current) break;
          await sleep(1000).catch(() => {});
        }
      }
    })();

    // 5. Cleanup on unmount or tab switch
    return () => {
      isLoopRunning = false;
      isCancelledRef.current = true;
      activeTimeoutsRef.current.forEach(clearTimeout);
      activeTimeoutsRef.current = [];
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
    };
  }, [fitStage, runAnimation, applyReducedMotionState, sleep]);

  return (
    <div ref={containerRef} className={styles.app}>
      {/* Scaled Canvas Container */}
      <div ref={wrapRef} className={styles.wrap}>
        <div ref={stageRef} className={styles.stage}>
          {/* Mockup Sidebar */}
          <div className={styles.side}>
            <div className={styles.logo}>▦ TaskTuntas</div>
            <div className={styles.proj}>
              <b>Web Portofolio T...</b>
              <small>🔒 Private OWNER</small>
            </div>
            <div className={styles.mi}>Overview</div>
            <div className={`${styles.mi} ${styles.miActive}`}>Task Management</div>
            <div className={styles.mi}>User Management</div>
            <div className={styles.mi}>Role Management</div>
            <div className={styles.mi}>Activity History</div>
            <div className={styles.mi}>Profile</div>
            <div className={styles.mi}>Account Linked</div>
            <div className={styles.mi}>Settings</div>
          </div>

          {/* Mockup Main View */}
          <div className={styles.main}>
            {/* Topbar */}
            <div className={styles.top}>
              <span>☰</span>
              <span>Dashboard</span>
              <div className={styles.user}>
                Tara Alsyah Icode
                <small>ADMIN</small>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className={styles.tabs}>
              <span>All Tasks</span>
              <span>My Tasks</span>
              <span className={styles.tabActive}>Kanban Board</span>
              <span>Calendar</span>
              <span>Timeline</span>
              <span>Flow</span>
              <span>Categories</span>
              <span>Reports</span>
            </div>

            {/* Kanban Board Panel */}
            <div className={styles.panel}>
              <div className={styles.ph}>
                <div>
                  <b>Kanban Board</b>
                  <small>Pindahkan alur kerja task secara fleksibel dari Backlog hingga Done.</small>
                </div>
                <span ref={btnNewRef} className={`${styles.btn} ${styles.btnPrimary}`}>
                  + Buat Task Baru
                </span>
              </div>

              {/* Kanban Columns */}
              <div className={styles.board}>
                {INITIAL_COLUMNS.map((col, colIdx) => (
                  <div
                    key={col.name}
                    ref={(el) => {
                      colElementRefs.current[colIdx] = el;
                    }}
                    className={styles.col}
                  >
                    <h3>
                      {col.name}{' '}
                      <span
                        ref={(el) => {
                          colCountRefs.current[colIdx] = el;
                        }}
                        className={styles.cnt}
                      >
                        {col.baseCount}
                      </span>
                    </h3>
                    <div
                      ref={(el) => {
                        colBodyRefs.current[colIdx] = el;
                      }}
                      className={styles.cardBody}
                    >
                      {col.tasks.map((task) => (
                        <div key={task.id} className={styles.card}>
                          <div className={styles.cardId}>{task.id}</div>
                          <div className={styles.cardPri}>MEDIUM</div>
                          <div className={styles.cardTitle}>{task.title}</div>
                          <div className={styles.cardCat}>🏷 {task.category}</div>
                          <div className={styles.cardAssignee}>
                            <span>👤 {task.assignee}</span>
                            <span className={styles.cardArrows}>
                              <b
                                className={styles.arrowBtn}
                                style={{
                                  visibility: colIdx === 0 ? 'hidden' : 'visible',
                                }}
                              >
                                ‹
                              </b>
                              <b
                                className={styles.arrowBtn}
                                style={{
                                  visibility: colIdx === 3 ? 'hidden' : 'visible',
                                }}
                              >
                                ›
                              </b>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pre-rendered Animated Card (controlled by cardRef) */}
          <div
            ref={cardRef}
            className={`${styles.card} ${styles.cardNew}`}
            style={{ display: 'none' }}
          >
            <div className={styles.cardId}>{DEMO_NEW_TASK.id}</div>
            <div className={styles.cardPri}>MEDIUM</div>
            <div className={styles.cardTitle}>{DEMO_NEW_TASK.title}</div>
            <div className={styles.cardCat}>🏷 {DEMO_NEW_TASK.category}</div>
            <div className={styles.cardAssignee}>
              <span>👤 {DEMO_NEW_TASK.assignee}</span>
              <span className={styles.cardArrows}>
                <b ref={cardLeftArrowRef} className={styles.arrowBtn}>
                  ‹
                </b>
                <b ref={cardRightArrowRef} className={styles.arrowBtn}>
                  ›
                </b>
              </span>
            </div>
          </div>

          {/* Overlay & "Buat Task Baru" Modal */}
          <div ref={overlayRef} className={styles.overlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <span>Buat Task Baru</span>
                <span style={{ color: 'var(--anim-mu)' }}>✕</span>
              </div>
              <div className={styles.modalBody}>
                <div>
                  <label className={styles.fieldLabel}>
                    Judul Task *<i ref={counterRef}>0/70</i>
                  </label>
                  <div ref={fTRef} className={styles.field}>
                    Contoh: Implementasi fitur otentikasi dua faktor
                  </div>
                </div>

                <div className={styles.row}>
                  <div>
                    <label className={styles.fieldLabel}>Project / Fitur</label>
                    <div ref={fPRef} className={styles.field}>
                      <span className={styles.dot} style={{ background: '#94a3b8' }} />
                      Tanpa Proyek
                    </div>
                  </div>
                  <div>
                    <label className={styles.fieldLabel}>Phase (Opsional)</label>
                    <div className={`${styles.field} ${styles.fieldOk}`}>
                      <span className={styles.dot} />
                      Tanpa Phase
                    </div>
                  </div>
                </div>

                <div>
                  <label className={styles.fieldLabel}>Deskripsi *</label>
                  <div className={styles.toolbar}>
                    <span>B</span>
                    <span>I</span>
                    <span>S</span>
                    <span>Normal Text ▾</span>
                    <span>• ≡</span>
                    <span>1. ≡</span>
                    <span>❝</span>
                    <span>&lt;/&gt;</span>
                    <span>Link</span>
                    <span>Gambar</span>
                  </div>
                  <div ref={fDRef} className={`${styles.field} ${styles.editorField}`}>
                    Jelaskan kebutuhan, ruang lingkup, atau langkah pengerjaan task...
                  </div>
                </div>

                <div className={styles.row}>
                  <div>
                    <label className={styles.fieldLabel}>Status Workflow</label>
                    <div ref={fSRef} className={`${styles.field} ${styles.fieldOk}`}>
                      <span className={styles.dot} style={{ background: '#94a3b8' }} />
                      Backlog
                    </div>
                  </div>
                  <div>
                    <label className={styles.fieldLabel}>Prioritas</label>
                    <div ref={fRRef} className={styles.field}>
                      <span className={styles.dot} style={{ background: '#f59e0b' }} />
                      Medium
                    </div>
                  </div>
                </div>

                <div className={styles.row}>
                  <div>
                    <label className={styles.fieldLabel}>Kategori</label>
                    <div ref={fKRef} className={styles.field}>
                      <span className={styles.dot} style={{ background: '#94a3b8' }} />
                      Uncategorized
                    </div>
                  </div>
                  <div>
                    <label className={styles.fieldLabel}>Penugasan (Assignee)</label>
                    <div ref={fARef} className={styles.field}>
                      Pilih Assignee
                    </div>
                  </div>
                </div>

                <div className={styles.row}>
                  <div ref={fMRef} className={styles.field}>
                    📅 Pilih Tanggal &amp; Jam Mulai
                  </div>
                  <div ref={fERef} className={styles.field}>
                    📅 Pilih Tanggal &amp; Jam Selesai
                  </div>
                </div>

                <div>
                  <label className={styles.fieldLabel}>Tags (Pisahkan dengan koma)</label>
                  <div ref={fGRef} className={styles.field}>
                    Contoh: frontend, bugfix, api
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <span className={styles.btn}>Batal</span>
                <span ref={btnCreateRef} className={`${styles.btn} ${styles.btnPrimary}`}>
                  Buat Task
                </span>
              </div>
            </div>
          </div>

          {/* Alert Notification */}
          <div ref={alertRef} className={styles.alert}>
            <span className={styles.alertIcon}>✔</span>
            Task berhasil dibuat!
          </div>

          {/* Animated Cursor */}
          <div ref={cursorRef} className={styles.cursor}>
            <svg viewBox="0 0 24 24">
              <path
                d="M4 2l16 9-7 2-3 7z"
                fill="#111111"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlowAnimation;
