"use client";

import { useMemo, useState } from "react";
import { Sparkles, Video, Mic2, Clapperboard, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Blueprint = {
  title: string;
  hook: string;
  voiceover: string;
  shotList: string[];
  onScreenCaptions: string[];
  hashtags: string;
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Button variant="outline" size="sm" onClick={onCopy}>
      {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function Chat() {
  const [niche, setNiche] = useState("Personal Finance");
  const [duration, setDuration] = useState("30s");
  const [tone, setTone] = useState("Educational");
  const [audience, setAudience] = useState("new creators");
  const [cta, setCta] = useState("Follow for Part 2");

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canGenerate = useMemo(() => {
    return [niche, duration, tone, audience, cta].every(
      (v) => v.trim().length > 0
    );
  }, [niche, duration, tone, audience, cta]);

  const generateBlueprint = async () => {
    if (!canGenerate || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-reel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          niche,
          duration,
          tone,
          audience,
          cta,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate reel blueprint.");
      }

      setBlueprint(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something broke.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="text-center space-y-3">
          <p className="inline-flex items-center border px-3 py-1 rounded-full text-xs">
            <Sparkles className="mr-1 h-3 w-3" />
            AI Reel Generator
          </p>

          <h1 className="text-4xl font-bold">
            Build viral faceless reels
          </h1>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>Customize your reel</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Niche" />
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration" />
              <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="Tone" />
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Audience" />
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="CTA" />

              <Button className="w-full" onClick={generateBlueprint} disabled={!canGenerate || loading}>
                <Video className="mr-2 h-4 w-4" />
                {loading ? "Generating..." : "Generate"}
              </Button>

              {error && <p className="text-red-400">{error}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clapperboard className="h-4 w-4" />
                Output
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {!blueprint ? (
                <p>No output yet</p>
              ) : (
                <>
                  <div>
                    <strong>Title:</strong> {blueprint.title}
                  </div>

                  <div>
                    <strong>Hook:</strong> {blueprint.hook}
                  </div>

                  <div>
                    <strong className="inline-flex items-center gap-1">
                      <Mic2 className="h-4 w-4" />
                      Voiceover:
                    </strong>
                    <CopyButton value={blueprint.voiceover} />
                    <p>{blueprint.voiceover}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {blueprint && (
          <section className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Shots</CardTitle>
              </CardHeader>
              <CardContent>
                <ul>
                  {blueprint.shotList.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Captions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul>
                  {blueprint.onScreenCaptions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>

                <div>
                  <strong>Hashtags:</strong>
                  <CopyButton value={blueprint.hashtags} />
                  <p>{blueprint.hashtags}</p>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}
