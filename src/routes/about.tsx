import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Github, Scale } from "lucide-react";

const REPO_URL = "https://github.com/littleducktoyou/yes-jnn";
const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — yes jnn" },
      { name: "description", content: "About yes jnn — an open-source notes app." },
      { property: "og:title", content: "About — yes jnn" },
      { property: "og:description", content: "About yes jnn — an open-source notes app." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="size-4" /> Back to app
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">About</h1>
        <p className="text-muted-foreground mb-10">yes jnn is a vide shitted open-source notes app.</p>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Links</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 underline hover:text-foreground text-muted-foreground"
              >
                <Github className="size-4" /> GitHub repository
              </a>
            </li>
            <li>
              <a
                href={LICENSE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 underline hover:text-foreground text-muted-foreground"
              >
                <Scale className="size-4" /> License (AGPL-3.0-or-later)
              </a>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Design inspiration</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The design of this project is inspired by{" "}
            <a
              href="https://github.com/laurent22/joplin"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              Joplin
            </a>
            , an open-source note-taking application. yes jnn is an independent implementation and
            is not affiliated with or endorsed by Joplin or JOPLIN SAS. Joplin® is a trademark of
            JOPLIN SAS.
          </p>
        </section>
      </div>
    </div>
  );
}
