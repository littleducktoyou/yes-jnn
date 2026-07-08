import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/components/LoginScreen";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — yes jnn" },
      {
        name: "description",
        content:
          "Sign in or create a free yes jnn account to sync your markdown notes and notebooks across devices.",
      },
      { property: "og:title", content: "Sign in — yes jnn" },
      {
        property: "og:description",
        content:
          "Sign in or create a free yes jnn account to sync your markdown notes and notebooks across devices.",
      },
    ],
  }),
  component: LoginScreen,
});
