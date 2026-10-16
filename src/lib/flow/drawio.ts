import { FlowData, AppNode, AppEdge } from '@/types/flow';

/**
 * Draw.io / diagrams.net (.drawio / mxGraph XML) interoperability utility.
 * 
 * Note: Draw.io uses mxGraphModel XML syntax (<mxGraphModel><root><mxCell .../></root></mxGraphModel>).
 * Full roundtrip fidelity of custom stencil shapes is complex, so we provide:
 * 1. An export generator for basic rectangles, diamonds, and connectors to standard mxGraph XML.
 * 2. An XML parser extractor that reconstructs nodes and edges from mxCells.
 */

export function exportToDrawIoXml(data: FlowData, name: string): string {
  const cells: string[] = [
    '<mxCell id="0"/>',
    '<mxCell id="1" parent="0"/>',
  ];

  data.nodes.forEach((node) => {
    const x = node.position.x;
    const y = node.position.y;
    const w = node.width || 140;
    const h = node.height || 60;
    const label = (node.data.label || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let style = 'rounded=0;whiteSpace=wrap;html=1;';

    if (node.data.shapeType === 'decision') {
      style = 'rhombus;whiteSpace=wrap;html=1;';
    } else if (node.data.shapeType === 'startEnd') {
      style = 'rounded=1;arcSize=50;whiteSpace=wrap;html=1;';
    } else if (node.data.shapeType === 'ellipse') {
      style = 'ellipse;whiteSpace=wrap;html=1;';
    } else if (node.data.shapeType === 'database') {
      style = 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;';
    }

    if (node.data.fill) style += `fillColor=${node.data.fill};`;
    if (node.data.stroke) style += `strokeColor=${node.data.stroke};`;

    cells.push(
      `<mxCell id="${node.id}" value="${label}" style="${style}" vertex="1" parent="1">` +
        `<mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/>` +
      `</mxCell>`
    );
  });

  data.edges.forEach((edge) => {
    const rawLabel = String(edge.data?.label || edge.label || '');
    const label = rawLabel.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const style = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;';
    cells.push(
      `<mxCell id="${edge.id}" value="${label}" style="${style}" edge="1" parent="1" source="${edge.source}" target="${edge.target}">` +
        `<mxGeometry relative="1" as="geometry"/>` +
      `</mxCell>`
    );
  });

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="NextJs Task Management Flow" version="21.0.0" type="device">\n` +
    `  <diagram id="diagram-1" name="${name}">\n` +
    `    <mxGraphModel dx="1000" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">\n` +
    `      <root>\n` +
    `        ${cells.join('\n        ')}\n` +
    `      </root>\n` +
    `    </mxGraphModel>\n` +
    `  </diagram>\n` +
    `</mxfile>`
  );
}

/**
 * Basic parser for .drawio / mxGraph XML files into FlowData
 */
export function parseDrawIoXml(xmlText: string): FlowData {
  const nodes: AppNode[] = [];
  const edges: AppEdge[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const cells = doc.getElementsByTagName('mxCell');

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const id = cell.getAttribute('id');
      if (!id || id === '0' || id === '1') continue;

      const isVertex = cell.getAttribute('vertex') === '1';
      const isEdge = cell.getAttribute('edge') === '1';
      const value = cell.getAttribute('value') || '';
      const source = cell.getAttribute('source');
      const target = cell.getAttribute('target');

      if (isVertex) {
        const geo = cell.getElementsByTagName('mxGeometry')[0];
        const x = geo ? parseFloat(geo.getAttribute('x') || '100') : 100;
        const y = geo ? parseFloat(geo.getAttribute('y') || '100') : 100;
        const width = geo ? parseFloat(geo.getAttribute('width') || '140') : 140;
        const height = geo ? parseFloat(geo.getAttribute('height') || '60') : 60;
        const style = cell.getAttribute('style') || '';

        let shapeType = 'process';
        if (style.includes('rhombus')) shapeType = 'decision';
        else if (style.includes('rounded=1')) shapeType = 'startEnd';
        else if (style.includes('cylinder')) shapeType = 'database';
        else if (style.includes('ellipse')) shapeType = 'ellipse';

        nodes.push({
          id,
          type: 'shapeNode',
          position: { x, y },
          width,
          height,
          data: {
            label: value || 'Node',
            shapeType: shapeType as any,
            fill: '#ffffff',
            stroke: '#2563eb',
            strokeWidth: 2,
          },
        });
      } else if (isEdge && source && target) {
        edges.push({
          id,
          source,
          target,
          type: 'customEdge',
          label: value || undefined,
          data: {
            label: value || undefined,
            lineType: 'smoothstep',
            stroke: '#64748b',
            strokeWidth: 2,
            markerEnd: 'arrowclosed',
          },
        });
      }
    }
  } catch (err) {
    console.error('Failed to parse draw.io XML:', err);
  }

  return {
    nodes,
    edges,
    viewport: { x: 0, y: 0, zoom: 1 },
    gridSize: 15,
    snapToGrid: true,
    showGrid: true,
  };
}
