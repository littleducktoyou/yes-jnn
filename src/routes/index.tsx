import { createFileRoute } from "@tanstack/react-router";
import { NotesApp } from "@/components/NotesApp";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "yes jnn — Your Markdown Notes" },
      {
        name: "description",
        content:
          "Write, organize, and preview markdown notes in your browser with yes jnn — a fast, open-source notes app inspired by Joplin.",
      },
      { property: "og:title", content: "yes jnn — Your Markdown Notes" },
      {
        property: "og:description",
        content:
          "Write, organize, and preview markdown notes in your browser with yes jnn — a fast, open-source notes app inspired by Joplin.",
      },
    ],
  }),
  component: NotesApp,
});
