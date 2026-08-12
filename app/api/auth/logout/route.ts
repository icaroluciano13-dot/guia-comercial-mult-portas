import { clearedSessionCookie, deleteSession } from "../_lib";
import { clearedAdminCookie, deleteAdminSession } from "../../admin/_lib";

export async function POST(request: Request) {
  try {
    await deleteSession(request);
    await deleteAdminSession(request);
  } catch {
    // The browser session is still cleared even when the database is unavailable.
  }
  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.append("Set-Cookie", clearedSessionCookie(request));
  headers.append("Set-Cookie", clearedAdminCookie(request));
  return Response.json({ ok: true }, { headers });
}
