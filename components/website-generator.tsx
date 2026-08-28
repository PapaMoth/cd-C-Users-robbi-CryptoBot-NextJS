"use client";

import { useState } from "react";
import { Globe, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type WebsiteBrief = {
  headline: string;
  subheadline: string;
  cta: string;
  features: string[];
};

function createWebsiteBrief({ business, audience, goal }: { business: string; audience: string; goal: string }): WebsiteBrief {
  return {
    headline: `${business} for ${audience}`,
    subheadline: `A fast, modern website designed to help you ${goal.toLowerCase()}.`,
    cta: `Start ${goal}`,
    features: [
      "Hero section with a clear value proposition",
      "Benefits grid with proof-driven copy",
      "Social proof and trust section",
      "Sticky CTA for better conversion",
    ],
  };
}

export function WebsiteGenerator() {
  const [business, setBusiness] = useState("AI Coach");
  const [audience, setAudience] = useState("freelancers");
  const [goal, setGoal] = useState("get more leads");
  const [brief, setBrief] = useState<WebsiteBrief | null>(null);

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Website Generator
        </CardTitle>
        <CardDescription className="text-neutral-400">
          Quickly generate a website brief for your next landing page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            placeholder="Business type"
            className="border-white/10 bg-neutral-950 text-white"
          />
          <Input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Target audience"
            className="border-white/10 bg-neutral-950 text-white"
          />
          <Input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Primary goal"
            className="border-white/10 bg-neutral-950 text-white"
          />
        </div>

        <Button className="w-full" onClick={() => setBrief(createWebsiteBrief({ business, audience, goal }))}>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Website Brief
        </Button>

        {brief && (
          <div className="space-y-3 rounded-lg border border-white/10 p-4 text-sm">
            <p className="text-lg font-semibold">{brief.headline}</p>
            <p className="text-neutral-300">{brief.subheadline}</p>
            <p>
              <span className="text-neutral-400">CTA:</span> {brief.cta}
            </p>
            <ul className="list-disc pl-5">
              {brief.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
