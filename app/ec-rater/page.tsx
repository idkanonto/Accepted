import RequireAuth from "@/components/require-auth";
import EcRater from "@/components/ec-rater";
import { PageHeader } from "@/components/ui";
export const metadata = {
  title: "EC Rater",
  description:
    "Rank your extracurriculars and get concrete advice on turning them into meaningful, credible activity for supplemental applications.",
};
export default function EcRaterPage() {
  return (
    <div className="workspace-page">
      <PageHeader
        eyebrow="Prepare / Activity portfolio"
        title="There’s a story in what you do."
        description="Bring your extracurriculars into focus. Nova helps you understand their depth and impact, then carries that perspective into your application plan."
      />
      <RequireAuth what="the EC rater">
        <EcRater />
      </RequireAuth>
    </div>
  );
}
