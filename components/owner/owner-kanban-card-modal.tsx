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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  card: OwnerKanbanCardDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (card: OwnerKanbanCardDto) => void;
};

export function OwnerKanbanCardModal({ card, open, onOpenChange, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userStory, setUserStory] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [saving, setSaving] = useState(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-white">
        <DialogHeader>
          <DialogTitle className="pr-8 text-foreground">Ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Title</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <textarea
              rows={4}
              placeholder="Summary and context for this ticket"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">User story</span>
            <textarea
              rows={4}
              placeholder="As a … I want … so that …"
              value={userStory}
              onChange={(e) => setUserStory(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Acceptance criteria
            </span>
            <textarea
              rows={5}
              placeholder="Bullet list of what done looks like"
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={saving || !title.trim()}
              onClick={() => void handleSave()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
