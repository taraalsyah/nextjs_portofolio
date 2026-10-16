import { toPng, toJpeg, toSvg } from 'html-to-image';
import { FlowData } from '@/types/flow';

export interface ExportImageOptions {
  format: 'png' | 'jpeg' | 'svg';
  scale?: number;
  backgroundColor?: string;
  transparent?: boolean;
}

/**
 * Downloads a file directly in the browser
 */
export function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports the React Flow viewport canvas to PNG, JPEG, or SVG image
 */
export async function exportFlowImage(
  element: HTMLElement,
  fileName: string,
  options: ExportImageOptions
): Promise<void> {
  const scale = options.scale || 2;
  const isTransparent = options.transparent ?? (options.format === 'png');
  const bg = isTransparent ? 'transparent' : (options.backgroundColor || '#ffffff');

  const filter = (node: HTMLElement) => {
    // Exclude minimap, controls, panel buttons during image snapshot
    if (node?.classList?.contains('react-flow__minimap')) return false;
    if (node?.classList?.contains('react-flow__controls')) return false;
    if (node?.classList?.contains('react-flow__panel')) return false;
    if (node?.classList?.contains('no-export')) return false;
    return true;
  };

  const imageConfig = {
    backgroundColor: bg,
    pixelRatio: scale,
    quality: 0.95,
    filter,
  };

  let dataUrl = '';
  if (options.format === 'png') {
    dataUrl = await toPng(element, imageConfig);
  } else if (options.format === 'jpeg') {
    dataUrl = await toJpeg(element, { ...imageConfig, backgroundColor: options.backgroundColor || '#ffffff' });
  } else if (options.format === 'svg') {
    dataUrl = await toSvg(element, imageConfig);
  }

  const link = document.createElement('a');
  link.download = `${fileName}.${options.format}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates a small base64 thumbnail for flow card previews
 */
export async function generateThumbnail(element: HTMLElement): Promise<string> {
  try {
    const dataUrl = await toJpeg(element, {
      pixelRatio: 0.5,
      quality: 0.6,
      backgroundColor: '#ffffff',
      filter: (node: HTMLElement) => {
        if (node?.classList?.contains('react-flow__minimap')) return false;
        if (node?.classList?.contains('react-flow__controls')) return false;
        if (node?.classList?.contains('react-flow__panel')) return false;
        return true;
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate thumbnail:', err);
    return '';
  }
}

/**
 * Exports FlowData as a JSON file download
 */
export function exportFlowJson(data: FlowData, name: string): void {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const exportPayload = {
    appName: 'NextJs-TaskManagement-Flow',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    name,
    data,
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  downloadFile(jsonStr, `${safeName}.flow.json`, 'application/json');
}
