import { Suspense } from "react";
import RequireAuth from "@/components/require-auth";
import Simulator from "@/components/simulator";
import { PageHeader, LoadingState } from "@/components/ui";
export const metadata = {
  title: "Supplemental Application Practice",
  description:
    "Practise representative Ontario supplemental application prompts under strict timers and get specific written feedback.",
};
export default function SimulatorPage() {
  return (
    <div className="workspace-page">
      <PageHeader
        eyebrow="Prepare / Practice studio"
        title="Find your words. Build your confidence."
        description="Realistic timers. Representative prompts. Specific feedback from Nova. A focused place to prepare for your supplemental applications."
      />
      <RequireAuth what="the practice simulator">
        <Suspense
          fallback={<LoadingState title="Opening the practice studio…" />}
        >
          <Simulator />
        </Suspense>
      </RequireAuth>
    </div>
  );
}
