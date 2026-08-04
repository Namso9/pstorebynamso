import { createElement, Fragment, type ReactNode } from "react";

type AllowedTag =
  | "a"
  | "b"
  | "br"
  | "code"
  | "div"
  | "em"
  | "h3"
  | "h4"
  | "h5"
  | "hr"
  | "i"
  | "li"
  | "ol"
  | "p"
  | "small"
  | "span"
  | "strong"
  | "u"
  | "ul";

type RichElement = {
  tag: AllowedTag | "root";
  href?: string;
  className?: string;
  children: RichNode[];
};

type RichNode = RichElement | string;

const allowedTags = new Set<AllowedTag>([
  "a", "b", "br", "code", "div", "em", "h3", "h4", "h5", "hr", "i",
  "li", "ol", "p", "small", "span", "strong", "u", "ul",
]);

const allowedClasses = new Set([
  "faq-accent-blue",
  "faq-accent-green",
  "faq-accent-red",
  "faq-link",
  "telegram-post-link",
]);

const voidTags = new Set<AllowedTag>(["br", "hr"]);
const blockedTags = new Set(["script", "style", "iframe", "object", "embed", "template"]);

function safeHref(rawHref: string | undefined) {
  const raw = (rawHref || "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw, "https://pstorebynamso.com");
    if (!["https:", "http:", "mailto:", "tel:"].includes(url.protocol)) {
      return undefined;
    }
    return raw;
  } catch {
    return undefined;
  }
}

function readAttribute(source: string, name: string) {
  const match = source.match(
    new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"),
  );
  return match?.[1] ?? match?.[2];
}

function parseRichText(html: string) {
  const root: RichElement = { tag: "root", children: [] };
  const stack = [root];
  let blockedDepth = 0;

  for (const token of html.split(/(<[^>]+>)/g)) {
    if (!token) continue;
    if (!token.startsWith("<")) {
      if (!blockedDepth) stack.at(-1)?.children.push(token);
      continue;
    }

    const closing = token.match(/^<\s*\/\s*([a-z0-9]+)/i);
    if (closing) {
      const tag = closing[1].toLowerCase();
      if (blockedTags.has(tag)) {
        blockedDepth = Math.max(0, blockedDepth - 1);
      } else if (!blockedDepth && stack.length > 1 && stack.at(-1)?.tag === tag) {
        stack.pop();
      }
      continue;
    }

    const opening = token.match(/^<\s*([a-z0-9]+)/i);
    if (!opening) continue;
    const tag = opening[1].toLowerCase();
    if (blockedTags.has(tag)) {
      if (!/\/\s*>$/.test(token)) blockedDepth += 1;
      continue;
    }
    if (blockedDepth || !allowedTags.has(tag as AllowedTag)) continue;

    const allowedTag = tag as AllowedTag;
    const className = (readAttribute(token, "class") || "")
      .split(/\s+/)
      .filter((name) => allowedClasses.has(name))
      .join(" ");
    const node: RichElement = {
      tag: allowedTag,
      children: [],
      className: className || undefined,
      href: allowedTag === "a" ? safeHref(readAttribute(token, "href")) : undefined,
    };
    stack.at(-1)?.children.push(node);
    if (!voidTags.has(allowedTag) && !token.endsWith("/>")) stack.push(node);
  }

  return root.children;
}

function renderNode(node: RichNode, key: string): ReactNode {
  if (typeof node === "string") return node;
  if (node.tag === "root") {
    return createElement(Fragment, { key }, node.children.map((child, index) => renderNode(child, `${key}-${index}`)));
  }
  const props: Record<string, unknown> = { key };
  if (node.className) props.className = node.className;
  if (node.tag === "a") {
    if (!node.href) return node.children.map((child, index) => renderNode(child, `${key}-${index}`));
    props.href = node.href;
    props.target = "_blank";
    props.rel = "noopener noreferrer";
  }
  if (voidTags.has(node.tag)) return createElement(node.tag, props);
  return createElement(
    node.tag,
    props,
    node.children.map((child, index) => renderNode(child, `${key}-${index}`)),
  );
}

export function SafeRichText({ html }: { html: string }) {
  return (
    <div className="rich-text">
      {parseRichText(html).map((node, index) => renderNode(node, `rich-${index}`))}
    </div>
  );
}
