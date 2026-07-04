// Guest-mode local storage for notebooks and notes.
// Data lives only in the browser; nothing is sent to the backend.

export type GuestNotebook = { id: string; name: string; created_at: string };
export type GuestNote = {
  id: string;
  notebook_id: string | null;
  title: string;
  body: string;
  updated_at: string;
  deleted_at: string | null;
};

const NB_KEY = "yesjnn.guest.notebooks";
const NOTE_KEY = "yesjnn.guest.notes";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `g_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const guestStore = {
  loadNotebooks(): GuestNotebook[] {
    if (typeof window === "undefined") return [];
    return safeParse<GuestNotebook[]>(window.localStorage.getItem(NB_KEY), []);
  },
  loadNotes(): GuestNote[] {
    if (typeof window === "undefined") return [];
    const raw = safeParse<GuestNote[]>(window.localStorage.getItem(NOTE_KEY), []);
    // Backfill deleted_at on legacy records.
    return raw.map((n) => ({ ...n, deleted_at: n.deleted_at ?? null }));
  },
  saveNotebooks(list: GuestNotebook[]) {
    window.localStorage.setItem(NB_KEY, JSON.stringify(list));
  },
  saveNotes(list: GuestNote[]) {
    window.localStorage.setItem(NOTE_KEY, JSON.stringify(list));
  },
  createNotebook(name: string): GuestNotebook {
    const nb: GuestNotebook = { id: newId(), name, created_at: new Date().toISOString() };
    const all = guestStore.loadNotebooks();
    all.push(nb);
    guestStore.saveNotebooks(all);
    return nb;
  },
  deleteNotebook(id: string) {
    guestStore.saveNotebooks(guestStore.loadNotebooks().filter((n) => n.id !== id));
    // Detach notes from the notebook rather than deleting them.
    const notes = guestStore
      .loadNotes()
      .map((n) => (n.notebook_id === id ? { ...n, notebook_id: null } : n));
    guestStore.saveNotes(notes);
  },
  createNote(notebookId: string | null): GuestNote {
    const note: GuestNote = {
      id: newId(),
      notebook_id: notebookId,
      title: "Untitled",
      body: "",
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    const all = guestStore.loadNotes();
    all.unshift(note);
    guestStore.saveNotes(all);
    return note;
  },
  updateNote(id: string, patch: Partial<Pick<GuestNote, "title" | "body">>) {
    const all = guestStore
      .loadNotes()
      .map((n) => (n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n));
    guestStore.saveNotes(all);
  },
  trashNote(id: string) {
    const all = guestStore
      .loadNotes()
      .map((n) => (n.id === id ? { ...n, deleted_at: new Date().toISOString() } : n));
    guestStore.saveNotes(all);
  },
  restoreNote(id: string) {
    const all = guestStore.loadNotes().map((n) => (n.id === id ? { ...n, deleted_at: null } : n));
    guestStore.saveNotes(all);
  },
  deleteNote(id: string) {
    guestStore.saveNotes(guestStore.loadNotes().filter((n) => n.id !== id));
  },
  emptyTrash() {
    guestStore.saveNotes(guestStore.loadNotes().filter((n) => !n.deleted_at));
  },
  clear() {
    window.localStorage.removeItem(NB_KEY);
    window.localStorage.removeItem(NOTE_KEY);
  },
};
