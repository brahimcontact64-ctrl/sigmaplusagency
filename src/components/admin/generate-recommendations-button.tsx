"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateSeoRecommendationsAction } from "@/lib/actions/admin-seo";
import { Button } from "@/components/ui/button";

export function GenerateRecommendationsButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await generateSeoRecommendationsAction();
          router.refresh();
        })
      }
    >
      {pending ? "Generating…" : "Generate from audit"}
    </Button>
  );
}
