'use client';

import React, { useEffect, useRef, useCallback, useId } from 'react';
import styles from './ListFlowAnimation.module.css';

export interface FlowNodeData {
  t: string;
  x: number;
  y: number;
  w: number;
  h: number;
  from: 'tProses' | 'tKep' | 'tMulai';
  c: 'n1' | 'n2' | 'n3' | 'n4';
  el?: HTMLDivElement;
}

export interface FlowEdgeData {
  d: string;
  m: string;
  col: string;
  dash?: number;
  f: [number, number];
  t: [number, number];
  l?: [string, number, number];
}


export const NODES_DATA: FlowNodeData[] = [
  { t: 'Sprint Planning', x: 308, y: 246, w: 98, h: 45, from: 'tProses', c: 'n1' },
  { t: 'Active Development', x: 434, y: 246, w: 104, h: 45, from: 'tProses', c: 'n2' },
  { t: 'QA & Code Review', x: 565, y: 239, w: 98, h: 58, from: 'tKep', c: 'n3' },
  { t: 'Production Release', x: 691, y: 246, w: 104, h: 45, from: 'tMulai', c: 'n4' },
];

export const EDGES_DATA: FlowEdgeData[] = [
  { d: 'M406 268H434', m: 'mb', col: '#60a5fa', f: [406, 268], t: [434, 268] },
  { d: 'M538 268H565', m: 'mo', col: '#fb923c', f: [538, 268], t: [565, 268] },
  { d: 'M663 268H691', m: 'mg', col: '#4ade80', f: [663, 268], t: [691, 268], l: ['Pass', 677, 257] },
  { d: 'M614 239V225H486V246', m: 'mr', col: '#f87171', dash: 1, f: [614, 239], t: [486, 246], l: ['Fix Bug', 550, 225] },
];

