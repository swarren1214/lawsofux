import { redirect } from "next/navigation";

import { deck } from "@/lib/deck";

export default function PresentIndex() {
  redirect(`/present/${deck.slides[0].id}`);
}
