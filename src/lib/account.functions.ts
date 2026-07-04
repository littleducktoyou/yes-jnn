import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Delete user-owned data first (no FK cascade configured to auth.users)
    const delNotes = await supabaseAdmin.from("notes").delete().eq("user_id", userId);
    if (delNotes.error) throw new Error(delNotes.error.message);
    const delNotebooks = await supabaseAdmin.from("notebooks").delete().eq("user_id", userId);
    if (delNotebooks.error) throw new Error(delNotebooks.error.message);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
