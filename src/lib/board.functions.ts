import { createServerFn } from "@tanstack/react-start";
import { STORE_MAP } from "@/lib/stores";

export type BoardPost = {
  id: number;
  kind: "comment" | "wish";
  body: string;
  handle: string;
  storeId: string;
  storeName: string;
  createdAt: string;
};

function clean(text: string, max: number) {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

function toPost(row: {
  id: number;
  kind: string;
  body: string;
  handle: string;
  store_id: string | null;
  created_at: string;
}): BoardPost | null {
  const storeId = row.store_id ?? "";
  const store = STORE_MAP[storeId];
  if (!store) return null;
  return {
    id: row.id,
    kind: row.kind === "wish" ? "wish" : "comment",
    body: row.body,
    handle: row.handle,
    storeId: store.id,
    storeName: store.name,
    createdAt: row.created_at,
  };
}

export const listBoard = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{
    id: number;
    kind: string;
    body: string;
    handle: string;
    store_id: string | null;
    created_at: string;
  }>`select id, kind, body, handle, store_id, created_at from board_posts where store_id is not null order by created_at desc limit 80`;
  return rows.map(toPost).filter((row): row is BoardPost => Boolean(row));
});

export const addBoardPost = createServerFn({ method: "POST" })
  .validator((input: { kind: "comment" | "wish"; body: string; handle?: string; storeId: string }) => input)
  .handler(async ({ data }) => {
    const store = STORE_MAP[data.storeId];
    if (!store) return { ok: false as const, error: "Pick a store you actually shop." };
    const body = clean(data.body ?? "", 280);
    if (body.length < 4) return { ok: false as const, error: "Say a little more — four characters at least." };
    const handle = clean(data.handle || "Neighbor", 24) || "Neighbor";
    const kind = data.kind === "wish" ? "wish" : "comment";
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      kind: string;
      body: string;
      handle: string;
      store_id: string | null;
      created_at: string;
    }>`insert into board_posts (kind, body, handle, store_id) values (${kind}, ${body}, ${handle}, ${store.id}) returning id, kind, body, handle, store_id, created_at`;
    const post = rows[0] ? toPost(rows[0]) : null;
    if (!post) return { ok: false as const, error: "Could not post just then." };
    return { ok: true as const, post };
  });
