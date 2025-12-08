type SectionKey =
  | "profile"
  | "garden"
  | "inventory"
  | "stats"
  | "activityLog"
  | "journal"
  | "room";

export function parseSections(raw: unknown): Set<SectionKey> | null {
  if (!raw) return null;

  let list: string[] = [];

  if (Array.isArray(raw)) {
    list = raw.map(String);
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr)) {
          list = arr.map(String);
        } else {
          list = [raw];
        }
      } catch {
        list = raw.split(",");
      }
    } else {
      list = raw.split(",");
    }
  } else {
    return null;
  }

  const normalized = list
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase());

  if (!normalized.length) return null;

  const set = new Set<SectionKey>();

  for (const s of normalized) {
    if (s === "profile") set.add("profile");
    else if (s === "garden") set.add("garden");
    else if (s === "inventory") set.add("inventory");
    else if (s === "stats") set.add("stats");
    else if (s === "activitylog" || s === "activity_log")
      set.add("activityLog");
    else if (s === "journal") set.add("journal");
    else if (s === "room") set.add("room");
  }

  return set.size ? set : null;
}