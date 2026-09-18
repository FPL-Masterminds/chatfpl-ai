"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import type { OwnerKanbanCardDto } from "@/lib/owner-kanban-service";
import type { OwnerKanbanColumnId } from "@/lib/owner-kanban";
import { OwnerKanbanCardModal } from "@/components/owner/owner-kanban-card-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ColumnDef = { id: OwnerKanbanColumnId; label: string };

export function OwnerKanbanBoard() {
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [cards, setCards] = useState<OwnerKanbanCardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedCard, setSelectedCard] = useState<OwnerKanbanCardDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const dragEndedAt = useRef(0);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/owner/kanban");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to load board");
    }
    const data = await res.json();
    setColumns(data.columns ?? []);
    setCards(data.cards ?? []);
  }, []);

  useEffect(() => {
    load()
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, OwnerKanbanCardDto[]>();
    for (const col of columns) {
      map.set(
        col.id,
        cards
          .filter((c) => c.columnId === col.id)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      );
    }
    return map;
  }, [cards, columns]);

  async function move(cardId: string, columnId: string, index: number) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/kanban/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, columnId, index }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to move card");
      }
      const data = await res.json();
      setCards(data.cards ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to move card");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/kanban/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, columnId: "todo" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add card");
      }
      setNewTitle("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add card");
    } finally {
      setSaving(false);
    }
  }

  function openCard(card: OwnerKanbanCardDto) {
    if (Date.now() - dragEndedAt.current < 250) return;
    setSelectedCard(card);
    setModalOpen(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Owner board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer journey lanes. Drag cards to update status. Only you can see this.
          </p>
        </div>
        <form onSubmit={handleAdd} className="flex w-full max-w-md gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New ticket title"
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={saving || !newTitle.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </form>
      </div>

      {saving && (
        <p className="text-xs text-muted-foreground">Saving…</p>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {columns.map((column) => {
          const columnCards = cardsByColumn.get(column.id) ?? [];
          return (
            <div
              key={column.id}
              className="flex min-w-0 flex-col rounded-lg border border-border bg-muted/50"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!draggingId) return;
                void move(draggingId, column.id, columnCards.length);
              }}
            >
              <div className="border-b border-border px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground break-words">
                  {column.label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {columnCards.length} items
                </p>
              </div>
              <div className="flex min-h-[320px] flex-col gap-2 p-2">
                {columnCards.map((card, index) => (
                  <div
                    key={card.id}
                    draggable
                    role="button"
                    tabIndex={0}
                    onDragStart={() => setDraggingId(card.id)}
                    onDragEnd={() => {
                      dragEndedAt.current = Date.now();
                      setDraggingId(null);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!draggingId) return;
                      void move(draggingId, column.id, index);
                    }}
                    onClick={() => openCard(card)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openCard(card);
                      }
                    }}
                    className={`cursor-pointer rounded-lg border border-border bg-white p-3 text-left shadow-sm transition hover:shadow-md active:cursor-grabbing break-words ${
                      draggingId === card.id
                        ? "opacity-50 ring-2 ring-accent"
                        : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{card.title}</p>
                    {card.description?.trim() && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {card.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <OwnerKanbanCardModal
        card={selectedCard}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSaved={(updated) => {
          setCards((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c)),
          );
        }}
      />
    </div>
  );
}
