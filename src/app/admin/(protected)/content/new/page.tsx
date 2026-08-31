import { requireActor } from "@/lib/auth/dal";
import { ArticleCreateForm } from "@/components/admin/article-create-form";

export const metadata = { title: "New article — SIGMA+ Admin" };

export default async function NewArticlePage() {
  const actor = await requireActor();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">New article</h1>
        <p className="mt-1 text-sm text-muted">Starts as a draft — nothing here is public until you publish it.</p>
      </div>
      <ArticleCreateForm defaultAuthor={actor.name || "SIGMA+"} />
    </div>
  );
}
