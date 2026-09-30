import { AppError } from '../../domain/models';
import { StockImportRepository } from '../../domain/repositories';
import { STOCK_IMPORT_BATCH, StockImportOutcome, StockItem } from '../../domain/stock-import';
import { ApiClient } from './api-client';

/**
 * Admin stock import through carmexio-BE: the server downloads the catalog photos
 * (WhatsApp links expire and browsers can't fetch them cross-origin) and saves the cars.
 */
export class ApiStockImportRepository implements StockImportRepository {
  constructor(private readonly api: ApiClient) {}

  async importBatch(items: readonly StockItem[]): Promise<StockImportOutcome[]> {
    if (items.length > STOCK_IMPORT_BATCH) {
      throw new AppError(`Máximo ${STOCK_IMPORT_BATCH} autos por envío.`, 'validation');
    }
    const res = await this.api.request<{ results: StockImportOutcome[] }>(
      'POST',
      '/admin/listings/import',
      { items },
    );
    return res.results;
  }
}
