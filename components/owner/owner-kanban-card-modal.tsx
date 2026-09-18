"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { OwnerKanbanCardDto } from "@/lib/owner-kanban-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  card: OwnerKanbanCardDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (card: OwnerKanbanCardDto) => void;
  onDeleted: (cardId: string) => void;
};

const fieldClass =
  "w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#00FF87]/50 focus:outline-none";

export function OwnerKanbanCardModal({
  card,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userStory, setUserStory] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!card) return;
    setTitle(card.title);
    setDescription(card.description ?? "");
    setUserStory(card.userStory ?? "");
    setAcceptanceCriteria(card.acceptanceCriteria ?? "");
    setError(null);
  }, [card]);

  async function handleSave() {
    if (!card || saving) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/owner/kanban/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || null,
          userStory: userStory.trim() || null,
          acceptanceCriteria: acceptanceCriteria.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSaved(data.card);
      onOpenChange(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!card || saving || deleting) return;
    const confirmed = window.confirm(
      `Delete "${card.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/owner/kanban/cards/${card.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      onDeleted(card.id);
      onOpenChange(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/15 bg-[#0d0d12] text-white">
        <DialogHeader>
          <DialogTitle className="pr-8 text-white">Ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/60">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/60">Description</span>
            <textarea
              rows={4}
              placeholder="Summary and context for this ticket"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/60">User story</span>
            <textarea
              rows={4}
              placeholder="As a … I want … so that …"
              value={userStory}
              onChange={(e) => setUserStory(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/60">Acceptance criteria</span>
            <textarea
              rows={5}
              placeholder="Bullet list of what done looks like"
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              className={fieldClass}
            />
          </label>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              type="button"
              disabled={saving || deleting}
              onClick={() => void handleDelete()}
              className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting
                </span>
              ) : (
                "Delete ticket"
              )}
            </button>
            <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || deleting || !title.trim()}
              onClick={() => void handleSave()}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#1A0E24] disabled:opacity-50"
              style={{ background: "linear-gradient(90deg,#00FF87,#00CFFF)" }}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving
                </span>
              ) : (
                "Save"
              )}
            </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
