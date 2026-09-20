import fs from 'fs';
import path from 'path';

/**
 * Loads the TaskTuntas Markdown Knowledge Base file.
 * Returns the plain markdown string content.
 */
export function getTaskTuntasKnowledge(): string {
  try {
    const filePath = path.join(
      process.cwd(),
      'src',
      'data',
      'tasktuntas-knowledge.md'
    );
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (error) {
    console.error('[KnowledgeService] Failed to load knowledge base file:', error);
  }

  return '';
}

/**
 * Utility to check if a user prompt is seeking Knowledge Base documentation
 * (e.g. "bagaimana cara...", "apa itu...", "apakah ada alert...", etc.)
 */
export function isKnowledgeQuery(message: string): boolean {
  if (!message || typeof message !== 'string') return false;

  const normalized = message.trim().toLowerCase();

  const KNOWLEDGE_KEYWORDS = [
    'bagaimana cara',
    'bagaimana mengolah',
    'bagaimana menggunakan',
    'bagaimana workflow',
    'apa itu',
    'apa fungsi',
    'apa fungsi dari',
    'apa perbedaan',
    'apa bedanya',
    'apa permission',
    'apa hak akses',
    'apa saja status',
    'apa role',
    'apa syarat',
    'apakah ada',
    'apakah',
    'kenapa fitur',
    'mengapa',
    'jelaskan workflow',
    'jelaskan fitur',
    'jelaskan role',
    'cara membuat',
    'cara mengedit',
    'cara merubah',
    'cara mengubah',
    'cara invite',
    'cara mengundang',
    'panduan',
    'aturan',
    'alert',
    'notifikasi',
    'email',
    'dikirim ke',
    'dikirimkan ke',
    'start date',
    'waktu mulai',
    'tanggal mulai',
    'otomatis',
    'menjadi open',
    'berubah status',
    'reopen',
    'bisa di-edit',
    'bisa diedit',
    'bisa dihapus',
    'bisa di-delete',
    'setelah done',
    'task done',
    'invite code',
    'generate invite',
    'join proyek',
    'join via code',
    'pengaturan proyek',
    'regenerate',
    'request to done',
    'request to close',
  ];

  return KNOWLEDGE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