export function ListFlowAnimation() {
  const uniqueId = useId().replace(/:/g, '');

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const frameHeaderRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  // Toolbar & shape tile refs
  const btnGroupRef = useRef<HTMLElement>(null);
  const btnSaveRef = useRef<HTMLSpanElement>(null);
  const tileMulaiRef = useRef<HTMLDivElement>(null);
  const tileProsesRef = useRef<HTMLDivElement>(null);
  const tileKepRef = useRef<HTMLDivElement>(null);

  // Dynamically created elements tracking
  const madeElementsRef = useRef<HTMLElement[]>([]);
  const madePathsRef = useRef<SVGPathElement[]>([]);

  // Animation cancellation & scale tracking
  const isCancelledRef = useRef<boolean>(false);
  const isIntersectingRef = useRef<boolean>(true);
  const scaleRef = useRef<number>(1);
  const activeTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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


  // Calculate unscaled coordinates inside the 1000x480 stage
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

  // Smoothly move cursor to absolute stage coordinates
  const goXY = useCallback(
    async (x: number, y: number, waitMs = 1000) => {
      if (isCancelledRef.current || !cursorRef.current) return;
      cursorRef.current.style.transform = `translate(${x - 4}px, ${y - 2}px)`;
      await sleep(waitMs);
    },
    [sleep]
  );

  // Move cursor to an element's center
  const goToElement = useCallback(
    async (element: HTMLElement) => {
      const [x, y] = getCoordinates(element);
      await goXY(x, y);
    },
    [getCoordinates, goXY]
  );

  // Cursor tap animation with button press effect
  const tap = useCallback(
    async (targetBtn?: HTMLElement | null) => {
      if (isCancelledRef.current || !cursorRef.current) return;
      cursorRef.current.classList.add(styles.curTap);
      if (targetBtn) {
        targetBtn.classList.add(styles.btnPress);
      }
      await sleep(200);
      if (isCancelledRef.current || !cursorRef.current) return;
      cursorRef.current.classList.remove(styles.curTap);
      if (targetBtn) {
        targetBtn.classList.remove(styles.btnPress);
      }
      await sleep(200);
    },
    [sleep]
  );

  // Type text character by character into an element
  const typeText = useCallback(
    async (element: HTMLElement, text: string) => {
      if (isCancelledRef.current) return;
      element.textContent = '';
      for (const char of text) {
        if (isCancelledRef.current) return;
        element.textContent += char;
        await sleep(38);
      }
    },
    [sleep]
  );

  // Add small representation in minimap
  const addMini = useCallback((x: number, y: number, w: number, h: number, bg?: string) => {
    if (!minimapRef.current) return;
    const d = document.createElement('div');
    d.style.left = `${(x - 290) * 0.17 + 6}px`;
    d.style.top = `${(y - 170) * 0.17 + 6}px`;
    d.style.width = `${w * 0.17}px`;
    d.style.height = `${h * 0.17}px`;
    d.style.opacity = '0';
    if (bg) {
      d.style.background = bg;
    }
    minimapRef.current.appendChild(d);
    madeElementsRef.current.push(d);
    requestAnimationFrame(() => {
      d.style.opacity = '1';
    });
  }, []);

  // Reset dynamic nodes, edges, labels, frame, and alert
  const resetState = useCallback(() => {
    // Remove dynamically created elements
    madeElementsRef.current.forEach((el) => el.remove());
    madeElementsRef.current = [];

    // Remove dynamically created SVG paths
    madePathsRef.current.forEach((path) => path.remove());
    madePathsRef.current = [];

    // Reset frame group
    if (frameRef.current) {
      frameRef.current.classList.remove(styles.frameShow);
    }
    if (frameHeaderRef.current) {
      frameHeaderRef.current.textContent = '';
    }

    // Reset alert
    if (alertRef.current) {
      alertRef.current.classList.remove(styles.alertShow);
    }

    // Reset cursor position
    if (cursorRef.current) {
      cursorRef.current.style.transform = 'translate(880px, 430px)';
    }
  }, []);

  // Stage scaling function based on container width (1000x480)
  const fitStage = useCallback(() => {
    if (!wrapRef.current || !stageRef.current) return;
    const containerWidth = wrapRef.current.clientWidth;
    const nextScale = Math.min(1, containerWidth / 1000);
    scaleRef.current = nextScale;
    stageRef.current.style.transform = `scale(${nextScale})`;
    wrapRef.current.style.height = `${480 * nextScale}px`;
  }, []);

  // Add a flow node from tile to canvas
  const addNode = useCallback(
    async (node: FlowNodeData) => {
      let tileEl: HTMLElement | null = null;
      if (node.from === 'tProses') tileEl = tileProsesRef.current;
      else if (node.from === 'tKep') tileEl = tileKepRef.current;
      else if (node.from === 'tMulai') tileEl = tileMulaiRef.current;

      if (!tileEl || !stageRef.current) return;

      await goToElement(tileEl);
      await tap(tileEl);

      const [cx, cy] = getCoordinates(tileEl);
      const el = document.createElement('div');
      el.className = `${styles.node} ${styles[node.c]}`;
      el.style.left = `${cx - node.w / 2}px`;
      el.style.top = `${cy - node.h / 2}px`;
      el.style.width = `${node.w}px`;
      el.style.height = `${node.h}px`;
      el.style.transition = 'none';

      if (node.c === 'n3') {
        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.setAttribute('viewBox', '0 0 98 58');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '49,1 97,29 49,57 1,29');
        polygon.setAttribute('fill', '#f3e8ff');
        polygon.setAttribute('stroke', '#a855f7');
        polygon.setAttribute('stroke-width', '2');
        svgEl.appendChild(polygon);
        el.appendChild(svgEl);
      }

      const labelSpan = document.createElement('span');
      labelSpan.className = 't';
      el.appendChild(labelSpan);

      stageRef.current.appendChild(el);
      madeElementsRef.current.push(el);
      void el.offsetWidth;

      el.style.transition = '';
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;
      el.style.transform = 'scale(1)';
      node.el = el;

      await goXY(node.x + node.w / 2, node.y + node.h / 2);
      await tap();
      addMini(node.x, node.y, node.w, node.h);
    },
    [goToElement, tap, getCoordinates, goXY, addMini]
  );

  // Add an edge arrow between nodes
  const addEdge = useCallback(
    async (edge: FlowEdgeData) => {
      if (!svgRef.current || !stageRef.current) return;

      await goXY(...edge.f);
      if (cursorRef.current) cursorRef.current.classList.add(styles.curTap);
      await sleep(200);

      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', edge.d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', edge.col);
      p.setAttribute('stroke-width', '2');
      p.setAttribute('marker-end', `url(#${uniqueId}-${edge.m})`);
      p.setAttribute('pathLength', '1');

      if (edge.dash) {
        p.setAttribute('stroke-dasharray', '5 4');
        p.style.opacity = '0';
        p.style.transition = 'opacity 0.9s ease';
      } else {
        p.style.strokeDasharray = '1';
        p.style.strokeDashoffset = '1';
        p.style.transition = 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0.1, 0.2, 1)';
      }

      svgRef.current.appendChild(p);
      madePathsRef.current.push(p);
      void p.getBoundingClientRect();

      if (edge.dash) {
        p.style.opacity = '1';
      } else {
        p.style.strokeDashoffset = '0';
      }

      await goXY(...edge.t, 950);
      if (cursorRef.current) cursorRef.current.classList.remove(styles.curTap);
      await sleep(150);

      if (edge.l) {
        const lab = document.createElement('div');
        lab.className = styles.lab;
        lab.textContent = edge.l[0];
        lab.style.left = `${edge.l[1]}px`;
        lab.style.top = `${edge.l[2]}px`;
        stageRef.current.appendChild(lab);
        madeElementsRef.current.push(lab);
        void lab.offsetWidth;
        lab.classList.add(styles.labShow);
      }
      await sleep(300);
    },
    [goXY, sleep, uniqueId]
  );

  // Full animation execution loop
  const runAnimation = useCallback(async () => {
    resetState();
    fitStage();
    await sleep(1200);

    for (const node of NODES_DATA) {
      await addNode(node);
      const labelSpan = node.el?.querySelector('.t') as HTMLElement | null;
      if (labelSpan) {
        await typeText(labelSpan, node.t);
      }
      await sleep(300);
    }

    for (const edge of EDGES_DATA) {
      await addEdge(edge);
    }

    await goXY(495, 348);
    await tap();
    await tap();

    if (stageRef.current) {
      const noteEl = document.createElement('div');
      noteEl.className = `${styles.node} ${styles.note}`;
      noteEl.style.left = '440px';
      noteEl.style.top = '318px';
      noteEl.style.width = '111px';
      noteEl.style.height = '59px';
      noteEl.style.transform = 'scale(0.5)';
      stageRef.current.appendChild(noteEl);
      madeElementsRef.current.push(noteEl);
      void noteEl.offsetWidth;
      noteEl.style.transform = 'scale(1)';
      addMini(440, 318, 111, 59, '#fef08a');

      await sleep(500);
      await typeText(noteEl, 'Daily Standup tiap jam 09.30 WIB via Google Meet');
      await sleep(500);
    }

    if (stageRef.current) {
      const mq = document.createElement('div');
      mq.className = styles.mq;
      mq.style.left = '296px';
      mq.style.top = '196px';
      stageRef.current.appendChild(mq);
      madeElementsRef.current.push(mq);

      await goXY(296, 196);
      if (cursorRef.current) cursorRef.current.classList.add(styles.curTap);
      mq.style.opacity = '1';
      void mq.offsetWidth;
      mq.style.width = '528px';
      mq.style.height = '222px';

      await goXY(824, 418);
      if (cursorRef.current) cursorRef.current.classList.remove(styles.curTap);
      mq.style.opacity = '0';

      const nodes = stageRef.current.querySelectorAll(`.${styles.node}`);
      nodes.forEach((el) => el.classList.add(styles.sel));
      await sleep(600);

      if (btnGroupRef.current) {
        await goToElement(btnGroupRef.current);
        await tap(btnGroupRef.current);
      }
      nodes.forEach((el) => el.classList.remove(styles.sel));

      if (frameRef.current) {
        frameRef.current.classList.add(styles.frameShow);
      }
      addMini(289, 173, 539, 249, 'transparent');
      await sleep(500);

      if (frameHeaderRef.current) {
        await typeText(frameHeaderRef.current, 'SPRINT EXECUTION CYCLE');
      }
      await sleep(800);
    }

    if (btnSaveRef.current) {
      await goToElement(btnSaveRef.current);
      await tap(btnSaveRef.current);
    }

    if (alertRef.current) {
      alertRef.current.classList.add(styles.alertShow);
    }
    await sleep(2500);

    await sleep(3500);
  }, [
    resetState,
    fitStage,
    sleep,
    addNode,
    typeText,
    addEdge,
    goXY,
    tap,
    addMini,
    goToElement,
  ]);

  // Reduced motion static final state
  const applyReducedMotionState = useCallback(() => {
    resetState();
    if (!stageRef.current || !svgRef.current) return;

    // Place all 4 nodes at final positions
    NODES_DATA.forEach((node) => {
      const el = document.createElement('div');
      el.className = `${styles.node} ${styles[node.c]}`;
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;
      el.style.width = `${node.w}px`;
      el.style.height = `${node.h}px`;
      el.style.transform = 'scale(1)';

      if (node.c === 'n3') {
        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.setAttribute('viewBox', '0 0 98 58');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '49,1 97,29 49,57 1,29');
        polygon.setAttribute('fill', '#f3e8ff');
        polygon.setAttribute('stroke', '#a855f7');
        polygon.setAttribute('stroke-width', '2');
        svgEl.appendChild(polygon);
        el.appendChild(svgEl);
      }

      const labelSpan = document.createElement('span');
      labelSpan.className = 't';
      labelSpan.textContent = node.t;
      el.appendChild(labelSpan);

      stageRef.current?.appendChild(el);
      madeElementsRef.current.push(el);
      addMini(node.x, node.y, node.w, node.h);
    });

    // Place all 4 edges
    EDGES_DATA.forEach((edge) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', edge.d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', edge.col);
      p.setAttribute('stroke-width', '2');
      p.setAttribute('marker-end', `url(#${uniqueId}-${edge.m})`);
      if (edge.dash) {
        p.setAttribute('stroke-dasharray', '5 4');
      }
      svgRef.current?.appendChild(p);
      madePathsRef.current.push(p);

      if (edge.l) {
        const lab = document.createElement('div');
        lab.className = `${styles.lab} ${styles.labShow}`;
        lab.textContent = edge.l[0];
        lab.style.left = `${edge.l[1]}px`;
        lab.style.top = `${edge.l[2]}px`;
        stageRef.current?.appendChild(lab);
        madeElementsRef.current.push(lab);
      }
    });

    // Place sticky note
    const noteEl = document.createElement('div');
    noteEl.className = `${styles.node} ${styles.note}`;
    noteEl.style.left = '440px';
    noteEl.style.top = '318px';
    noteEl.style.width = '111px';
    noteEl.style.height = '59px';
    noteEl.style.transform = 'scale(1)';
    noteEl.textContent = 'Daily Standup tiap jam 09.30 WIB via Google Meet';
    stageRef.current.appendChild(noteEl);
    madeElementsRef.current.push(noteEl);
    addMini(440, 318, 111, 59, '#fef08a');

    // Place group frame
    if (frameRef.current) {
      frameRef.current.classList.add(styles.frameShow);
    }
    if (frameHeaderRef.current) {
      frameHeaderRef.current.textContent = 'SPRINT EXECUTION CYCLE';
    }
    addMini(289, 173, 539, 249, 'transparent');
  }, [resetState, addMini, uniqueId]);

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
      resetState();
    };
  }, [fitStage, runAnimation, applyReducedMotionState, sleep, resetState]);

  return (
    <div ref={containerRef} className={styles.app}>

      {/* Scaled Canvas Container (1000x480) */}
      <div ref={wrapRef} className={styles.wrap}>
        <div ref={stageRef} className={styles.stage}>
          {/* Mockup Left Slim Rail */}
          <div className={styles.rail}>
            <span>›</span>
            <div className={styles.fo} />
            <span>▦</span>
            <span>☑</span>
            <span>👥</span>
            <span>⛨</span>
            <span>⟲</span>
            <span>👤</span>
            <span>🔗</span>
            <span>⚙</span>
          </div>

          {/* Topbar */}
          <div className={styles.top}>
            <span>☰</span>
            <span>Dashboard</span>
            <div className={styles.user}>
              Tara Alsyah Icode
              <small>ADMIN</small>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <span>All Tasks</span>
            <span>My Tasks</span>
            <span>Kanban Board</span>
            <span>Calendar</span>
            <span>Timeline</span>
            <span className={styles.tabActive}>Flow</span>
            <span>Categories</span>
            <span>Reports</span>
          </div>

          {/* Editor Container Box */}
          <div className={styles.fbox} />

          {/* Flow Header */}
          <div className={styles.fh}>
            <span className={styles.btn}>← Daftar Flow</span>
            <b>Alur Sprint &amp; Delivery</b>
            <span className={styles.btn} style={{ marginLeft: 'auto' }}>
              👁 Mode Lihat
            </span>
          </div>

          {/* Flow Toolbar */}
          <div className={styles.tool}>
            <i>📂</i>
            <i>⬇</i>
            <i>⬆</i>
            <u />
            <i>↶</i>
            <i>↷</i>
            <u />
            <i>✂</i>
            <i>⧉</i>
            <i>📋</i>
            <i>⊕</i>
            <i>🗑</i>
            <u />
            <i>≡</i>
            <i>≣</i>
            <i>☰</i>
            <i>⫴</i>
            <i>⫶</i>
            <u />
            <i>⇩</i>
            <i>⇥</i>
            <u />
            <i ref={btnGroupRef}>◫</i>
            <i>🔓</i>
            <u />
            <i className={styles.toolHl}>▦</i>
            <i className={styles.toolHl}>⌖</i>
            <i className={styles.toolHl}>▣</i>

            <span
              style={{
                marginLeft: 'auto',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                fontSize: '11px',
              }}
            >
              <i>−</i>
              <b style={{ fontSize: '10px', color: 'var(--tx)' }}>90%</b>
              <i>+</i>
              <i>⛶</i>
              <span
                ref={btnSaveRef}
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ marginLeft: '6px' }}
              >
                💾 Simpan
              </span>
            </span>
          </div>

          {/* Shape Palette (Left Panel) */}
          <div className={styles.lp}>
            <h4>
              Panel Bentuk <span>‹</span>
            </h4>
            <div className={styles.srch}>Cari bentuk... 🔍</div>
            <h5>FLOWCHART</h5>
            <div className={styles.grid}>
              <div ref={tileMulaiRef} className={styles.tile}>
                <em>⬭</em>Mulai / Selesai
              </div>
              <div ref={tileProsesRef} className={styles.tile}>
                <em>▭</em>Proses
              </div>
              <div ref={tileKepRef} className={styles.tile}>
                <em>◇</em>Keputusan
              </div>
              <div className={styles.tile}>
                <em>▱</em>Input / Output
              </div>
              <div className={styles.tile}>
                <em>▭</em>Dokumen
              </div>
              <div className={styles.tile}>
                <em>🛢</em>Basis Data
              </div>
              <div className={styles.tile}>
                <em>▥</em>Subproses
              </div>
              <div className={styles.tile}>
                <em>◗</em>Penundaan (Delay)
              </div>
            </div>
            <h5>BENTUK DASAR</h5>
            <div className={styles.grid}>
              <div className={styles.tile}>
                <em>▭</em>Persegi Panjang
              </div>
              <div className={styles.tile}>
                <em>▢</em>Kotak Membulat
              </div>
            </div>
          </div>

          {/* Dotted Canvas */}
          <div className={styles.cv} />

          {/* Right Panel Collapse Handle */}
          <div className={styles.rs}>‹</div>

          {/* Frame (Sprint Execution Cycle) */}
          <div ref={frameRef} className={styles.frame}>
            <div ref={frameHeaderRef} className={styles.fhd} />
          </div>

          {/* SVG Canvas for Edges */}
          <svg ref={svgRef} className={styles.ed} viewBox="0 0 1000 480">
            <defs>
              <marker
                id={`${uniqueId}-mb`}
                markerUnits="userSpaceOnUse"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0 0L8 4L0 8z" fill="#60a5fa" />
              </marker>
              <marker
                id={`${uniqueId}-mo`}
                markerUnits="userSpaceOnUse"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0 0L8 4L0 8z" fill="#fb923c" />
              </marker>
              <marker
                id={`${uniqueId}-mg`}
                markerUnits="userSpaceOnUse"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0 0L8 4L0 8z" fill="#4ade80" />
              </marker>
              <marker
                id={`${uniqueId}-mr`}
                markerUnits="userSpaceOnUse"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0 0L8 4L0 8z" fill="#f87171" />
              </marker>
            </defs>
          </svg>

          {/* Zoom Controls */}
          <div className={styles.zc}>
            <span>+</span>
            <span>−</span>
            <span>⛶</span>
          </div>

          {/* Minimap */}
          <div ref={minimapRef} className={styles.mm} />

          {/* React Flow Watermark */}
          <div className={styles.rf}>React Flow</div>

          {/* Success Notification Alert */}
          <div ref={alertRef} className={styles.alert}>
            <span className={styles.alertIcon}>✔</span>
            Flow berhasil disimpan!
          </div>

          {/* Animated Cursor */}
          <div ref={cursorRef} className={styles.cur}>
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

export default ListFlowAnimation;
