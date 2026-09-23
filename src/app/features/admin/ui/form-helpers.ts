import { SchemaPath, SchemaPathRules, validate } from '@angular/forms/signals';
import { LocalizedText } from '../../../domain/content';

/** Form models need every key defined (`undefined` = "no field" in Signal Forms). */
export interface TextModel {
  es: string;
  en: string;
}

export const toTextModel = (t: LocalizedText | undefined): TextModel => ({
  es: t?.es ?? '',
  en: t?.en ?? '',
});

/** Empty Spanish → no value (optional fields); English empty → falls back. */
export function fromTextModel(t: TextModel): LocalizedText | undefined {
  const es = t.es.trim();
  return es ? { es, en: t.en.trim() || undefined } : undefined;
}

/** Internal path (`/autos?x=1`) or absolute http(s) URL. */
export function linkRule(path: SchemaPath<string, SchemaPathRules.Supported>): void {
  validate(path, ({ value }) => {
    const link = value().trim();
    return !link || link.startsWith('/') || /^https?:\/\/\S+$/i.test(link)
      ? undefined
      : { kind: 'link', message: 'Usa una ruta del sitio (/autos…) o una URL https://' };
  });
}

/** `end` (datetime-local string) must come after `start` when both are set. */
export function dateRangeRule(
  start: SchemaPath<string, SchemaPathRules.Supported>,
  end: SchemaPath<string, SchemaPathRules.Supported>,
): void {
  validate(end, ({ value, valueOf }) => {
    const from = valueOf(start);
    return value() && from && value() <= from
      ? { kind: 'range', message: 'La fecha de fin debe ser posterior al inicio.' }
      : undefined;
  });
}
