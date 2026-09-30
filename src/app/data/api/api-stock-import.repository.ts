import { AppError } from '../../domain/models';
import { StockImportRepository } from '../../domain/repositories';
import { STOCK_IMPORT_BATCH, StockImportOutcome, StockItem } from '../../domain/stock-import';

/** `problem+json` from carmexio-BE (RFC 9457 + a stable `code`). */
interface Problem {
  status?: number;
  code?: string;
  title?: string;
  errors?: unknown;
}

/**
 * Admin stock import through carmexio-BE: the server downloads the catalog photos
 * (WhatsApp links expire and browsers can't fetch them cross-origin) and saves the cars.
 * Admin UI is Spanish-only, so messages are plain Spanish.
 */
export class ApiStockImportRepository implements StockImportRepository {
  constructor(
    private readonly apiUrl: string,
    /** The signed-in user's access token (Supabase session), or null. */
    private readonly accessToken: () => Promise<string | null>,
  ) {}

  async importBatch(items: readonly StockItem[]): Promise<StockImportOutcome[]> {
    if (items.length > STOCK_IMPORT_BATCH) {
      throw new AppError(`Máximo ${STOCK_IMPORT_BATCH} autos por envío.`, 'validation');
    }
    const token = await this.accessToken();
    if (!token) throw new AppError('Inicia sesión para continuar.', 'auth');
    let res: Response;
    try {
      res = await fetch(`${this.apiUrl}/admin/listings/import`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ items }),
      });
    } catch {
      throw new AppError(
        'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.',
        'network',
      );
    }
    if (res.ok) return ((await res.json()) as { results: StockImportOutcome[] }).results;
    throw toAppError(res.status, (await res.json().catch(() => ({}))) as Problem);
  }
}

function toAppError(status: number, problem: Problem): AppError {
  if (status === 401) return new AppError('Tu sesión expiró. Vuelve a entrar.', 'auth');
  if (status === 403) return new AppError('Solo un administrador puede importar autos.', 'auth');
  if (status === 400) {
    const detail = Array.isArray(problem.errors)
      ? ` (${problem.errors.slice(0, 3).join('; ')})`
      : '';
    return new AppError(`El servidor rechazó los datos${detail}.`, 'validation');
  }
  if (status === 429) return new AppError('Demasiadas solicitudes. Espera un momento.', 'server');
  return new AppError('El servidor no pudo importar este grupo. Intenta de nuevo.', 'server');
}
