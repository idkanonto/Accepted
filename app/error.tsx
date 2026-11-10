"use client";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { trackEvent } from "@/lib/track";
import { Button, EmptyState } from "@/components/ui";
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
    trackEvent("page_error");
  }, [error]);
  return (
    <div className="workspace-page">
      <div className="panel">
        <EmptyState
          icon={<RefreshCw />}
          title="Let’s give that another try."
          description="This page couldn’t finish loading. Your saved planner and practice drafts stay in this browser."
          action={<Button onClick={reset}>Try again</Button>}
        />
      </div>
    </div>
  );
}
