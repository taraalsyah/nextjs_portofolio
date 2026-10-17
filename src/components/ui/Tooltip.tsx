'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
  collisionPadding?: number;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  position = 'right',
  delay = 400,
  maxWidth = 200,
  collisionPadding = 12,
  disabled = false,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number; transform?: string }>({
    x: 0,
    y: 0,
    transform: 'translateY(-50%)',
  });
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipId = useId();

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    let side: 'right' | 'bottom' | 'top' | 'left' = position;
    const estimatedTooltipWidth = Math.min(maxWidth, 200);
    const estimatedTooltipHeight = 44;

    // Check collision on right edge: if overflows window, fallback to bottom or left
    if (side === 'right') {
      if (rect.right + 8 + estimatedTooltipWidth > window.innerWidth - collisionPadding) {
        if (rect.bottom + 8 + estimatedTooltipHeight <= window.innerHeight - collisionPadding) {
          side = 'bottom';
        } else if (rect.top - 8 - estimatedTooltipHeight >= collisionPadding) {
          side = 'top';
        } else {
          side = 'left';
        }
      }
    }

    let x = 0;
    let y = 0;
    let transform = 'translateY(-50%)';

    if (side === 'right') {
      x = rect.right + 8;
      y = rect.top + rect.height / 2;
      transform = 'translateY(-50%)';
    } else if (side === 'left') {
      x = Math.max(collisionPadding, rect.left - estimatedTooltipWidth - 8);
      y = rect.top + rect.height / 2;
      transform = 'translateY(-50%)';
    } else if (side === 'bottom') {
      x = Math.max(
        collisionPadding,
        Math.min(
          window.innerWidth - estimatedTooltipWidth - collisionPadding,
          rect.left + rect.width / 2 - estimatedTooltipWidth / 2
        )
      );
      y = rect.bottom + 6;
      transform = 'none';
    } else {
      // top
      x = Math.max(
        collisionPadding,
        Math.min(
          window.innerWidth - estimatedTooltipWidth - collisionPadding,
          rect.left + rect.width / 2 - estimatedTooltipWidth / 2
        )
      );
      y = rect.top - 6 - estimatedTooltipHeight;
      transform = 'none';
    }

    // Clamp Y to viewport boundaries
    const clampedY = Math.max(
      collisionPadding,
      Math.min(window.innerHeight - estimatedTooltipHeight - collisionPadding, y)
    );

    setCoords({ x, y: clampedY, transform });
  }, [position, maxWidth, collisionPadding]);

  const handleOpen = useCallback(() => {
    if (disabled || !content) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, delay);
  }, [disabled, content, delay, updatePosition]);

  const handleClose = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
  }, []);

  // Close tooltip on window scroll or resize
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  const child = React.Children.only(children) as React.ReactElement<any>;

  const triggerProps = {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const originalRef = (child as any).ref;
      if (typeof originalRef === 'function') {
        originalRef(node);
      } else if (originalRef) {
        originalRef.current = node;
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      child.props.onMouseEnter?.(e);
      handleOpen();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      child.props.onMouseLeave?.(e);
      handleClose();
    },
    onFocus: (e: React.FocusEvent) => {
      child.props.onFocus?.(e);
      handleOpen();
    },
    onBlur: (e: React.FocusEvent) => {
      child.props.onBlur?.(e);
      handleClose();
    },
    onDragStart: (e: React.DragEvent) => {
      child.props.onDragStart?.(e);
      handleClose();
    },
    'aria-describedby': isOpen ? tooltipId : undefined,
  };

  return (
    <>
      {React.cloneElement(child, triggerProps)}
      {mounted &&
        isOpen &&
        content &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className={styles.tooltipBubble}
            style={{
              left: `${coords.x}px`,
              top: `${coords.y}px`,
              transform: coords.transform,
              maxWidth: `${maxWidth}px`,
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
