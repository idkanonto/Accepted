import type { Metadata } from "next";
import { Check, Sparkles } from "lucide-react";
import LoginCard from "@/components/login-card";
import { PageHeader } from "@/components/ui";
export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Accepted! to save your practice and get scored feedback.",
};
export default function LoginPage() {
  return (
    <div className="workspace-page">
      <PageHeader
        eyebrow="Your Accepted account"
        title="Keep your practice together."
        description="Sign in to return to your scored responses, Nova’s feedback, and your practice history."
      />
      <section className="panel mx-auto grid max-w-4xl overflow-hidden md:grid-cols-2">
        <div className="p-7 sm:p-10">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            Your Accepted account
          </h2>
          <LoginCard />
        </div>
        <div className="flex flex-col justify-center border-t border-line bg-inset p-7 sm:p-10 md:border-l md:border-t-0">
          <span className="empty-symbol">
            <Sparkles size={23} />
          </span>
          <p className="eyebrow">Your practice history</p>
          <h2 className="mt-4 font-display text-3xl font-normal leading-tight">
            See what you tried.
            <br />
            Know what to practise next.
          </h2>
          <ul className="mt-6 space-y-4">
            {[
              "Focused practice for supplemental applications",
              "Clear, specific feedback from Nova",
              "A place to see your progress over time",
            ].map((item) => (
              <li
                key={item}
                className="flex gap-3 text-xs leading-6 text-secondary"
              >
                <Check size={15} className="mt-1 text-accent" />
                {item}
              </li>
            ))}
          </ul>
          <p className="fine-print mt-6">
            Your strongest answers come from your own experiences. We help you
            find the words.
          </p>
        </div>
      </section>
    </div>
  );
}
