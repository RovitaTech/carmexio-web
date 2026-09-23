import { AppError } from '../../domain/models';

/** Shape shared by PostgrestError, StorageError and AuthError. */
interface SupabaseErrorLike {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
}

/**
 * Same mapping as the Flutter app (`core/error`): PostgREST / Auth / network
 * failures → one `AppError` with a user-facing es-MX message.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const e = (error ?? {}) as SupabaseErrorLike;
  const message = e.message ?? '';

  if (error instanceof TypeError || /failed to fetch|network|fetch failed/i.test(message)) {
    return new AppError(
      $localize`:@@errors.sin-conexion-revisa-tu-internet:Sin conexión. Revisa tu internet e intenta de nuevo.`,
      'network',
    );
  }
  switch (e.code) {
    case 'PGRST116':
      return new AppError(
        $localize`:@@errors.no-encontramos-lo-que-buscas:No encontramos lo que buscas.`,
        'notFound',
      );
    case '42501':
    case 'PGRST301':
      return new AppError(
        $localize`:@@errors.no-tienes-permiso-para-hacer:No tienes permiso para hacer esto.`,
        'auth',
      );
    case '23514':
    case '23502':
    case '22P02':
      return new AppError(
        $localize`:@@errors.revisa-los-datos-e-intenta:Revisa los datos e intenta de nuevo.`,
        'validation',
      );
    case 'invalid_credentials':
      return new AppError(
        $localize`:@@errors.correo-o-contrasena-incorrectos:Correo o contraseña incorrectos.`,
        'auth',
      );
    case 'user_already_exists':
    case 'email_exists':
      return new AppError(
        $localize`:@@errors.ya-existe-una-cuenta-con:Ya existe una cuenta con este correo.`,
        'auth',
      );
    case 'weak_password':
      return new AppError(
        $localize`:@@errors.la-contrasena-es-muy-debil:La contraseña es muy débil. Usa al menos 8 caracteres.`,
        'validation',
      );
    case 'email_not_confirmed':
      return new AppError(
        $localize`:@@errors.confirma-tu-correo-antes-de:Confirma tu correo antes de entrar.`,
        'auth',
      );
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return new AppError(
        $localize`:@@errors.demasiados-intentos-espera-un-momento:Demasiados intentos. Espera un momento.`,
        'server',
      );
  }
  if (e.status === 401 || e.status === 403) {
    return new AppError(
      $localize`:@@errors.tu-sesion-expiro-vuelve-a:Tu sesión expiró. Vuelve a entrar.`,
      'auth',
    );
  }
  return new AppError(
    $localize`:@@errors.algo-salio-mal-intenta-de:Algo salió mal. Intenta de nuevo.`,
    'server',
  );
}

/** `{ data, error }` → data, or throws the mapped `AppError`. */
export function unwrap<T>(result: { data: T; error: unknown }): NonNullable<T> {
  if (result.error) throw toAppError(result.error);
  if (result.data == null)
    throw new AppError(
      $localize`:@@errors.no-encontramos-lo-que-buscas:No encontramos lo que buscas.`,
      'notFound',
    );
  return result.data as NonNullable<T>;
}

/** For writes/RPCs without a payload. */
export function check(result: { error: unknown }): void {
  if (result.error) throw toAppError(result.error);
}
