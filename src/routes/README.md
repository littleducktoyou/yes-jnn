# Routes

TanStack Start uses file-based routing. Every `.tsx` file in this directory is a route; there's no `src/pages/` directory, no `app/layout.tsx`, no Next.js conventions. The root layout is `src/routes/__root.tsx`.

## File-to-URL mapping

| File                     | URL pattern                                               |
| ------------------------ | --------------------------------------------------------- |
| `index.tsx`              | `/`                                                       |
| `about.tsx`              | `/about`                                                  |
| `users/index.tsx`        | `/users`                                                  |
| `users/$id.tsx`          | `/users/:id` — dynamic; bare `$`, no curly braces        |
| `posts/{-$category}.tsx` | `/posts/:category?` — optional segment                    |
| `files/$.tsx`            | `/files/*` — splat route; access via `_splat` param only  |
| `_layout.tsx`            | Layout route; renders child routes via `<Outlet />`       |
| `__root.tsx`             | App shell; wraps every page. Don't remove `<Outlet />`.   |

`routeTree.gen.ts` is auto-generated on every `bun run dev` & `bun run build`. Don't edit it by hand; your changes will be overwritten.
