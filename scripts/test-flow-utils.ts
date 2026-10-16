import assert from 'node:assert';
import {
  createFlowSchema,
  updateFlowSchema,
  validatePayloadSize,
  sanitizeLabel,
} from '../src/lib/flow/validation';
import {
  getAutoLayout,
  alignNodes,
  distributeNodes,
} from '../src/lib/flow/layout';
import { FLOW_TEMPLATES, getTemplateById } from '../src/lib/flow/templates';
import { exportToDrawIoXml, parseDrawIoXml } from '../src/lib/flow/drawio';
import { AppNode, AppEdge, FlowData } from '../src/types/flow';

console.log('🧪 Starting Flow Editor Unit Tests...\n');

// 1. Validation Tests
console.log('1. Testing Schema Validation & Sanitization...');

// 1.1 Valid create flow payload
const validCreate = createFlowSchema.safeParse({
  name: 'Diagram Proses Bisnis',
  description: 'Deskripsi alur',
  data: {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  },
});
assert.strictEqual(validCreate.success, true, 'createFlowSchema should accept valid payload');

// 1.2 Invalid empty name
const invalidCreate = createFlowSchema.safeParse({
  name: '',
});
assert.strictEqual(invalidCreate.success, false, 'createFlowSchema should reject empty name');

// 1.3 Optimistic locking version validation
const validUpdate = updateFlowSchema.safeParse({
  name: 'Updated Name',
  version: 2,
  data: {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  },
});
assert.strictEqual(validUpdate.success, true, 'updateFlowSchema should require valid version');

const invalidUpdate = updateFlowSchema.safeParse({
  name: 'Updated Name',
  // missing version
  data: {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  },
});
assert.strictEqual(invalidUpdate.success, false, 'updateFlowSchema should reject payload without version');

// 1.4 Payload size validation
assert.strictEqual(validatePayloadSize({ test: 'small' }), true, 'Small payload should pass size check');
const hugeObj = { data: 'x'.repeat(6 * 1024 * 1024) };
assert.strictEqual(validatePayloadSize(hugeObj), false, 'Payload > 5MB should fail size check');

// 1.5 XSS Sanitizer
const rawInput = '<script>alert("XSS")</script>';
const cleanLabel = sanitizeLabel(rawInput);
assert.strictEqual(cleanLabel.includes('<script>'), false, 'XSS script tags must be escaped');
assert.strictEqual(cleanLabel.includes('&lt;script&gt;'), true, 'Tags should be safely HTML-escaped');

console.log('   ✅ Schema validation tests passed.');

// 2. Auto-Layout and Alignment Tests
console.log('2. Testing Auto-Layout and Node Alignment...');

const sampleNodes: AppNode[] = [
  {
    id: 'n1',
    type: 'shapeNode',
    position: { x: 0, y: 0 },
    width: 160,
    height: 70,
    data: { label: 'Start', shapeType: 'startEnd' },
  },
  {
    id: 'n2',
    type: 'shapeNode',
    position: { x: 0, y: 0 },
    width: 160,
    height: 70,
    data: { label: 'Process', shapeType: 'process' },
  },
  {
    id: 'n3',
    type: 'shapeNode',
    position: { x: 0, y: 0 },
    width: 140,
    height: 90,
    data: { label: 'Decision', shapeType: 'decision' },
  },
];

const sampleEdges: AppEdge[] = [
  { id: 'e1', source: 'n1', target: 'n2', type: 'customEdge' },
  { id: 'e2', source: 'n2', target: 'n3', type: 'customEdge' },
];

// 2.1 Dagre Layout (TB)
const tbLayout = getAutoLayout(sampleNodes, sampleEdges, 'TB');
assert.strictEqual(tbLayout.nodes.length, 3, 'Should retain all nodes');
assert.strictEqual(tbLayout.edges.length, 2, 'Should retain all edges');
// In TB layout, n1 should be above n2, which should be above n3
const [layoutN1, layoutN2, layoutN3] = tbLayout.nodes;
assert.ok(layoutN2.position.y > layoutN1.position.y, 'In TB layout, n2 should have larger y than n1');
assert.ok(layoutN3.position.y > layoutN2.position.y, 'In TB layout, n3 should have larger y than n2');

