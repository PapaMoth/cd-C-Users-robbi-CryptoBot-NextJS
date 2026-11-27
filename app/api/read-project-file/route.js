import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const ALLOWED_PREFIXES = ["app/", "components/", "lib/", "styles/"];
const ALLOWED_EXACT = ["app/page.tsx", "app/layout.tsx", "app/globals.css"];

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

function isPathContained(root, target) {
  const relative = path.relative(root, target);
  return !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { path: filePath } = body || {};

    if (!isSafeRelativePath(filePath) || !isAllowedProjectPath(filePath)) {
      return NextResponse.json(
        { error: "File path is not allowed." },
        { status: 400 }
      );
    }

    const projectRootResolved = await fs.realpath(process.cwd());
    const fullPath = path.resolve(projectRootResolved, filePath);
    const relativeFullPath = path.relative(projectRootResolved, fullPath);

    if (
      relativeFullPath === ".." ||
      relativeFullPath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativeFullPath)
    ) {
      return NextResponse.json(
        { error: "File path is not allowed." },
        { status: 400 }
      );
    }

    try {
      const resolvedFullPath = await fs.realpath(fullPath);
      if (!isPathContained(projectRootResolved, resolvedFullPath)) {
        return NextResponse.json(
          { error: "File path is not allowed." },
          { status: 400 }
        );
      }

      const content = await fs.readFile(resolvedFullPath, "utf8");
      return NextResponse.json({
        ok: true,
        exists: true,
        path: filePath,
        content,
      });
    } catch {
      return NextResponse.json({
        ok: true,
        exists: false,
        path: filePath,
        content: "",
      });
    }
  } catch (error) {
    console.error("read-project-file route error:", error);

    return NextResponse.json(
      { error: "Failed to read project file." },
      { status: 500 }
    );
  }
}
