import { AppError } from '../../domain/models';

export const GENERIC_ERROR = 'Algo salió mal. Intenta de nuevo.';

/** User-facing text for any rejection: repository messages are already es-MX. */
export function errorMessage(error: unknown, fallback = GENERIC_ERROR): string {
  return error instanceof AppError ? error.message : fallback;
}
