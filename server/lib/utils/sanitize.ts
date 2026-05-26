/**
 * Sanitization utilities for file names and paths.
 */

/**
 * Sanitize a filename for safe filesystem storage.
 *
 * Removes control characters, reserved characters, truncates to safe length,
 * and replaces whitespace with underscores.
 *
 * @param name - The original filename to sanitize
 * @returns A sanitized filename safe for filesystem storage
 *
 * @example
 * ```ts
 * sanitizeUploadFileName('my file<name>.txt') // returns 'my_file_name_.txt'
 * sanitizeUploadFileName('挽救计划.epub') // returns '挽救计划.epub'
 * sanitizeUploadFileName('') // returns 'unnamed_file'
 * ```
 */
export function sanitizeUploadFileName(name: string): string {
  let sanitized = name
    // Replace whitespace (including tabs) with underscores BEFORE removing control chars
    .replace(/\s+/g, '_')
    // Remove control characters (0x00-0x1f, 0x7f, 0x80-0x9f)
    .replace(/[\x00-\x1f\x7f\x80-\x9f]/g, '')
    // Replace reserved filesystem characters
    .replace(/[<>:"/\\|?*]/g, '_')
    // Collapse consecutive dots to single dot (prevents path traversal false positives)
    .replace(/\.{2,}/g, '.')
    // Collapse multiple consecutive underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing dots, spaces, and underscores
    .replace(/^[.\s_]+|[.\s_]+$/g, '');

  // Truncate to 200 characters to stay well under filesystem limits (255)
  // while leaving room for timestamp suffix and extension
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }

  // Fallback if the name is empty after sanitization
  if (!sanitized) {
    sanitized = 'unnamed_file';
  }

  return sanitized;
}
