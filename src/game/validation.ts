/**
 * Validation utilities for player names and game inputs.
 */

export interface NameValidationResult {
  valid: boolean;
  cleanName: string;
  error?: string;
}

/**
 * Validates a participant name:
 * - Trims leading and trailing whitespace
 * - Rejects empty or whitespace-only names
 * - Enforces 1 to 18 characters
 * - Strips or rejects control characters and unsafe characters
 * - Ensures uniqueness among existing player names
 */
export function validatePlayerName(
  rawName: string,
  existingNames: string[] = [],
  playerIndex: number = 0
): NameValidationResult {
  const trimmed = rawName.trim();

  if (!trimmed) {
    return {
      valid: false,
      cleanName: '',
      error: `Player ${playerIndex + 1} name cannot be empty.`,
    };
  }

  // Reject control characters (0x00 - 0x1F, 0x7F - 0x9F)
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
    return {
      valid: false,
      cleanName: trimmed,
      error: 'Name contains invalid control characters.',
    };
  }

  if (trimmed.length > 18) {
    return {
      valid: false,
      cleanName: trimmed.slice(0, 18),
      error: 'Name cannot exceed 18 characters.',
    };
  }

  // Check duplicate display names (case-insensitive)
  const isDuplicate = existingNames.some(
    (existing) => existing.trim().toLowerCase() === trimmed.toLowerCase()
  );

  if (isDuplicate) {
    return {
      valid: false,
      cleanName: trimmed,
      error: `"${trimmed}" is already used. Please choose a distinct name.`,
    };
  }

  return {
    valid: true,
    cleanName: trimmed,
  };
}
