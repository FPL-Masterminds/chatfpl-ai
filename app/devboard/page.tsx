import { redirect } from "next/navigation";

export default function DevBoardRedirectPage() {
  redirect("/dashboard/owner/kanban");
}
