import { Resource } from '@angular/core';

/**
 * Secondary content (banners, brand chips, branch lists, similar cars): a
 * failure degrades to `fallback` instead of breaking the page.
 */
export function optional<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return promise.catch(() => fallback);
}

/**
 * `resource.value()` throws while the resource is in an error state; this
 * returns `fallback` instead (while idle, loading or failed).
 */
export function valueOr<T, F>(resource: Resource<T>, fallback: F): Exclude<T, undefined> | F {
  return resource.hasValue() ? (resource.value() as Exclude<T, undefined>) : fallback;
}
