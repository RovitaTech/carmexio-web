import { AppError } from '../../domain/models';

/** `problem+json` from carmexio-BE (RFC 9457 + a stable `code`). */
interface Problem {
  code?: string;
  title?: string;
  errors?: unknown;
}

/** Messages for the admin UI (Spanish only) by carmexio-BE error code. */
const CODES: Record<string, string> = {
  ALREADY_REGISTERED: 'Ese correo ya tiene cuenta: búscalo y cambia su rol.',
  BRANCH_REQUIRED: 'Elige la sucursal del admin.',
  CANNOT_CHANGE_OWN_ROLE: 'No puedes cambiar tu propio rol; pídeselo a otro super admin.',
  USER_NOT_FOUND: 'Usuario no encontrado.',
  REFERENCE_NOT_FOUND: 'La sucursal no existe.',
};

/**
 * Authenticated JSON calls to carmexio-BE for admin jobs that need server keys
 * (invites, photo copies). `accessToken` is the signed-in Supabase session.
 */
export class ApiClient {
  constructor(
    private readonly apiUrl: string,
    private readonly accessToken: () => Promise<string | null>,
  ) {}

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.accessToken();
    if (!token) throw new AppError('Inicia sesión para continuar.', 'auth');
    let res: Response;
    try {
      res = await fetch(`${this.apiUrl}${path}`, {
        method,
        headers: {
          authorization: `Bearer ${token}`,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new AppError(
        'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.',
        'network',
      );
    }
    if (res.ok) return (await res.json()) as T;
    throw toAppError(res.status, (await res.json().catch(() => ({}))) as Problem);
  }
}

function toAppError(status: number, problem: Problem): AppError {
  const known = problem.code && CODES[problem.code];
  if (known) return new AppError(known, status === 404 ? 'notFound' : 'validation');
  if (status === 401) return new AppError('Tu sesión expiró. Vuelve a entrar.', 'auth');
  if (status === 403) return new AppError('Solo un super admin puede hacer esto.', 'auth');
  if (status === 400) {
    const detail = Array.isArray(problem.errors)
      ? ` (${problem.errors.slice(0, 3).join('; ')})`
      : '';
    return new AppError(`El servidor rechazó los datos${detail}.`, 'validation');
  }
  if (status === 429) return new AppError('Demasiadas solicitudes. Espera un momento.', 'server');
  return new AppError('El servidor no respondió bien. Intenta de nuevo.', 'server');
}
