import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { guestStore } from "@/lib/guestStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deleteMyAccount } from "@/lib/account.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { MarkdownToolbar, applyAction, type EditorAction } from "@/components/MarkdownToolbar";
import {
  NotebookPen,
  Plus,
  Trash2,
  Trash,
  RotateCcw,
  LogOut,
  LogIn,
  Book,
  Menu,
  ArrowLeft,
  Wrench,
  ChevronsDownUp,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

const TRASH_VIEW = "__trash__" as const;
import { cn } from "@/lib/utils";

function MarkdownLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 20V4l6 8 6-8v16" />
      <path d="M18 8v8" />
      <path d="M16 14l2 2 2-2" />
    </svg>
  );
}

type Notebook = { id: string; name: string };
type Note = {
  id: string;
  notebook_id: string | null;
  title: string;
  body: string;
  updated_at: string;
  deleted_at: string | null;
};

export function NotesApp() {
  const { user, signOut } = useAuth();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNotebook, setActiveNotebook] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toolbarHidden, setToolbarHidden] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notesListCollapsed, setNotesListCollapsed] = useState(false);
  const [pendingDeleteNotebook, setPendingDeleteNotebook] = useState<Notebook | null>(null);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const callDeleteAccount = deleteMyAccount;
  const editorRef = useRef<HTMLTextAreaElement>(null);

  function handleAction(action: EditorAction) {
    const ta = editorRef.current;
    if (!ta || !activeNote) return;
    applyAction(ta, action, (next) => updateNote({ body: next }));
  }

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) ?? null,
    [notes, activeNoteId],
  );

  const viewingTrash = activeNotebook === TRASH_VIEW;

  const visibleNotes = useMemo(() => {
    if (viewingTrash) return notes.filter((n) => n.deleted_at);
    const live = notes.filter((n) => !n.deleted_at);
    return activeNotebook ? live.filter((n) => n.notebook_id === activeNotebook) : live;
  }, [notes, activeNotebook, viewingTrash]);

  const isGuest = !user;

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function load() {
    if (isGuest) {
      const nb = guestStore.loadNotebooks().map((n) => ({ id: n.id, name: n.name }));
      const ns = guestStore
        .loadNotes()
        .slice()
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      setNotebooks(nb);
      setNotes(ns);
      return;
    }
    const [nb, ns] = await Promise.all([
      supabase.from("notebooks").select("id,name").order("created_at"),
      supabase
        .from("notes")
        .select("id,notebook_id,title,body,updated_at,deleted_at")
        .order("updated_at", { ascending: false }),
    ]);
    if (nb.error) toast.error(nb.error.message);
    if (ns.error) toast.error(ns.error.message);
    setNotebooks(nb.data ?? []);
    setNotes(ns.data ?? []);
  }

  async function newNotebook() {
    const base = "New notebook";
    const existing = new Set(notebooks.map((n) => n.name));
    let name = base;
    let i = 2;
    while (existing.has(name)) name = `${base} ${i++}`;
    if (isGuest) {
      const nb = guestStore.createNotebook(name);
      setNotebooks((p) => [...p, { id: nb.id, name: nb.name }]);
      setActiveNotebook(nb.id);
      setSidebarOpen(false);
      return;
    }
    const { data, error } = await supabase
      .from("notebooks")
      .insert({ name, user_id: user!.id })
      .select("id,name")
      .single();
    if (error) return toast.error(error.message);
    setNotebooks((p) => [...p, data]);
    setActiveNotebook(data.id);
    setSidebarOpen(false);
  }

  async function confirmDeleteNotebook() {
    const nb = pendingDeleteNotebook;
    if (!nb) return;
    setPendingDeleteNotebook(null);
    if (isGuest) {
      guestStore.deleteNotebook(nb.id);
      setNotebooks((p) => p.filter((n) => n.id !== nb.id));
      if (activeNotebook === nb.id) setActiveNotebook(null);
      await load();
      return;
    }
    const { error } = await supabase.from("notebooks").delete().eq("id", nb.id);
    if (error) return toast.error(error.message);
    setNotebooks((p) => p.filter((n) => n.id !== nb.id));
    if (activeNotebook === nb.id) setActiveNotebook(null);
    await load();
  }

  async function newNote() {
    const targetNotebook = viewingTrash ? null : activeNotebook;
    if (isGuest) {
      const note = guestStore.createNote(targetNotebook);
      setNotes((p) => [note, ...p]);
      setActiveNoteId(note.id);
      setPreview(false);
      if (viewingTrash) setActiveNotebook(null);
      return;
    }
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user!.id,
        notebook_id: targetNotebook,
        title: "Untitled",
        body: "",
      })
      .select("id,notebook_id,title,body,updated_at,deleted_at")
      .single();
    if (error) return toast.error(error.message);
    setNotes((p) => [data, ...p]);
    setActiveNoteId(data.id);
    setPreview(false);
    if (viewingTrash) setActiveNotebook(null);
  }

  async function updateNote(patch: Partial<Pick<Note, "title" | "body">>) {
    if (!activeNote) return;
    const next = { ...activeNote, ...patch, updated_at: new Date().toISOString() };
    setNotes((p) => p.map((n) => (n.id === next.id ? next : n)));
    if (isGuest) {
      guestStore.updateNote(next.id, patch);
      return;
    }
    const { error } = await supabase.from("notes").update(patch).eq("id", next.id);
    if (error) toast.error(error.message);
  }

  async function trashNote(id: string) {
    const stamp = new Date().toISOString();
    setNotes((p) => p.map((n) => (n.id === id ? { ...n, deleted_at: stamp } : n)));
    if (activeNoteId === id) setActiveNoteId(null);
    if (isGuest) {
      guestStore.trashNote(id);
      return;
    }
    const { error } = await supabase.from("notes").update({ deleted_at: stamp }).eq("id", id);
    if (error) toast.error(error.message);
  }

  async function restoreNote(id: string) {
    setNotes((p) => p.map((n) => (n.id === id ? { ...n, deleted_at: null } : n)));
    if (isGuest) {
      guestStore.restoreNote(id);
      return;
    }
    const { error } = await supabase.from("notes").update({ deleted_at: null }).eq("id", id);
    if (error) toast.error(error.message);
  }

  async function permanentlyDeleteNote(id: string) {
    if (isGuest) {
      guestStore.deleteNote(id);
      setNotes((p) => p.filter((n) => n.id !== id));
      if (activeNoteId === id) setActiveNoteId(null);
      return;
    }
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setNotes((p) => p.filter((n) => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
  }

  async function emptyTrash() {
    const trashed = notes.filter((n) => n.deleted_at);
    if (trashed.length === 0) return;
    setNotes((p) => p.filter((n) => !n.deleted_at));
    setActiveNoteId(null);
    if (isGuest) {
      guestStore.emptyTrash();
      return;
    }
    const { error } = await supabase
      .from("notes")
      .delete()
      .in(
        "id",
        trashed.map((n) => n.id),
      );
    if (error) toast.error(error.message);
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-sidebar-border">
        <NotebookPen className="size-5 text-primary" />
        <span className="font-semibold">yes jnn</span>
        <button
          onClick={() => setSidebarCollapsed(true)}
          className="ml-auto hidden md:inline-flex text-sidebar-foreground/70 hover:text-sidebar-foreground p-1"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Notebooks</span>
        <button
          onClick={newNotebook}
          className="text-muted-foreground hover:text-foreground p-1"
          title="New notebook"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        <SidebarItem
          label="All notes"
          icon={<Book className="size-4" />}
          active={activeNotebook === null}
          onClick={() => {
            setActiveNotebook(null);
            setSidebarOpen(false);
          }}
        />
        {notebooks.map((nb) => (
          <SidebarItem
            key={nb.id}
            label={nb.name}
            icon={<Book className="size-4" />}
            active={activeNotebook === nb.id}
            onClick={() => {
              setActiveNotebook(nb.id);
              setSidebarOpen(false);
            }}
            onDelete={() => setPendingDeleteNotebook(nb)}
          />
        ))}
      </nav>
      <div className="border-t border-sidebar-border px-2 py-2">
        <SidebarItem
          label={`Trash${
            notes.filter((n) => n.deleted_at).length
              ? ` (${notes.filter((n) => n.deleted_at).length})`
              : ""
          }`}
          icon={<Trash className="size-4" />}
          active={viewingTrash}
          onClick={() => {
            setActiveNotebook(TRASH_VIEW);
            setSidebarOpen(false);
          }}
        />
      </div>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          {isGuest ? (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 text-xs font-medium hover:opacity-90"
            >
              <LogIn className="size-3.5" /> Log in
            </Link>
          ) : (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    aria-label="Account"
                    className="flex items-center justify-center size-8 rounded-full bg-sidebar-accent text-sidebar-accent-foreground shrink-0 hover:opacity-80"
                  >
                    <User className="size-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-64 p-3 space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Signed in as</div>
                    <div className="text-sm font-medium break-all">{user?.email}</div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => setDeleteAccountOpen(true)}
                  >
                    Delete this account
                  </Button>
                </PopoverContent>
              </Popover>
              <button
                onClick={() => signOut()}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <LogOut className="size-3" /> Sign out
              </button>
            </>
          )}
          <Link
            to="/about"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
          >
            About
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] flex bg-background text-foreground overflow-hidden">
      {/* Desktop sidebar */}
      {!sidebarCollapsed && (
        <aside className="hidden md:flex w-56 border-r border-border flex-col shrink-0">
          {sidebar}
        </aside>
      )}

      {/* Mobile sidebar (sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>Notebooks</SheetTitle>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      {/* Note list — hidden on mobile when a note is open */}
      <section
        className={`${
          activeNoteId ? "hidden md:flex" : "flex"
        } ${notesListCollapsed ? "md:hidden" : "w-full md:w-72"} border-r border-border flex-col shrink-0`}
      >
        <div className="px-3 sm:px-4 py-3 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="md:hidden shrink-0 h-9 w-9">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <span className="font-medium text-sm truncate">
              {viewingTrash
                ? "Trash"
                : activeNotebook
                  ? notebooks.find((n) => n.id === activeNotebook)?.name
                  : "All notes"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={newNote} className="shrink-0">
              <Plus className="size-4" /> New
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="hidden md:inline-flex shrink-0 h-9 w-9"
              title="Collapse notes list"
              onClick={() => setNotesListCollapsed(true)}
            >
              <PanelRightClose className="size-4" />
            </Button>
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {visibleNotes.length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground">No notes yet.</li>
          )}
          {visibleNotes.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => {
                  setActiveNoteId(n.id);
                  setPreview(false);
                }}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-accent transition-colors ${
                  activeNoteId === n.id ? "bg-accent" : ""
                }`}
              >
                <div className="font-medium text-sm truncate">{n.title || "Untitled"}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {n.body.slice(0, 60) || "No content"}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Editor — full screen on mobile when active */}
      <main className={`${activeNoteId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
        {activeNote ? (
          <>
            <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-border flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden shrink-0 h-9 w-9"
                onClick={() => setActiveNoteId(null)}
                aria-label="Back to list"
              >
                <ArrowLeft className="size-5" />
              </Button>
              {sidebarCollapsed && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="hidden md:inline-flex shrink-0 h-9 w-9"
                  title="Show notebooks"
                  onClick={() => setSidebarCollapsed(false)}
                >
                  <PanelLeftOpen className="size-4" />
                </Button>
              )}
              {notesListCollapsed && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="hidden md:inline-flex shrink-0 h-9 w-9"
                  title="Show notes list"
                  onClick={() => setNotesListCollapsed(false)}
                >
                  <PanelRightOpen className="size-4" />
                </Button>
              )}
              <Input
                value={activeNote.title}
                onChange={(e) => updateNote({ title: e.target.value })}
                className="border-0 shadow-none text-base sm:text-lg font-semibold focus-visible:ring-0 px-0 min-w-0"
                placeholder="Untitled"
              />
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 h-9 w-9"
                title={preview ? "Edit" : "Preview markdown"}
                onClick={() => setPreview((p) => !p)}
              >
                <MarkdownLogo className={cn("size-4", preview ? "invert brightness-50" : "")} />
              </Button>
              {!preview && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 h-9 w-9"
                  title={toolbarHidden ? "Show toolbar" : "Hide toolbar"}
                  onClick={() => setToolbarHidden((v) => !v)}
                >
                  {toolbarHidden ? (
                    <Wrench className="size-4" />
                  ) : (
                    <ChevronsDownUp className="size-4" />
                  )}
                </Button>
              )}
              {viewingTrash && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => restoreNote(activeNote.id)}
                  title="Restore note"
                  className="shrink-0 h-9 w-9"
                >
                  <RotateCcw className="size-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  viewingTrash ? permanentlyDeleteNote(activeNote.id) : trashNote(activeNote.id)
                }
                title={viewingTrash ? "Delete permanently" : "Move to trash"}
                className="shrink-0 h-9 w-9"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            {!preview && !toolbarHidden && (
              <>
                <div className="hidden md:block">
                  <MarkdownToolbar
                    textareaRef={editorRef}
                    onApply={handleAction}
                    preview={preview}
                    onTogglePreview={() => setPreview((p) => !p)}
                    variant="desktop"
                  />
                </div>
                <div className="md:hidden">
                  <MarkdownToolbar
                    textareaRef={editorRef}
                    onApply={handleAction}
                    preview={preview}
                    onTogglePreview={() => setPreview((p) => !p)}
                    variant="mobile"
                  />
                </div>
              </>
            )}
            {preview ? (
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeNote.body || "*Nothing to preview*"}
                </ReactMarkdown>
              </div>
            ) : (
              <Textarea
                ref={editorRef}
                value={activeNote.body}
                onChange={(e) => updateNote({ body: e.target.value })}
                placeholder="Write markdown here..."
                className="flex-1 resize-none border-0 shadow-none focus-visible:ring-0 rounded-none px-4 sm:px-6 py-4 font-mono text-sm"
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-6 text-center">
            Select a note or create a new one.
          </div>
        )}
      </main>

      <AlertDialog
        open={!!pendingDeleteNotebook}
        onOpenChange={(o) => !o && setPendingDeleteNotebook(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notebook?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDeleteNotebook?.name}" will be removed. Notes inside become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteNotebook}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAccountOpen} onOpenChange={(o) => !o && setDeleteAccountOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account and every note and notebook you have created.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingAccount}
              onClick={async (e) => {
                e.preventDefault();
                setDeletingAccount(true);
                try {
                  await callDeleteAccount();
                  toast.success("Account deleted");
                  await signOut();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to delete account");
                  setDeletingAccount(false);
                }
              }}
            >
              {deletingAccount ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SidebarItem({
  label,
  icon,
  active,
  onClick,
  onDelete,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer ${
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="truncate flex-1">{label}</span>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}
