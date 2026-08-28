import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const ALLOWED_PREFIXES = [
  "app/",
  "components/",
  "lib/",
  "styles/",
];

const ALLOWED_EXACT = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/globals.css",
];

function isSafeRelativePath(filePath) {
  if (!filePath || typeof filePath !== "string") return false;
  if (path.isAbsolute(filePath)) return false;
  if (filePath.includes("..")) return false;
  if (filePath.includes("\0")) return false;
  return true;
}

function isAllowedProjectPath(filePath) {
  if (ALLOWED_EXACT.includes(filePath)) return true;
  return ALLOWED_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function timestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { files = [] } = body || {};

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "No files were provided." },
        { status: 400 }
      );
    }

    const projectRoot = process.cwd();
    const backupRoot = path.join(projectRoot, ".ai-backups", timestamp());

    await fs.mkdir(backupRoot, { recursive: true });

    const applied = [];
    const skipped = [];
    const backedUp = [];

    for (const file of files) {
      if (!file || typeof file.path !== "string" || typeof file.content !== "string") {
        skipped.push({
          path: file?.path || "(unknown)",
          reason: "Invalid file payload",
        });
        continue;
      }

      if (!isSafeRelativePath(file.path)) {
        skipped.push({
          path: file.path,
          reason: "Unsafe path rejected",
        });
        continue;
      }

      if (!isAllowedProjectPath(file.path)) {
        skipped.push({
          path: file.path,
          reason: "Path not allowed for direct apply",
        });
        continue;
      }

      const targetPath = path.join(projectRoot, file.path);
      const targetDir = path.dirname(targetPath);

      await fs.mkdir(targetDir, { recursive: true });

      try {
        const existingContent = await fs.readFile(targetPath, "utf8");
        const backupPath = path.join(backupRoot, file.path);
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        await fs.writeFile(backupPath, existingContent, "utf8");
        backedUp.push({
          path: file.path,
          backupPath,
        });
      } catch {
        // file didn’t exist yet, no backup needed
      }

      await fs.writeFile(targetPath, file.content, "utf8");
      applied.push({
        path: file.path,
        targetPath,
      });
    }

    return NextResponse.json({
      ok: true,
      appliedCount: applied.length,
      skippedCount: skipped.length,
      backupRoot,
      applied,
      skipped,
      backedUp,
    });
  } catch (error) {
    console.error("apply-files route error:", error);

    return NextResponse.json(
      { error: "Failed to apply files to project." },
      { status: 500 }
    );
  }
}
