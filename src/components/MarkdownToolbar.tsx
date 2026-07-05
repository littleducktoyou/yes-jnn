import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Code2,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Table as TableIcon,
  Eye,
  Pencil,
} from "lucide-react";
import type { RefObject } from "react";

export type EditorAction =
  | "bold"
  | "italic"
  | "strike"
  | "h1"
  | "h2"
  | "h3"
  | "ul"
  | "ol"
  | "task"
  | "quote"
  | "code"
  | "codeblock"
  | "link"
  | "image"
  | "hr"
  | "table";

export function applyAction(
  textarea: HTMLTextAreaElement,
  action: EditorAction,
  setBody: (next: string) => void,
) {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const sel = value.slice(s, e);
  const before = value.slice(0, s);
  const after = value.slice(e);

  const wrap = (left: string, right = left, placeholder = "text") => {
    const inner = sel || placeholder;
    const next = before + left + inner + right + after;
    setBody(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = s + left.length;
      textarea.setSelectionRange(pos, pos + inner.length);
    });
  };

  const linePrefix = (prefix: string | ((i: number) => string)) => {
    const startLine = before.lastIndexOf("\n") + 1;
    const block = value.slice(startLine, e);
    const lines = block.split("\n");
    const updated = lines
      .map((l, i) => (typeof prefix === "string" ? prefix : prefix(i)) + l)
      .join("\n");
    const next = value.slice(0, startLine) + updated + after;
    setBody(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(startLine, startLine + updated.length);
    });
  };

  const insertBlock = (block: string) => {
    const sep = before.endsWith("\n") || before.length === 0 ? "" : "\n\n";
    const next = before + sep + block + "\n" + after;
    setBody(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = before.length + sep.length + block.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  switch (action) {
    case "bold":
      return wrap("**");
    case "italic":
      return wrap("*");
    case "strike":
      return wrap("~~");
    case "code":
      return wrap("`");
    case "h1":
      return linePrefix("# ");
    case "h2":
      return linePrefix("## ");
    case "h3":
      return linePrefix("### ");
    case "ul":
      return linePrefix("- ");
    case "ol":
      return linePrefix((i) => `${i + 1}. `);
    case "task":
      return linePrefix("- [ ] ");
    case "quote":
      return linePrefix("> ");
    case "codeblock":
      return insertBlock("```\n" + (sel || "code") + "\n```");
    case "link": {
      const inner = sel || "text";
      return wrap("[", "](https://)", inner);
    }
    case "image":
      return insertBlock(`![${sel || "alt"}](https://)`);
    case "hr":
      return insertBlock("---");
    case "table":
      return insertBlock("| Col 1 | Col 2 |\n| --- | --- |\n| a | b |\n| c | d |");
  }
}

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onApply: (action: EditorAction) => void;
  preview: boolean;
  onTogglePreview: () => void;
  onHide?: () => void;
  variant?: "desktop" | "mobile";
};

const groups: { action: EditorAction; icon: React.ReactNode; label: string }[] = [
  { action: "h1", icon: <Heading1 className="size-4" />, label: "Heading 1" },
  { action: "h2", icon: <Heading2 className="size-4" />, label: "Heading 2" },
  { action: "h3", icon: <Heading3 className="size-4" />, label: "Heading 3" },
  { action: "bold", icon: <Bold className="size-4" />, label: "Bold" },
  { action: "italic", icon: <Italic className="size-4" />, label: "Italic" },
  { action: "strike", icon: <Strikethrough className="size-4" />, label: "Strikethrough" },
  { action: "code", icon: <Code className="size-4" />, label: "Inline code" },
  { action: "codeblock", icon: <Code2 className="size-4" />, label: "Code block" },
  { action: "quote", icon: <Quote className="size-4" />, label: "Quote" },
  { action: "ul", icon: <List className="size-4" />, label: "Bulleted list" },
  { action: "ol", icon: <ListOrdered className="size-4" />, label: "Numbered list" },
  { action: "task", icon: <ListChecks className="size-4" />, label: "Checklist" },
  { action: "link", icon: <LinkIcon className="size-4" />, label: "Link" },
  { action: "image", icon: <ImageIcon className="size-4" />, label: "Image" },
  { action: "table", icon: <TableIcon className="size-4" />, label: "Table" },
  { action: "hr", icon: <Minus className="size-4" />, label: "Horizontal rule" },
];

export function MarkdownToolbar({
  onApply,
  preview,
  onTogglePreview,
  onHide,
  variant = "desktop",
}: Props) {
  const isMobile = variant === "mobile";
  return (
    <div
      className={`flex items-center gap-0.5 border-b border-border bg-muted/30 ${
        isMobile ? "overflow-x-auto px-2 py-1" : "flex-wrap px-2 py-1"
      }`}
    >
      {groups.map((g) => (
        <Button
          key={g.action}
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          title={g.label}
          aria-label={g.label}
          onClick={() => onApply(g.action)}
          disabled={preview}
        >
          {g.icon}
        </Button>
      ))}
      {onHide ? null : null}
    </div>
  );
}
