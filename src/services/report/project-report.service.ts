import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * Configurable maximum threshold for tasks included in a single generated report
 */
export const MAX_REPORT_TASKS = 2000;

export interface ProjectReportFilterParams {
  search?: string;
  status?: string;
  priority?: string;
  categoryId?: string;
  assigneeId?: string;
  createdById?: string;
  dueDate?: string;
}

export interface AppliedFilterInfo {
  projectName: string;
  search: string;
  status: string;
  priority: string;
  assignee: string;
  category: string;
  createdBy: string;
  dueDate: string;
}

export interface ProjectReportData {
  projectName: string;
  projectDescription: string;
  generatedAt: string;
  appliedFilters: AppliedFilterInfo;
  summary: {
    totalTasks: number;
    backlogCount: number;
    openCount: number;
    inProgressCount: number;
    doneCount: number;
    overdueCount: number;
    criticalCount: number;
    highCount: number;
    lowCount: number;
    mediumCount: number;
    completionPercentage: number;
  };
  taskDetails: Array<{
    taskNumber: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignee: string;
    category: string;
    createdBy: string;
    createdDate: string;
    dueDate: string;
    completedDate: string;
    progress: string;
    overdueStatus: string;
  }>;
}

/**
 * Format a Date object or ISO string into YYYY-MM-DD HH:mm format
 */
function formatDate(dateInput?: Date | string | null): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * Read-only database query with dynamic filtering to retrieve project task data
 */
