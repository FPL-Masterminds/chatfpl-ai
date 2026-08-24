"use client"

import { Fragment, type ReactNode } from "react"
import type { SeasonStoryEntities } from "@/lib/season-story"

type EntityType = "league" | "team" | "manager"

const TEAM_GRADIENT = {
  backgroundImage: "linear-gradient(to right,#00FF87,#00FFFF)",
  WebkitBackgroundClip: "text",
} as const

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function buildEntityList(entities: SeasonStoryEntities): { text: string; type: EntityType }[] {
  const priority: Record<EntityType, number> = { league: 0, team: 1, manager: 2 }
  const byText = new Map<string, EntityType>()

  const add = (text: string, type: EntityType) => {
    if (!text.trim()) return
    const existing = byText.get(text)
    if (!existing || priority[type] < priority[existing]) {
      byText.set(text, type)
    }
  }

  add(entities.league, "league")
  for (const team of entities.teams) add(team, "team")
  for (const manager of entities.managers) add(manager, "manager")

  return Array.from(byText.entries()).map(([text, type]) => ({ text, type }))
}

interface EntityMatch {
  start: number
  end: number
  text: string
  type: EntityType
}

function findEntityMatches(text: string, entities: SeasonStoryEntities): EntityMatch[] {
  const entityList = buildEntityList(entities).sort((a, b) => b.text.length - a.text.length)
  const used = new Array<boolean>(text.length).fill(false)
  const matches: EntityMatch[] = []

  for (const { text: entityText, type } of entityList) {
    const regex = new RegExp(escapeRegex(entityText), "gi")
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      const start = match.index
      const end = start + match[0].length
      if (used.slice(start, end).every((slot) => !slot)) {
        for (let i = start; i < end; i++) used[i] = true
        matches.push({ start, end, text: match[0], type })
      }
    }
  }

  return matches.sort((a, b) => a.start - b.start)
}

function EntitySpan({ type, children }: { type: EntityType; children: string }) {
  if (type === "league") {
    return <span className="font-bold text-white/45">{children}</span>
  }
  if (type === "team") {
    return (
      <span className="font-semibold text-transparent bg-clip-text" style={TEAM_GRADIENT}>
        {children}
      </span>
    )
  }
  return <span className="font-bold text-white">{children}</span>
}

export function SeasonStoryFormattedText({
  text,
  entities,
}: {
  text: string
  entities: SeasonStoryEntities
}) {
  const matches = findEntityMatches(text, entities)
  if (matches.length === 0) return <>{text}</>

  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of matches) {
    if (match.start > cursor) {
      nodes.push(<Fragment key={`plain-${cursor}`}>{text.slice(cursor, match.start)}</Fragment>)
    }
    nodes.push(
      <EntitySpan key={`entity-${match.start}`} type={match.type}>
        {match.text}
      </EntitySpan>
    )
    cursor = match.end
  }

  if (cursor < text.length) {
    nodes.push(<Fragment key={`plain-${cursor}`}>{text.slice(cursor)}</Fragment>)
  }

  return <>{nodes}</>
}
