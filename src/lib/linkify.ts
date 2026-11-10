export type TextPart = { text: string; href?: string };

export function linkify(text: string): TextPart[] {
  const pattern = /https?:\/\/[^\s<>"\u1000-\u109f]+|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}(?:\/[^\s<>"\u1000-\u109f]*)?/gi;
  const parts: TextPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index;
    if (start > 0 && text[start - 1] === "@") continue;
    const value = match[0].replace(/[.,;:!?\])}]+$/, "");
    if (!value) continue;
    const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(href);
      if (!["http:", "https:"].includes(url.protocol)) continue;
    } catch {
      continue;
    }
    if (start > cursor) parts.push({ text: text.slice(cursor, start) });
    parts.push({ text: value, href });
    cursor = start + value.length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