export async function getProjectReportData(
  projectId: number,
  filters: ProjectReportFilterParams = {}
): Promise<ProjectReportData> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, projectName: true, description: true },
  });

  const projectName = project?.projectName || `Project #${projectId}`;
  const projectDescription = project?.description || '';

  // Construct dynamic database filter clause
  const accessWhere: Record<string, unknown> = {
    projectId: projectId,
    deletedAt: null,
  };

  if (filters.status && filters.status.trim() !== '') {
    accessWhere.status = filters.status.trim();
  }

  if (filters.priority && filters.priority.trim() !== '') {
    accessWhere.priority = filters.priority.trim();
  }

  if (filters.categoryId && filters.categoryId.trim() !== '') {
    const cId = parseInt(filters.categoryId.trim(), 10);
    if (!isNaN(cId) && cId > 0) {
      accessWhere.categoryId = cId;
    }
  }

  if (filters.assigneeId && filters.assigneeId.trim() !== '') {
    const aId = parseInt(filters.assigneeId.trim(), 10);
    if (!isNaN(aId) && aId > 0) {
      accessWhere.assigneeId = aId;
    }
  }

  if (filters.createdById && filters.createdById.trim() !== '') {
    const crId = parseInt(filters.createdById.trim(), 10);
    if (!isNaN(crId) && crId > 0) {
      accessWhere.createdById = crId;
    }
  }

  if (filters.search && filters.search.trim() !== '') {
    const q = filters.search.trim();
    accessWhere.OR = [
      { taskNumber: { contains: q } },
      { title: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
    ];
  }

  // Large dataset safeguard — count tasks in DB before loading full objects
  const totalMatchingTasks = await prisma.task.count({ where: accessWhere });

  if (totalMatchingTasks > MAX_REPORT_TASKS) {
    throw new Error(
      `Too many tasks match the selected filters (${totalMatchingTasks} tasks). Maximum limit allowed is ${MAX_REPORT_TASKS}. Please narrow your filters and try again.`
    );
  }

  // Read-only query fetching only tasks that match active database filters
  const tasks = await prisma.task.findMany({
    where: accessWhere,
    include: {
      assignee: { select: { id: true, name: true, username: true } },
      createdBy: { select: { id: true, name: true, username: true } },
      category: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Resolve human-readable names for applied filters section
  let categoryName = 'All';
  if (filters.categoryId && filters.categoryId.trim() !== '') {
    const cId = parseInt(filters.categoryId.trim(), 10);
    if (!isNaN(cId)) {
      const cat = await prisma.taskCategory.findUnique({ where: { id: cId }, select: { name: true } });
      categoryName = cat?.name || `Category #${cId}`;
    }
  }

  let assigneeName = 'All';
  if (filters.assigneeId && filters.assigneeId.trim() !== '') {
    const aId = parseInt(filters.assigneeId.trim(), 10);
    if (!isNaN(aId)) {
      const ass = await prisma.user.findUnique({ where: { id: aId }, select: { name: true } });
      assigneeName = ass?.name || `User #${aId}`;
    }
  }

  let createdByName = 'All';
  if (filters.createdById && filters.createdById.trim() !== '') {
    const crId = parseInt(filters.createdById.trim(), 10);
    if (!isNaN(crId)) {
      const cr = await prisma.user.findUnique({ where: { id: crId }, select: { name: true } });
      createdByName = cr?.name || `User #${crId}`;
    }
  }

  const appliedFilters: AppliedFilterInfo = {
    projectName,
    search: filters.search && filters.search.trim() !== '' ? filters.search.trim() : 'All',
    status: filters.status && filters.status.trim() !== '' ? filters.status.trim() : 'All',
    priority: filters.priority && filters.priority.trim() !== '' ? filters.priority.trim() : 'All',
    assignee: assigneeName,
    category: categoryName,
    createdBy: createdByName,
    dueDate: filters.dueDate && filters.dueDate.trim() !== '' ? filters.dueDate.trim() : 'All',
  };

  const now = new Date();
  const totalTasks = tasks.length;

  let backlogCount = 0;
  let openCount = 0;
  let inProgressCount = 0;
  let doneCount = 0;
  let overdueCount = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  const formattedDetails = tasks.map((t) => {
    // Status counts
    if (t.status === 'BACKLOG') backlogCount++;
    else if (t.status === 'OPEN') openCount++;
    else if (t.status === 'IN_PROGRESS') inProgressCount++;
    else if (t.status === 'DONE') doneCount++;

    // Priority counts
    if (t.priority === 'CRITICAL') criticalCount++;
    else if (t.priority === 'HIGH') highCount++;
    else if (t.priority === 'MEDIUM') mediumCount++;
    else if (t.priority === 'LOW') lowCount++;

    // Overdue check
    const isDone = t.status === 'DONE';
    const isOverdue = !isDone && t.dueDate && new Date(t.dueDate) < now;
    if (isOverdue) overdueCount++;

    // Completed date
    const completedDateStr = isDone ? formatDate(t.doneReviewedAt || t.updatedAt) : '-';

    // Progress percentage
    const progressStr = isDone ? '100%' : t.status === 'IN_PROGRESS' ? '50%' : '0%';

    // Overdue Status
    const overdueStatusStr = isDone ? 'Completed' : isOverdue ? 'Overdue' : 'On Track';

    return {
      taskNumber: t.taskNumber || `TASK-${t.id}`,
      title: t.title,
      description: t.description || '-',
      status: t.status,
      priority: t.priority,
      assignee: t.assignee?.name || 'Unassigned',
      category: t.category?.name || 'Uncategorized',
      createdBy: t.createdBy?.name || 'System',
      createdDate: formatDate(t.createdAt),
      dueDate: formatDate(t.dueDate),
      completedDate: completedDateStr,
      progress: progressStr,
      overdueStatus: overdueStatusStr,
    };
  });

  // Calculate summary metrics strictly based on filtered task records
  const completionPercentage = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  return {
    projectName,
    projectDescription,
    generatedAt: formatDate(now),
    appliedFilters,
    summary: {
      totalTasks,
      backlogCount,
      openCount,
      inProgressCount,
      doneCount,
      overdueCount,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      completionPercentage,
    },
    taskDetails: formattedDetails,
  };
}

/**
 * Generate Excel (.xlsx) file buffer from project report data including Applied Filters section
 */
export async function generateExcelReport(data: ProjectReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Task Management System';
  workbook.created = new Date();

  // -------------------------------------------------------------
  // Sheet 1: Summary / Ringkasan
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet('Summary Report', {
    views: [{ showGridLines: true }],
  });

  // Title section
  summarySheet.mergeCells('A1:D1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `PROJECT TASK REPORT SUMMARY`;
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 36;

  // Metadata
  summarySheet.getCell('A3').value = 'Project Name:';
  summarySheet.getCell('B3').value = data.projectName;
  summarySheet.getCell('A3').font = { bold: true };
  summarySheet.getCell('B3').font = { bold: true, color: { argb: 'FF2563EB' } };

  summarySheet.getCell('A4').value = 'Generated Date:';
  summarySheet.getCell('B4').value = data.generatedAt;
  summarySheet.getCell('A4').font = { bold: true };

  summarySheet.getCell('A5').value = 'Description:';
  summarySheet.getCell('B5').value = data.projectDescription || '-';
  summarySheet.getCell('A5').font = { bold: true };

  // Applied Filters Section Header
  summarySheet.mergeCells('A7:B7');
  const headerFilterCell = summarySheet.getCell('A7');
  headerFilterCell.value = 'APPLIED FILTERS';
  headerFilterCell.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerFilterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
  headerFilterCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(7).height = 22;

  const filterRows = [
    ['Search Query', data.appliedFilters.search],
    ['Status Filter', data.appliedFilters.status],
    ['Priority Filter', data.appliedFilters.priority],
    ['Assignee', data.appliedFilters.assignee],
    ['Category', data.appliedFilters.category],
    ['Created By', data.appliedFilters.createdBy],
  ];

  filterRows.forEach((fr, idx) => {
    const rowIdx = 8 + idx;
    const labelCell = summarySheet.getCell(`A${rowIdx}`);
    const valCell = summarySheet.getCell(`B${rowIdx}`);

    labelCell.value = fr[0];
    valCell.value = fr[1];
    labelCell.font = { bold: true };
    valCell.alignment = { horizontal: 'left' };
  });

  // Summary Table Header
  const summaryHeaderRow = 15;
  summarySheet.mergeCells(`A${summaryHeaderRow}:B${summaryHeaderRow}`);
  const headerSummaryCell = summarySheet.getCell(`A${summaryHeaderRow}`);
  headerSummaryCell.value = 'FILTERED METRICS SUMMARY';
  headerSummaryCell.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerSummaryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
  headerSummaryCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(summaryHeaderRow).height = 22;

  const metrics = [
    ['Total Filtered Tasks', data.summary.totalTasks],
    ['Backlog', data.summary.backlogCount],
    ['Open', data.summary.openCount],
    ['In Progress', data.summary.inProgressCount],
    ['Done (Completed)', data.summary.doneCount],
    ['Overdue Tasks', data.summary.overdueCount],
    ['Critical Priority', data.summary.criticalCount],
    ['High Priority', data.summary.highCount],
    ['Medium Priority', data.summary.mediumCount],
    ['Low Priority', data.summary.lowCount],
    ['Completion Percentage', `${data.summary.completionPercentage}%`],
  ];

  metrics.forEach((m, idx) => {
    const rowIdx = summaryHeaderRow + 1 + idx;
    const labelCell = summarySheet.getCell(`A${rowIdx}`);
    const valCell = summarySheet.getCell(`B${rowIdx}`);

    labelCell.value = m[0];
    valCell.value = m[1];

    labelCell.font = { bold: true };
    valCell.alignment = { horizontal: 'right' };
    if (m[0] === 'Completion Percentage') {
      valCell.font = { bold: true, color: { argb: 'FF10B981' } };
    } else if (m[0] === 'Overdue Tasks' && Number(m[1]) > 0) {
      valCell.font = { bold: true, color: { argb: 'FFEF4444' } };
    }
  });

  summarySheet.getColumn('A').width = 28;
  summarySheet.getColumn('B').width = 28;

  // -------------------------------------------------------------
  // Sheet 2: Task Detail
  // -------------------------------------------------------------
  const detailSheet = workbook.addWorksheet('Task Details', {
    views: [{ showGridLines: true }],
  });

  const columns = [
    { header: 'Task Number', key: 'taskNumber', width: 16 },
    { header: 'Task Title', key: 'title', width: 30 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Priority', key: 'priority', width: 14 },
    { header: 'Assignee', key: 'assignee', width: 22 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Created By', key: 'createdBy', width: 20 },
    { header: 'Created Date', key: 'createdDate', width: 18 },
    { header: 'Due Date', key: 'dueDate', width: 18 },
    { header: 'Completed Date', key: 'completedDate', width: 18 },
    { header: 'Progress', key: 'progress', width: 12 },
    { header: 'Overdue Status', key: 'overdueStatus', width: 16 },
    { header: 'Description', key: 'description', width: 36 },
  ];

  detailSheet.columns = columns;

  // Header row formatting
  const headerRow = detailSheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Data rows
  data.taskDetails.forEach((task) => {
    const row = detailSheet.addRow(task);
    row.height = 20;

    const overdueCell = row.getCell('overdueStatus');
    if (task.overdueStatus === 'Overdue') {
      overdueCell.font = { bold: true, color: { argb: 'FFDC2626' } };
    } else if (task.overdueStatus === 'Completed') {
      overdueCell.font = { bold: true, color: { argb: 'FF059669' } };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generate PDF file buffer from project report data including Applied Filters summary
 */
export async function generatePdfReport(data: ProjectReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 30,
        info: {
          Title: `Project Report - ${data.projectName}`,
          Author: 'Task Management System',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Colors
      const primaryColor = '#1E293B';
      const accentColor = '#2563EB';
      const borderColor = '#E2E8F0';
      const textColor = '#334155';

      // -------------------------------------------------------------
      // PDF Header Banner
      // -------------------------------------------------------------
      doc.rect(30, 30, 782, 44).fill(primaryColor);

      doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold').text(`PROJECT TASK REPORT`, 42, 38);
      doc.fontSize(8.5).font('Helvetica').text(`Project: ${data.projectName} | Generated: ${data.generatedAt}`, 42, 56);

      // Applied Filters Subtitle Bar
      const af = data.appliedFilters;
      const filterSummaryText = `Applied Filters: Status = ${af.status} | Priority = ${af.priority} | Assignee = ${af.assignee} | Category = ${af.category} | Search = ${af.search}`;
      
      doc.rect(30, 76, 782, 16).fill('#475569');
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold').text(filterSummaryText, 38, 80, {
        width: 766,
        ellipsis: true,
      });

      // -------------------------------------------------------------
      // Executive Summary Metrics (KPI Cards)
      // -------------------------------------------------------------
      const yKpi = 98;
      const kpiWidth = 84;
      const kpiHeight = 42;
      const kpis = [
        { label: 'Filtered Tasks', val: String(data.summary.totalTasks), color: '#3B82F6' },
        { label: 'Backlog', val: String(data.summary.backlogCount), color: '#64748B' },
        { label: 'Open', val: String(data.summary.openCount), color: '#0EA5E9' },
        { label: 'In Progress', val: String(data.summary.inProgressCount), color: '#F59E0B' },
        { label: 'Done', val: String(data.summary.doneCount), color: '#10B981' },
        { label: 'Overdue', val: String(data.summary.overdueCount), color: '#EF4444' },
        { label: 'Critical', val: String(data.summary.criticalCount), color: '#DC2626' },
        { label: 'High', val: String(data.summary.highCount), color: '#D97706' },
        { label: 'Completion', val: `${data.summary.completionPercentage}%`, color: '#059669' },
      ];

      kpis.forEach((kpi, idx) => {
        const x = 30 + idx * 87;
        doc.rect(x, yKpi, kpiWidth, kpiHeight).fillAndStroke('#F8FAFC', borderColor);

        doc.fillColor(kpi.color).fontSize(12).font('Helvetica-Bold').text(kpi.val, x + 4, yKpi + 7, {
          width: kpiWidth - 8,
          align: 'center',
        });
        doc.fillColor(textColor).fontSize(7).font('Helvetica').text(kpi.label, x + 4, yKpi + 26, {
          width: kpiWidth - 8,
          align: 'center',
        });
      });

      // -------------------------------------------------------------
      // Task Details Table
      // -------------------------------------------------------------
      let tableTop = 148;
      const pageHeight = 565;

      const cols = [
        { name: 'Task No', width: 65 },
        { name: 'Title', width: 110 },
        { name: 'Status', width: 60 },
        { name: 'Priority', width: 55 },
        { name: 'Assignee', width: 85 },
        { name: 'Category', width: 70 },
        { name: 'Created By', width: 80 },
        { name: 'Created Date', width: 75 },
        { name: 'Due Date', width: 75 },
        { name: 'Completed', width: 75 },
        { name: 'Overdue', width: 55 },
      ];

      const drawTableHeader = (y: number) => {
        doc.rect(30, y, 782, 18).fill(accentColor);
        let xCurrent = 34;
        cols.forEach((col) => {
          doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text(col.name, xCurrent, y + 5, {
            width: col.width - 4,
            align: 'left',
          });
          xCurrent += col.width;
        });
      };

      drawTableHeader(tableTop);
      let currentY = tableTop + 18;

      if (data.taskDetails.length === 0) {
        doc.fillColor(textColor).fontSize(9).font('Helvetica-Oblique').text('Tidak ada task yang memenuhi filter yang dipilih.', 34, currentY + 10);
      } else {
        data.taskDetails.forEach((task, idx) => {
          if (currentY > pageHeight) {
            doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
            currentY = 35;
            drawTableHeader(currentY);
            currentY += 18;
          }

          if (idx % 2 === 1) {
            doc.rect(30, currentY, 782, 18).fill('#F1F5F9');
          } else {
            doc.rect(30, currentY, 782, 18).fill('#FFFFFF');
          }

          let xCurrent = 34;
          const rowY = currentY + 5;

          // 1. Task Number
          doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-Bold').text(task.taskNumber, xCurrent, rowY, {
            width: cols[0].width - 4,
            ellipsis: true,
          });
          xCurrent += cols[0].width;

          // 2. Title
          doc.fillColor(textColor).fontSize(7.5).font('Helvetica').text(task.title, xCurrent, rowY, {
            width: cols[1].width - 4,
            ellipsis: true,
          });
          xCurrent += cols[1].width;

          // 3. Status
          doc.fontSize(7.5).text(task.status, xCurrent, rowY, {
            width: cols[2].width - 4,
            ellipsis: true,
          });
          xCurrent += cols[2].width;

          // 4. Priority
          doc.fontSize(7.5).text(task.priority, xCurrent, rowY, {
            width: cols[3].width - 4,
            ellipsis: true,
          });
          xCurrent += cols[3].width;

          // 5. Assignee
          doc.fontSize(7.5).text(task.assignee, xCurrent, rowY, {
            width: cols[4].width - 4,
            ellipsis: true,
          });
          xCurrent += cols[4].width;

          // 6. Category
          doc.fontSize(7.5).text(task.category, xCurrent, rowY, {
            width: cols[5].width - 4,
            ellipsis: true,
          });
          xCurrent += cols[5].width;

          // 7. Created By
          doc.fontSize(7.5).text(task.createdBy, xCurrent, rowY, {
            width: cols[6].width - 4,
            ellipsis: true,
          });
          xCurrent += cols[6].width;

          // 8. Created Date
          doc.fontSize(7).text(task.createdDate.split(' ')[0], xCurrent, rowY, {
            width: cols[7].width - 4,
            ellipsis: true,
          });
          xCurrent += cols[7].width;

          // 9. Due Date
          doc.fontSize(7).text(task.dueDate.split(' ')[0], xCurrent, rowY, {
            width: cols[8].width - 4,
            ellipsis: true,
          });
          xCurrent += cols[8].width;

          // 10. Completed Date
          doc.fontSize(7).text(task.completedDate.split(' ')[0], xCurrent, rowY, {
            width: cols[9].width - 4,
            ellipsis: true,
          });
          xCurrent += cols[9].width;

          // 11. Overdue Status
          const isOv = task.overdueStatus === 'Overdue';
          const isComp = task.overdueStatus === 'Completed';
          doc.fillColor(isOv ? '#DC2626' : isComp ? '#059669' : textColor).fontSize(7.5).font('Helvetica-Bold').text(task.overdueStatus, xCurrent, rowY, {
            width: cols[10].width - 4,
            ellipsis: true,
          });

          currentY += 18;
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
