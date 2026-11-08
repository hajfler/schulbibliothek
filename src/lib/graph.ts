/**
 * Microsoft Graph mit Anwendungsberechtigungen (Client-Credentials-Flow) über die
 * bestehende Azure-App-Registrierung (AZURE_AD_*). Benötigt in Entra die
 * Anwendungsberechtigung «GroupMember.Read.All» (oder «Group.Read.All» plus
 * «User.Read.All») mit erteilter Admin-Einwilligung.
 */

const GRAPH = "https://graph.microsoft.com/v1.0";

export class GraphError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

export interface GraphGroup {
  id: string;
  displayName: string;
  description: string | null;
  mail: string | null;
}

export interface GraphUser {
  id: string;
  displayName: string | null;
  mail: string | null;
  userPrincipalName: string | null;
  accountEnabled: boolean | null;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const tenant = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) {
    throw new GraphError("Azure-Konfiguration unvollständig (AZURE_AD_*)", 500, "config");
  }

  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new GraphError(body.error_description ?? "Token-Anfrage fehlgeschlagen", res.status, body.error);
  }

  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

async function graphGet<T>(url: string, extraHeaders: Record<string, string> = {}): Promise<T> {
  const token = await getAppToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, ...extraHeaders },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const code = body?.error?.code as string | undefined;
    const message = body?.error?.message ?? `Graph-Anfrage fehlgeschlagen (${res.status})`;
    throw new GraphError(message, res.status, code);
  }
  return res.json();
}

/** Alle Seiten einer Graph-Collection einsammeln. */
async function graphGetAll<T>(url: string, extraHeaders: Record<string, string> = {}): Promise<T[]> {
  const items: T[] = [];
  let next: string | null = url;
  while (next) {
    const page: { value: T[]; "@odata.nextLink"?: string } = await graphGet(next, extraHeaders);
    items.push(...page.value);
    next = page["@odata.nextLink"] ?? null;
  }
  return items;
}

/** Gruppen suchen: Anzeigename oder Beschreibung enthält den Suchbegriff (lokal gefiltert, ohne Gross-/Kleinschreibung). */
export async function searchGroups(search: string): Promise<GraphGroup[]> {
  // Kein $orderby: Graph verlangt dafür ConsistencyLevel+$count (Advanced Query), sortiert wird lokal
  const params = new URLSearchParams({
    $select: "id,displayName,description,mail",
    $top: "999",
  });
  const groups = await graphGetAll<GraphGroup>(`${GRAPH}/groups?${params.toString()}`);
  const term = search.trim().toLowerCase();
  return groups
    .filter((g) => !term || `${g.displayName ?? ""} ${g.description ?? ""}`.toLowerCase().includes(term))
    .sort((a, b) => (a.displayName ?? "").localeCompare(b.displayName ?? "", "de"))
    .map((g) => ({
      id: g.id,
      displayName: g.displayName,
      description: g.description ?? null,
      mail: g.mail ?? null,
    }));
}

/** Benutzer-Mitglieder einer Gruppe (transitiv, also inkl. verschachtelter Gruppen). */
export async function getGroupUserMembers(groupId: string): Promise<GraphUser[]> {
  const params = new URLSearchParams({
    $select: "id,displayName,mail,userPrincipalName,accountEnabled",
    $top: "999",
  });
  const users = await graphGetAll<GraphUser>(
    `${GRAPH}/groups/${encodeURIComponent(groupId)}/transitiveMembers/microsoft.graph.user?${params.toString()}`,
    { ConsistencyLevel: "eventual" }
  );
  return users.map((u) => ({
    id: u.id,
    displayName: u.displayName ?? null,
    mail: u.mail ?? null,
    userPrincipalName: u.userPrincipalName ?? null,
    accountEnabled: u.accountEnabled ?? null,
  }));
}

/** Verständliche Meldung für die häufigsten Graph-Fehler. */
export function describeGraphError(err: unknown): { message: string; hint?: string; status: number } {
  if (err instanceof GraphError) {
    if (err.status === 403 || err.code === "Authorization_RequestDenied") {
      return {
        status: 403,
        message: "Microsoft Graph verweigert den Zugriff.",
        hint:
          "In Entra ID → App-Registrierungen → diese App → API-Berechtigungen die Anwendungsberechtigung " +
          "«GroupMember.Read.All» hinzufügen und die Administratoreinwilligung erteilen. Danach erneut versuchen.",
      };
    }
    if (err.code === "config") {
      return { status: 500, message: err.message };
    }
    return { status: err.status >= 400 && err.status < 600 ? err.status : 502, message: err.message };
  }
  return { status: 502, message: "Verbindung zu Microsoft Graph fehlgeschlagen." };
}
