// Hanya untuk server: memakai fs, jangan diimpor komponen client.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSeedState } from "../seed";
import type { StoreState } from "../types";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

let pending: Promise<unknown> = Promise.resolve();
let tempCounter = 0;

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = pending.then(task, task);
  pending = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function isStoreState(value: unknown): value is StoreState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<StoreState>;
  return (
    candidate.version === 2 &&
    Array.isArray(candidate.applications) &&
    typeof candidate.nextId === "number"
  );
}

async function writeState(state: StoreState): Promise<void> {
  await mkdir(DB_DIR, { recursive: true });
  tempCounter += 1;
  const tempPath = `${DB_PATH}.${process.pid}.${tempCounter}.tmp`;
  await writeFile(tempPath, JSON.stringify(state, null, 2), "utf8");
  await rename(tempPath, DB_PATH);
}

async function loadState(): Promise<StoreState> {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (isStoreState(parsed)) return parsed;
  } catch {
    // File belum ada atau rusak: seed mengisi ulang penyimpanan.
  }

  const seeded = createSeedState();
  await writeState(seeded);
  return seeded;
}

export function readState(): Promise<StoreState> {
  return enqueue(loadState);
}

export function updateState<T>(mutator: (state: StoreState) => T): Promise<T> {
  return enqueue(async () => {
    const state = await loadState();
    const result = mutator(state);
    await writeState(state);
    return result;
  });
}

export function resetState(): Promise<StoreState> {
  return enqueue(async () => {
    const state = createSeedState();
    await writeState(state);
    return state;
  });
}
