"use client";

import { useState } from "react";
import { WebsiteGenerator } from "@/components/website-generator";
import { Chat } from "@/components/chat";
import { CodeGenerator } from "@/components/code-generator";

export function PlatformStudio() {
  const [tab, setTab] = useState<"website" | "reels" | "code">("website");

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
                AI Creator Platform
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Build websites and viral content in one place
              </h1>
              <p className="mt-3 max-w-2xl text-neutral-300">
                One side builds sites. The other side builds attention.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setTab("website")}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                  tab === "website"
                    ? "bg-cyan-400 text-neutral-950"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                Website Builder
              </button>
              <button
                type="button"
                onClick={() => setTab("reels")}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                  tab === "reels"
                    ? "bg-cyan-400 text-neutral-950"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                Reel Generator
              </button>
              <button
                type="button"
                onClick={() => setTab("code")}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                  tab === "code"
                    ? "bg-cyan-400 text-neutral-950"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                Code Generator
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-2">
          {tab === "website" ? <WebsiteGenerator /> : tab === "reels" ? <Chat /> : <CodeGenerator />}
        </div>
      </div>
    </main>
  );
}
