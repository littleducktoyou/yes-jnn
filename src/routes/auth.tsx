import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/components/LoginScreen";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — yes jnn" },
      { name: "description", content: "Sign in or create an account for yes jnn." },
    ],
  }),
  component: LoginScreen,
});