// 2.2 Dagre Layout (LR)
const lrLayout = getAutoLayout(sampleNodes, sampleEdges, 'LR');
const [lrN1, lrN2, lrN3] = lrLayout.nodes;
assert.ok(lrN2.position.x > lrN1.position.x, 'In LR layout, n2 should have larger x than n1');
assert.ok(lrN3.position.x > lrN2.position.x, 'In LR layout, n3 should have larger x than n2');

// 2.3 Alignment
const unalignedNodes: AppNode[] = [
  { id: 'a1', type: 'shapeNode', position: { x: 50, y: 10 }, data: { label: 'A1', shapeType: 'process' } },
  { id: 'a2', type: 'shapeNode', position: { x: 120, y: 80 }, data: { label: 'A2', shapeType: 'process' } },
];
const leftAligned = alignNodes(unalignedNodes, 'left');
assert.strictEqual(leftAligned[0].position.x, 50, 'Left alignment should match min X');
assert.strictEqual(leftAligned[1].position.x, 50, 'Left alignment should match min X');

// 2.4 Distribution
const nodesToDistribute: AppNode[] = [
  { id: 'd1', type: 'shapeNode', position: { x: 0, y: 0 }, data: { label: 'D1', shapeType: 'process' } },
  { id: 'd2', type: 'shapeNode', position: { x: 30, y: 0 }, data: { label: 'D2', shapeType: 'process' } },
  { id: 'd3', type: 'shapeNode', position: { x: 200, y: 0 }, data: { label: 'D3', shapeType: 'process' } },
];
const distributed = distributeNodes(nodesToDistribute, 'horizontal');
assert.strictEqual(distributed[0].position.x, 0);
assert.strictEqual(distributed[1].position.x, 100, 'Middle node should be evenly distributed at 100');
assert.strictEqual(distributed[2].position.x, 200);

console.log('   ✅ Auto-layout, alignment, and distribution tests passed.');

// 3. Template Integrity Tests
console.log('3. Testing Flow Templates...');
assert.strictEqual(FLOW_TEMPLATES.length, 4, 'Should provide 4 templates');

const expectedTemplateIds = ['blank', 'standard-process', 'approval-workflow', 'sprint-workflow'];
for (const id of expectedTemplateIds) {
  const tpl = getTemplateById(id);
  assert.ok(tpl, `Template ${id} should exist`);
  assert.ok(tpl.name, `Template ${id} must have a name`);
  assert.ok(tpl.data, `Template ${id} must have data`);
}

const standardProc = getTemplateById('standard-process');
assert.ok(standardProc.data.nodes.length >= 5, 'Standard process template must contain workflow nodes');
assert.ok(standardProc.data.edges.length >= 4, 'Standard process template must contain edges');

console.log('   ✅ Template tests passed.');

// 4. Draw.io XML Export / Import Interop Tests
console.log('4. Testing Draw.io XML Export / Import...');

const flowTestData: FlowData = {
  nodes: [
    {
      id: 'step-1',
      type: 'shapeNode',
      position: { x: 100, y: 150 },
      width: 140,
      height: 60,
      data: { label: 'Mulai Verifikasi', shapeType: 'startEnd' },
    },
    {
      id: 'step-2',
      type: 'shapeNode',
      position: { x: 100, y: 280 },
      width: 140,
      height: 80,
      data: { label: 'Setujui Dokumen?', shapeType: 'decision' },
    },
  ],
  edges: [
    {
      id: 'flow-e1',
      source: 'step-1',
      target: 'step-2',
      type: 'customEdge',
      data: { label: 'Next' },
    },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

const xmlOutput = exportToDrawIoXml(flowTestData, 'Test Flow');
assert.ok(xmlOutput.includes('<mxfile'), 'Should output valid mxfile XML');
assert.ok(xmlOutput.includes('<mxGraphModel'), 'Should contain mxGraphModel tag');
assert.ok(xmlOutput.includes('Mulai Verifikasi'), 'Should contain node label');
assert.ok(xmlOutput.includes('step-1'), 'Should contain node ID');

console.log('   ✅ Draw.io interoperability tests passed.');

console.log('\n🎉 ALL UNIT TESTS PASSED SUCCESSFULLY! (100%)\n');
