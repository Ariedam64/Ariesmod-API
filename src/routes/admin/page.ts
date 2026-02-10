import type { Application, Request, Response } from "express";
import { adminAuth } from "./common";
import { getStyles } from "./page/styles";
import { getLayout } from "./page/layout";
import { getCoreScript } from "./page/scripts/core";
import { getComponentsScript } from "./page/scripts/components";
import { getDashboardScript } from "./page/scripts/dashboard";
import { getTablesScript } from "./page/scripts/tables";
import { getSqlScript } from "./page/scripts/sql";
import { getSearchScript } from "./page/scripts/search";
import { getPlayerDetailScript } from "./page/scripts/playerDetail";
import { getRoomDetailScript } from "./page/scripts/roomDetail";

let _cachedHtml: string | null = null;

function buildAdminHtml(): string {
  if (_cachedHtml) return _cachedHtml;

  _cachedHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Arie's Mod – Admin</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  ${getStyles()}
</head>
<body>
  ${getLayout()}
  <script>
  (function() {
    ${getCoreScript()}
    ${getComponentsScript()}
    ${getDashboardScript()}
    ${getTablesScript()}
    ${getSqlScript()}
    ${getSearchScript()}
    ${getPlayerDetailScript()}
    ${getRoomDetailScript()}

    rt();
  })();
  </script>
</body>
</html>`;

  return _cachedHtml;
}

export function registerAdminPageRoutes(app: Application): void {
  app.get("/admin", adminAuth, (_req: Request, res: Response) => {
    res.type("html").send(buildAdminHtml());
  });
}
