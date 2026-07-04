import { createFileRoute } from "@tanstack/react-router";
import { NotesApp } from "@/components/NotesApp";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "yes jnn — Notes" },
      { name: "description", content: "A simple markdown notes app." },
    ],
  }),
  component: NotesApp,
});
