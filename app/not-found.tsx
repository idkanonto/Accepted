import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui";
export default function NotFound() {
  return (
    <div className="workspace-page">
      <div className="panel">
        <EmptyState
          icon={<Compass />}
          title="A different path starts here."
          description="We couldn’t find that page. Your application workspace is a good place to pick things up."
          action={
            <Link className="btn-primary" href="/planner">
              Back to your planner
            </Link>
          }
        />
      </div>
    </div>
  );
}
