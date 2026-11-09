import { Suspense, type ReactNode } from "react";
import Nav from "./nav";
import Footer from "./footer";
import { LoadingState } from "./ui";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Nav />
      <div className="shell-content">
        <main id="main-content" className="main-content">
          <Suspense
            fallback={
              <div className="workspace-page">
                <LoadingState title="Opening your next step…" />
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
        <Footer />
      </div>
    </div>
  );
}
