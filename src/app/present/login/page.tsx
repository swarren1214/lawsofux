import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { isPresenter, presenterLoginConfigured } from "@/lib/presenter-auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Presenter login · Laws of UX" };

export default async function PresenterLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/present" } = await searchParams;
  if (await isPresenter()) redirect(next.startsWith("/present") ? next : "/present");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md gap-6 p-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-accent-foreground">Laws of UX · Presenter</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Sign in to present</h1>
          <p className="text-muted-foreground">
            Presenter mode shows the speaker notes, so it’s limited to presenters.
          </p>
        </div>
        {presenterLoginConfigured() ? (
          <LoginForm next={next} />
        ) : (
          <p className="rounded-xl bg-muted p-4 text-sm leading-relaxed">
            Presenter login isn’t set up yet. Add <code>PRESENTER_PASSWORD</code> and{" "}
            <code>SESSION_SECRET</code> to <code>.env.local</code> (or the Vercel project settings), then
            restart the server.
          </p>
        )}
        <Link href="/" className="text-sm font-semibold text-accent-foreground">
          ← Back to the training
        </Link>
      </Card>
    </main>
  );
}
