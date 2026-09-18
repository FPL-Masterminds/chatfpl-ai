"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import type { OwnerKanbanCardDto } from "@/lib/owner-kanban-service";
import { COLUMNS, formatOwnerKanbanCreatedDate } from "@/lib/owner-kanban";
import { OwnerKanbanCardModal } from "@/components/owner/owner-kanban-card-modal";

export function OwnerKanbanBoard() {
  const [cards, setCards] = useState<OwnerKanbanCardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedCard, setSelectedCard] = useState<OwnerKanbanCardDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const dragEndedAt = useRef(0);
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarsePointer(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/owner/kanban", { credentials: "include" });
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

  const columns = COLUMNS;

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, OwnerKanbanCardDto[]>();
    for (const col of COLUMNS) {
      map.set(
        col.id,
        cards
          .filter((c) => c.columnId === col.id)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      );
    }
    return map;
  }, [cards]);

  async function move(cardId: string, columnId: string, index: number) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/kanban/move", {
        method: "POST",
        credentials: "include",
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
        credentials: "include",
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
      <div className="flex min-h-[40vh] items-center justify-center text-white/50">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Owner board</h1>
          <p className="mt-1 text-sm text-white/55">
            {coarsePointer
              ? "Use the status dropdown on each card to move lanes. Tap a card to edit."
              : "Customer journey lanes. Drag cards to update status. Only you can see this."}
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
            disabled={saving || !newTitle.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#1A0E24] disabled:opacity-50"
            style={{ background: "linear-gradient(90deg,#00FF87,#00CFFF)" }}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
      </div>

      {saving && <p className="text-xs text-white/45">Saving…</p>}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {columns.map((column) => {
          const columnCards = cardsByColumn.get(column.id) ?? [];
          return (
            <div
              key={column.id}
              className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03]"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const cardId = draggingIdRef.current ?? draggingId;
                if (!cardId) return;
                void move(cardId, column.id, columnCards.length);
              }}
            >
              <div className="border-b border-white/10 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80 break-words">
                  {column.label}
                </p>
                <p className="text-[10px] text-white/40">{columnCards.length} items</p>
              </div>
              <div className="flex min-h-[320px] flex-col gap-2 p-2">
                {columnCards.map((card, index) => (
                  <div
                    key={card.id}
                    draggable={!coarsePointer}
                    role="button"
                    tabIndex={0}
                    onDragStart={(e) => {
                      if (coarsePointer) return;
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", card.id);
                      draggingIdRef.current = card.id;
                      setDraggingId(card.id);
                    }}
                    onDragEnd={() => {
                      dragEndedAt.current = Date.now();
                      window.setTimeout(() => {
                        draggingIdRef.current = null;
                        setDraggingId(null);
                      }, 0);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const cardId = draggingIdRef.current ?? draggingId;
                      if (!cardId) return;
                      void move(cardId, column.id, index);
                    }}
                    onClick={() => openCard(card)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openCard(card);
                      }
                    }}
                    className={`cursor-pointer rounded-xl border border-white/10 bg-black/40 p-3 text-left shadow-sm transition hover:border-[#00FF87]/35 active:cursor-grabbing break-words ${
                      draggingId === card.id ? "opacity-50 ring-2 ring-[#00FF87]" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{card.title}</p>
                    {card.description?.trim() && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">
                        {card.description}
                      </p>
                    )}
                    <p className="mt-2 text-[11px] text-white/35">
                      Date created: {formatOwnerKanbanCreatedDate(card.createdAt)}
                    </p>
                    {coarsePointer && (
                      <label
                        className="mt-2 block text-[10px] text-white/50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Status
                        <select
                          className="mt-0.5 w-full rounded-md border border-white/15 bg-black/60 px-2 py-1 text-xs text-white"
                          value={card.columnId}
                          onChange={(e) => {
                            const target = e.target.value;
                            const destLen =
                              cardsByColumn.get(target)?.filter((c) => c.id !== card.id)
                                .length ?? 0;
                            void move(card.id, target, destLen);
                          }}
                        >
                          {COLUMNS.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.label}
                            </option>
                          ))}
                        </select>
                      </label>
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
          setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        }}
      />
    </div>
  );
}
