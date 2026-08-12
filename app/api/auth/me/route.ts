import { getSessionUser, userPayload } from "../_lib";
import { getAdminSession } from "../../admin/_lib";

export async function GET(request: Request) {
  try {
    if (await getAdminSession(request)) {
      return Response.json({ user: null, admin: true }, { headers: { "Cache-Control": "no-store" } });
    }
    const user = await getSessionUser(request);
    return Response.json({ user: user ? userPayload(user) : null, admin: false }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ user: null, admin: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
