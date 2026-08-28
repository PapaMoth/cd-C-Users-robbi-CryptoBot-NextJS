"use client";

import { useEffect, useMemo, useState } from "react";
import { diffLines } from "diff";
import { Button } from "@/components/ui/button";

type DiffPart = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

type MergeChunk = {
  id: string;
  type: "same" | "change";
  currentText: string;
  generatedText: string;
  choice: "current" | "generated" | "same";
};

type MergeViewerProps = {
  currentContent: string;
  generatedContent: string;
  filePath: string;
  onMergedChange: (merged: string) => void;
};

function buildMergeChunks(currentContent: string, generatedContent: string): MergeChunk[] {
  const parts = diffLines(currentContent, generatedContent);
  const chunks: MergeChunk[] = [];
  let i = 0;
  let counter = 0;

  while (i < parts.length) {
    const part = parts[i] as DiffPart;

    if (!part.added && !part.removed) {
      chunks.push({
        id: `chunk-${counter++}`,
        type: "same",
        currentText: part.value,
        generatedText: part.value,
        choice: "same",
      });
      i += 1;
      continue;
    }

    const removedPart = part.removed ? part : null;
    const addedPart =
      !part.removed && part.added
        ? part
        : parts[i + 1]?.added
        ? (parts[i + 1] as DiffPart)
        : null;

    const currentText = removedPart?.value || "";
    const generatedText =
      part.added && !part.removed
        ? part.value
        : addedPart?.value || "";

    chunks.push({
      id: `chunk-${counter++}`,
      type: "change",
      currentText,
      generatedText,
      choice: "generated",
    });

    if (part.removed && parts[i + 1]?.added) {
      i += 2;
    } else {
      i += 1;
    }
  }

  return chunks;
}

export function MergeViewer({
  currentContent,
  generatedContent,
  filePath,
  onMergedChange,
}: MergeViewerProps) {
  const [chunks, setChunks] = useState<MergeChunk[]>([]);

  useEffect(() => {
    const built = buildMergeChunks(currentContent, generatedContent);
    setChunks(built);
  }, [currentContent, generatedContent, filePath]);

  const mergedContent = useMemo(() => {
    return chunks
      .map((chunk) => {
        if (chunk.type === "same") return chunk.currentText;
        if (chunk.choice === "current") return chunk.currentText;
        return chunk.generatedText;
      })
      .join("");
  }, [chunks]);

  useEffect(() => {
    onMergedChange(mergedContent);
  }, [mergedContent, onMergedChange]);

  const setChoice = (id: string, choice: "current" | "generated") => {
    setChunks((prev) =>
      prev.map((chunk) =>
        chunk.id === id && chunk.type === "change"
          ? { ...chunk, choice }
          : chunk
      )
    );
  };

  const useAllCurrent = () => {
    setChunks((prev) =>
      prev.map((chunk) =>
        chunk.type === "change" ? { ...chunk, choice: "current" } : chunk
      )
    );
  };

  const useAllGenerated = () => {
    setChunks((prev) =>
      prev.map((chunk) =>
        chunk.type === "change" ? { ...chunk, choice: "generated" } : chunk
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={useAllCurrent}>
          Use All Current
        </Button>
        <Button variant="outline" size="sm" onClick={useAllGenerated}>
          Use All Generated
        </Button>
      </div>

      <div className="space-y-4">
        {chunks.map((chunk, index) => {
          if (chunk.type === "same") {
            return (
              <div
                key={chunk.id}
                className="rounded-xl border border-white/10 bg-neutral-950 p-3"
              >
                <div className="mb-2 text-xs text-neutral-500">
                  Unchanged block {index + 1}
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-neutral-400">
                  <code>{chunk.currentText || " "}</code>
                </pre>
              </div>
            );
          }

          return (
            <div
              key={chunk.id}
              className="rounded-xl border border-cyan-500/20 bg-white/5 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-cyan-200">
                  Change block {index + 1}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={chunk.choice === "current" ? "default" : "outline"}
                    onClick={() => setChoice(chunk.id, "current")}
                  >
                    Use Current
                  </Button>
                  <Button
                    size="sm"
                    variant={chunk.choice === "generated" ? "default" : "outline"}
                    onClick={() => setChoice(chunk.id, "generated")}
                  >
                    Use Generated
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                  <div className="mb-2 text-xs text-red-200">Current</div>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-red-100">
                    <code>{chunk.currentText || "// nothing here"}</code>
                  </pre>
                </div>

                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <div className="mb-2 text-xs text-emerald-200">Generated</div>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-emerald-100">
                    <code>{chunk.generatedText || "// nothing here"}</code>
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-neutral-950 p-4">
        <div className="mb-2 text-sm text-neutral-400">Merged result</div>
        <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-neutral-200">
          <code>{mergedContent}</code>
        </pre>
      </div>
    </div>
  );
}
