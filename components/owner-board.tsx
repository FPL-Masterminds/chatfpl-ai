"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import type { OwnerBoardCardDto } from "@/app/api/admin/owner-board/route";
import { OWNER_BOARD_LANES, type OwnerBoardLaneId } from "@/lib/owner-board-lanes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function snippet(text: string, max = 120): string {
  const t = text.trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function OwnerBoard() {
  const [cards, setCards] = useState<OwnerBoardCardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<OwnerBoardCardDto | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/owner-board");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to load board");
    }
    const data = await res.json();
    setCards(data.cards ?? []);
  }, []);

  useEffect(() => {
    load()
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);

  const cardsByLane = useMemo(() => {
    const map = new Map<OwnerBoardLaneId, OwnerBoardCardDto[]>();
    for (const lane of OWNER_BOARD_LANES) {
      map.set(
        lane.id,
        cards
          .filter((c) => c.status === lane.id)
          .sort((a, b) => a.position - b.position || a.ticketNumber - b.ticketNumber),
      );
    }
    return map;
  }, [cards]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || adding) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/owner-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add card");
      }
      const data = await res.json();
      setCards((prev) => [...prev, data.card]);
      setNewTitle("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add card");
    } finally {
      setAdding(false);
    }
  }

  async function persistLaneOrder(laneId: OwnerBoardLaneId, ordered: OwnerBoardCardDto[]) {
    const updates = ordered.map((card, index) => ({
      id: card.id,
      status: laneId,
      position: index,
    }));
    const res = await fetch("/api/admin/owner-board/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to save order");
    }
  }

  async function handleDrop(targetLane: OwnerBoardLaneId, targetIndex: number) {
    if (!draggingId) return;
    const dragged = cards.find((c) => c.id === draggingId);
    if (!dragged) return;

    const sourceLane = dragged.status as OwnerBoardLaneId;
    const sourceList = [...(cardsByLane.get(sourceLane) ?? [])];
    const targetList =
      sourceLane === targetLane
        ? sourceList
        : [...(cardsByLane.get(targetLane) ?? [])];

    const fromIndex = sourceList.findIndex((c) => c.id === draggingId);
    if (fromIndex < 0) return;

    let nextSource = sourceList;
    let nextTarget = targetList;

    if (sourceLane === targetLane) {
      const reordered = [...sourceList];
      const [item] = reordered.splice(fromIndex, 1);
      reordered.splice(targetIndex, 0, item);
      nextSource = reordered;
      nextTarget = reordered;
    } else {
      const moved = sourceList[fromIndex];
      nextSource = sourceList.filter((c) => c.id !== draggingId);
      const insertList = [...targetList];
      insertList.splice(targetIndex, 0, { ...moved, status: targetLane });
      nextTarget = insertList;
    }

    const optimistic = cards.map((c) => {
      if (c.id === draggingId) {
        const idx = nextTarget.findIndex((x) => x.id === draggingId);
        return { ...c, status: targetLane, position: idx };
      }
      if (c.status === sourceLane && sourceLane !== targetLane) {
        const idx = nextSource.findIndex((x) => x.id === c.id);
        if (idx >= 0) return { ...c, position: idx };
      }
      if (c.status === targetLane) {
        const idx = nextTarget.findIndex((x) => x.id === c.id);
        if (idx >= 0) return { ...c, position: idx };
      }
      return c;
    });
    setCards(optimistic);
    setDraggingId(null);

    try {
      if (sourceLane === targetLane) {
        await persistLaneOrder(targetLane, nextTarget);
      } else {
        await persistLaneOrder(sourceLane, nextSource);
        await persistLaneOrder(targetLane, nextTarget);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reorder");
      await load();
    }
  }

  async function saveEditing() {
    if (!editing || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/owner-board/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editing.title,
          description: editing.description,
          userStory: editing.userStory,
          acceptanceCriteria: editing.acceptanceCriteria,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      const data = await res.json();
      setCards((prev) => prev.map((c) => (c.id === editing.id ? data.card : c)));
      setEditing(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEditing() {
    if (!editing || saving) return;
    if (!window.confirm("Delete this ticket?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/owner-board/${editing.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setCards((prev) => prev.filter((c) => c.id !== editing.id));
      setEditing(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-white/50">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Owner board</h1>
          <p className="mt-1 text-sm text-white/55">
            Customer journey lanes. Drag cards to update status. Only you can see this.
          </p>
        </div>
        <form onSubmit={handleAdd} className="flex w-full max-w-md gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New ticket title"
            className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#00FF87]/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#1A0E24] disabled:opacity-50"
            style={{ background: "linear-gradient(90deg,#00FF87,#00CFFF)" }}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {OWNER_BOARD_LANES.map((lane) => {
          const laneCards = cardsByLane.get(lane.id) ?? [];
          return (
            <div
              key={lane.id}
              className="flex w-[min(100%,280px)] shrink-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03]"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                void handleDrop(lane.id, laneCards.length);
              }}
            >
              <div className="border-b border-white/10 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  {lane.label}
                </p>
                <p className="text-[11px] text-white/40">{laneCards.length} items</p>
              </div>
              <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
                {laneCards.map((card, index) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => setDraggingId(card.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleDrop(lane.id, index);
                    }}
                    onClick={() => setEditing({ ...card })}
                    className="cursor-grab rounded-xl border border-white/10 bg-black/40 p-3 text-left shadow-sm transition hover:border-[#00FF87]/35 active:cursor-grabbing"
                  >
                    <p className="text-sm font-semibold text-white">
                      {card.ticketNumber}. {card.title}
                    </p>
                    {card.description.trim() && (
                      <p className="mt-1 text-xs leading-relaxed text-white/55">
                        {snippet(card.description)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/15 bg-[#0d0d12] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Ticket {editing?.ticketNumber ?? ""}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 pt-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-white/60">Title</span>
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm focus:border-[#00FF87]/50 focus:outline-none"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-white/60">Description</span>
                <textarea
                  rows={4}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm focus:border-[#00FF87]/50 focus:outline-none"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-white/60">User story</span>
                <textarea
                  rows={3}
                  placeholder="As a … I want … so that …"
                  value={editing.userStory}
                  onChange={(e) => setEditing({ ...editing, userStory: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm placeholder:text-white/25 focus:border-[#00FF87]/50 focus:outline-none"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-white/60">Acceptance criteria</span>
                <textarea
                  rows={3}
                  placeholder="Bullet list of what done looks like"
                  value={editing.acceptanceCriteria}
                  onChange={(e) =>
                    setEditing({ ...editing, acceptanceCriteria: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm placeholder:text-white/25 focus:border-[#00FF87]/50 focus:outline-none"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => void deleteEditing()}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveEditing()}
                    disabled={saving || !editing.title.trim()}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-[#1A0E24] disabled:opacity-50"
                    style={{ background: "linear-gradient(90deg,#00FF87,#00CFFF)" }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
