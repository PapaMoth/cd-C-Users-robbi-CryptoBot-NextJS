"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import {
  Code2,
  Copy,
  Check,
  FileCode2,
  Wand2,
  Download,
  Save,
  Hammer,
  GitCompare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MergeViewer } from "@/components/merge-viewer";

type GeneratedFile = {
  path: string;
  content: string;
};

type CodeResponse = {
  projectName: string;
  summary: string;
  files: GeneratedFile[];
};

type WriteResponse = {
  ok: boolean;
  projectName: string;
  outputRoot: string;
  writtenCount: number;
  files: { path: string; fullPath: string }[];
};

type ApplyResponse = {
  ok: boolean;
  appliedCount: number;
  skippedCount: number;
  backupRoot: string;
  applied: { path: string; targetPath: string }[];
  skipped: { path: string; reason: string }[];
  backedUp: { path: string; backupPath: string }[];
};

type ReadFileResponse = {
  ok: boolean;
  exists: boolean;
  path: string;
  content: string;
};

function slugify(value: string) {
  return (value || "ai-app")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Button variant="outline" size="sm" onClick={onCopy}>
      {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function CodeGenerator() {
  const [idea, setIdea] = useState("AI app that generates websites and viral reels");
  const [appType, setAppType] = useState("Next.js SaaS");
  const [style, setStyle] = useState("Modern dark");
  const [features, setFeatures] = useState(
    "Landing page, pricing, dashboard, API form, result cards"
  );

  const [result, setResult] = useState<CodeResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [currentProjectFile, setCurrentProjectFile] = useState<string>("");
  const [mergedContent, setMergedContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [writingFiles, setWritingFiles] = useState(false);
  const [applyingFiles, setApplyingFiles] = useState(false);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [writeResult, setWriteResult] = useState<WriteResponse | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyResponse | null>(null);
  const [error, setError] = useState("");

  const canGenerate = useMemo(() => {
    return [idea, appType, style, features].every((v) => v.trim().length > 0);
  }, [idea, appType, style, features]);

  const activeFile = useMemo(() => {
    if (!result?.files?.length) return null;
    return result.files.find((file) => file.path === selectedFile) || result.files[0];
  }, [result, selectedFile]);

  const selectedFiles = useMemo(() => {
    if (!result?.files?.length) return [];
    return result.files
      .filter((file) => selectedPaths.includes(file.path))
      .map((file) => {
        if (activeFile && file.path === activeFile.path && mergedContent) {
          return { ...file, content: mergedContent };
        }
        return file;
      });
  }, [result, selectedPaths, activeFile, mergedContent]);

  const handleGenerate = async () => {
    if (!canGenerate || loading) return;

    setLoading(true);
    setError("");
    setWriteResult(null);
    setApplyResult(null);
    setCurrentProjectFile("");
    setMergedContent("");

    try {
      const res = await fetch("/api/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea,
          appType,
          style,
          features,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate code.");
      }

      setResult(data);
      setSelectedFile(data.files?.[0]?.path || "");
      setSelectedPaths((data.files || []).map((file: GeneratedFile) => file.path));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something broke while generating code.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!result?.files?.length || downloadingZip) return;

    setDownloadingZip(true);
    setError("");

    try {
      const zip = new JSZip();
      const rootFolder = zip.folder(slugify(result.projectName || idea) || "ai-app");

      if (!rootFolder) {
        throw new Error("Failed to create zip folder.");
      }

      for (const file of result.files) {
        if (!file.path || typeof file.content !== "string") continue;
        rootFolder.file(file.path, file.content);
      }

      rootFolder.file(
        "README.md",
        `# ${result.projectName}

${result.summary}

## Included files
${result.files.map((file) => `- ${file.path}`).join("\n")}
`
      );

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `${slugify(result.projectName || idea) || "ai-app"}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to build zip download.";
      setError(message);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleWriteFiles = async () => {
    if (!result?.files?.length || writingFiles) return;

    setWritingFiles(true);
    setError("");
    setWriteResult(null);

    try {
      const res = await fetch("/api/write-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: result.projectName || idea,
          files: result.files,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to write files.");
      }

      setWriteResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to write files.";
      setError(message);
    } finally {
      setWritingFiles(false);
    }
  };

  const handleApplySelected = async () => {
    if (!selectedFiles.length || applyingFiles) return;

    setApplyingFiles(true);
    setError("");
    setApplyResult(null);

    try {
      const res = await fetch("/api/apply-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: selectedFiles,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to apply selected files.");
      }

      setApplyResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to apply files.";
      setError(message);
    } finally {
      setApplyingFiles(false);
    }
  };

  const handleLoadCurrentFile = async () => {
    if (!activeFile?.path || loadingDiff) return;

    setLoadingDiff(true);
    setError("");
    setCurrentProjectFile("");
    setMergedContent("");

    try {
      const res = await fetch("/api/read-project-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: activeFile.path,
        }),
      });

      const data: ReadFileResponse | { error: string } = await res.json();

      if (!res.ok || !("ok" in data && data.ok)) {
        throw new Error(("error" in data && data.error) || "Failed to read current project file.");
      }

      const currentContent = data.exists ? data.content : "";
      setCurrentProjectFile(currentContent);
      setMergedContent(activeFile.content);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load current file.";
      setError(message);
    } finally {
      setLoadingDiff(false);
    }
  };

  // Toggle per-file selection for selective apply.
  const toggleSelectedPath = (filePath: string) => {
    setSelectedPaths((prev) =>
      prev.includes(filePath)
        ? prev.filter((path) => path !== filePath)
        : [...prev, filePath]
    );
  };

  const selectAll = () => {
    if (!result?.files?.length) return;
    setSelectedPaths(result.files.map((file) => file.path));
  };

  const clearSelection = () => {
    setSelectedPaths([]);
  };

  return (
    <main className="min-h-screen bg-transparent px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-3 text-center">
          <p className="inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-xs font-medium">
            <Code2 className="mr-1 h-3.5 w-3.5" />
            AI Code Generator
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Generate app files from an idea
          </h1>
          <p className="mx-auto max-w-2xl text-neutral-400">
            Review current vs generated content, merge block-by-block, then apply only what you want.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Build Inputs</CardTitle>
              <CardDescription className="text-neutral-400">
                Describe the app and generate starter project files.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">App idea</label>
                <Input
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="What are you building?"
                  className="border-white/10 bg-neutral-950 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">App type</label>
                <Input
                  value={appType}
                  onChange={(e) => setAppType(e.target.value)}
                  placeholder="Next.js app, landing page, dashboard..."
                  className="border-white/10 bg-neutral-950 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Visual style</label>
                <Input
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="Modern dark, glassmorphism..."
                  className="border-white/10 bg-neutral-950 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Core features</label>
                <Input
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Forms, auth, pricing, results..."
                  className="border-white/10 bg-neutral-950 text-white"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Button
                  className="w-full"
                  disabled={!canGenerate || loading}
                  onClick={handleGenerate}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  {loading ? "Generating..." : "Generate"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!result?.files?.length || downloadingZip}
                  onClick={handleDownloadZip}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingZip ? "Building..." : "Zip"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!result?.files?.length || writingFiles}
                  onClick={handleWriteFiles}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {writingFiles ? "Writing..." : "Write"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!activeFile || loadingDiff}
                  onClick={handleLoadCurrentFile}
                >
                  <GitCompare className="mr-2 h-4 w-4" />
                  {loadingDiff ? "Loading..." : "Merge View"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!selectedFiles.length || applyingFiles}
                  onClick={handleApplySelected}
                >
                  <Hammer className="mr-2 h-4 w-4" />
                  {applyingFiles ? "Applying..." : `Apply (${selectedFiles.length})`}
                </Button>
              </div>

              {result?.files?.length ? (
                <div className="rounded-lg border border-white/10 bg-neutral-950/60 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm text-neutral-300">
                      Select files to apply to the live project
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearSelection}>
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {result.files.map((file) => (
                      <label
                        key={file.path}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                      >
                        <span className="inline-flex items-center text-neutral-200">
                          <input
                            type="checkbox"
                            checked={selectedPaths.includes(file.path)}
                            onChange={() => toggleSelectedPath(file.path)}
                            className="mr-3 h-4 w-4"
                          />
                          {file.path}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(file.path);
                            setCurrentProjectFile("");
                            setMergedContent("");
                          }}
                          className="text-cyan-300 hover:text-cyan-200"
                        >
                          Preview
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {writeResult?.ok ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  Wrote {writeResult.writtenCount} files to:
                  <div className="mt-1 break-all font-mono text-xs">
                    {writeResult.outputRoot}
                  </div>
                </div>
              ) : null}

              {applyResult?.ok ? (
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3 text-sm text-cyan-200">
                  Applied {applyResult.appliedCount} selected files.
                  <div className="mt-1 text-xs text-cyan-100">Backups stored in:</div>
                  <div className="mt-1 break-all font-mono text-xs">
                    {applyResult.backupRoot}
                  </div>
                  {applyResult.skippedCount > 0 ? (
                    <div className="mt-2 text-xs text-yellow-200">
                      Skipped {applyResult.skippedCount} file(s).
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle>Generated Output</CardTitle>
                <CardDescription className="text-neutral-400">
                  {result ? result.summary : "No files generated yet."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!result ? (
                  <p className="text-sm text-neutral-400">
                    Generate code to preview starter files here.
                  </p>
                ) : (
                  <>
                    <div className="rounded-lg border border-white/10 p-3">
                      <div className="text-xs text-neutral-400">Project</div>
                      <div className="font-medium">{result.projectName}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {result.files.map((file) => (
                        <button
                          key={file.path}
                          type="button"
                          onClick={() => {
                            setSelectedFile(file.path);
                            setCurrentProjectFile("");
                            setMergedContent("");
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm transition ${
                            activeFile?.path === file.path
                              ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                              : "border-white/10 bg-neutral-950 text-neutral-300 hover:bg-white/10"
                          }`}
                        >
                          <span className="inline-flex items-center">
                            <FileCode2 className="mr-2 h-4 w-4" />
                            {file.path}
                          </span>
                        </button>
                      ))}
                    </div>

                    {activeFile ? (
                      <div className="rounded-xl border border-white/10 bg-neutral-950 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="text-sm text-neutral-400">{activeFile.path}</div>
                          <CopyButton value={activeFile.content} />
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-neutral-200">
                          <code>{activeFile.content}</code>
                        </pre>
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>

            {activeFile ? (
              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader>
                  <CardTitle>Side-by-Side Merge View</CardTitle>
                  <CardDescription className="text-neutral-400">
                    Load the current file, then choose current or generated for each changed block.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!currentProjectFile && !mergedContent ? (
                    <p className="text-sm text-neutral-400">
                      Pick a file and click <strong>Merge View</strong> to load the current project version.
                    </p>
                  ) : (
                    <MergeViewer
                      currentContent={currentProjectFile}
                      generatedContent={activeFile.content}
                      filePath={activeFile.path}
                      onMergedChange={setMergedContent}
                    />
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
