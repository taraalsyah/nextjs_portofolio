import { z } from 'zod';

export const nodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.string(), z.unknown()),
  width: z.number().optional(),
  height: z.number().optional(),
  selected: z.boolean().optional(),
  parentId: z.string().optional(),
  extent: z.union([z.literal('parent'), z.tuple([z.tuple([z.number(), z.number()]), z.tuple([z.number(), z.number()])])]).optional(),
  zIndex: z.number().optional(),
}).passthrough();

export const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  type: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  label: z.string().optional(),
  animated: z.boolean().optional(),
}).passthrough();

export const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});

export const flowDataSchema = z.object({
  nodes: z.array(nodeSchema).default([]),
  edges: z.array(edgeSchema).default([]),
  viewport: viewportSchema.default({ x: 0, y: 0, zoom: 1 }),
  gridSize: z.number().optional(),
  snapToGrid: z.boolean().optional(),
  showGrid: z.boolean().optional(),
  backgroundColor: z.string().optional(),
});

export const createFlowSchema = z.object({
  name: z.string().trim().min(1, 'Nama diagram wajib diisi').max(255, 'Nama diagram maksimal 255 karakter'),
  description: z.string().max(2000, 'Deskripsi maksimal 2000 karakter').optional().nullable(),
  templateId: z.string().optional(),
  data: flowDataSchema.optional(),
});

export const updateFlowSchema = z.object({
  name: z.string().trim().min(1, 'Nama diagram tidak boleh kosong').max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  data: flowDataSchema,
  version: z.number().int().min(1, 'Versi diperlukan untuk penguncian optimis'),
  thumbnail: z.string().max(2000000, 'Thumbnail terlalu besar (maks 2MB)').optional().nullable(),
});

export const importFlowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  data: flowDataSchema,
});

/**
 * Validates maximum payload size (5MB by default)
 */
export function validatePayloadSize(payload: unknown, maxBytes: number = 5 * 1024 * 1024): boolean {
  try {
    const size = Buffer.byteLength(JSON.stringify(payload), 'utf8');
    return size <= maxBytes;
  } catch {
    return false;
  }
}

/**
 * XSS sanitizer for user-entered text labels
 */
export function sanitizeLabel(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
