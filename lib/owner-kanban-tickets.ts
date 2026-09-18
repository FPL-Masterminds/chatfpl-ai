import type { OwnerKanbanColumnId } from "@/lib/owner-kanban";

export type OwnerKanbanTicketDefinition = {
  title: string;
  description?: string;
  userStory: string;
  acceptanceCriteria: string;
  columnId: OwnerKanbanColumnId;
  sortOrder: number;
};

/** Canonical copy for seeded and backfilled board cards (matched by title). */
export const OWNER_KANBAN_TICKET_DEFINITIONS: OwnerKanbanTicketDefinition[] = [
  {
    title: "Conversational follow-ups (yes please)",
    description:
      "Thread focus + transfer replacement must stay on prior player/topic.",
    userStory:
      "As a ChatFPL user, I want short replies like \"yes please\" to continue the previous advice thread, so that I get bench or transfer help on the same player without repeating myself.",
    acceptanceCriteria: [
      "- Given the assistant offered a follow-up in the thread, when I send an affirmative short reply, then the answer continues that same topic.",
      "- Follow-up handling uses thread focus on the prior player or question, not unrelated names from league-wide filtered data.",
      "- Transfer replacement suggestions respect the focused OUT player and same-position rules when replacements are shown.",
      "- Squad ownership guards still apply: only my linked 15 players are discussed as sells or \"your\" squad.",
    ].join("\n"),
    columnId: "in_progress",
    sortOrder: 0,
  },
  {
    title: "Chat production health + deploy checks",
    description: "Owner status script after every push; deep checks when needed.",
    userStory:
      "As the site owner, I want production chat verified after each deploy, so that I know quickly if customers cannot use chat.",
    acceptanceCriteria: [
      "- scripts/chat-production-status.mjs exits 0 when chat is healthy on https://www.chatfpl.ai.",
      "- After push to main, deploy wait runs then the health script is executed.",
      "- Cursor agent replies end with **Production chat:** Online or Offline for the owner.",
      "- When shallow checks fail, deep checks or Vercel /api/chat runtime logs are consulted per docs/CHAT-PRODUCTION-STATUS.md.",
    ].join("\n"),
    columnId: "done",
    sortOrder: 0,
  },
  {
    title: "Stripe lifecycle E2E",
    description: "Trial welcome, cancel, convert, access rules. Production sign-off.",
    userStory:
      "As a subscriber, I want trial, payment, cancellation, and chat access to stay in sync with Stripe, so that I am never over-charged or locked out unfairly.",
    acceptanceCriteria: [
      "- New trial starts with correct plan, message limits, and welcome email where applicable.",
      "- Active paid subscription unlocks the expected paid tier limits in chat.",
      "- Cancel at period end keeps access until period end, then downgrades per product rules.",
      "- Past due or failed payment states restrict access according to documented billing rules.",
      "- Production sign-off checklist completed (trial, subscribe, cancel, webhook spot-check).",
    ].join("\n"),
    columnId: "in_progress",
    sortOrder: 1,
  },
  {
    title: "Owner email hub",
    description: "Template gallery at /devemails, Resend HTML alignment.",
    userStory:
      "As the site owner, I want to preview every transactional email in one private gallery, so that copy and HTML match what Resend sends before users see it.",
    acceptanceCriteria: [
      "- https://www.chatfpl.ai/devemails is restricted to site owner and returns noindex metadata.",
      "- Gallery lists each template with subject, audience notes, and rendered HTML preview.",
      "- Previews use shared wrapEmailContent / email-templates markup aligned with production sends.",
      "- Page uses dark DevHeader shell consistent with other owner tools.",
    ].join("\n"),
    columnId: "done",
    sortOrder: 1,
  },
  {
    title: "Squad ownership guards",
    description: "Linked Team ID only for sells and your players.",
    userStory:
      "As a user with a linked FPL team, I want chat to treat only my 15 squad players as mine for sells and bench advice, so that I am never told to sell someone I do not own.",
    acceptanceCriteria: [
      "- When a FPL team ID is linked and squad loads, the model payload includes formatSquadOwnershipGuard.",
      "- Assistant replies are post-processed with enforceSquadOwnershipOnAnswer.",
      "- League FILTERED PLAYER DATA is never used to infer which players are on my team for sell or bench calls.",
      "- Manual regression: advice about a player not in my 15 is blocked or corrected.",
    ].join("\n"),
    columnId: "done",
    sortOrder: 2,
  },
  {
    title: "Owner kanban at /dashboard/owner/kanban",
    description: "FPLEI-parity board, ChatFPL branding, owner APIs.",
    userStory:
      "As the site owner, I want a private kanban for ChatFPL delivery work, so that I can track tickets like FPLEI without exposing them on the public site.",
    acceptanceCriteria: [
      "- https://www.chatfpl.ai/dashboard/owner/kanban is owner-auth only and not indexed.",
      "- Six lanes match FPLEI-style journey columns with drag-and-drop on desktop.",
      "- Cards support title, description, user story, acceptance criteria, created date, move, edit, and delete.",
      "- Dark ChatFPL shell with DevHeader and a single site Footer; no Board link on the marketing header.",
    ].join("\n"),
    columnId: "done",
    sortOrder: 3,
  },
];

export const OWNER_KANBAN_INITIAL_SEED = OWNER_KANBAN_TICKET_DEFINITIONS.filter(
  (t) => t.title !== "Owner kanban at /dashboard/owner/kanban",
);

export const OWNER_KANBAN_BACKLOG_SEED = OWNER_KANBAN_TICKET_DEFINITIONS.filter(
  (t) => t.title === "Owner kanban at /dashboard/owner/kanban",
);
