import type { Request, Response, NextFunction } from "express";
import { query } from "../db";

// Étendre le type Request pour inclure authenticatedPlayerId
declare global {
  namespace Express {
    interface Request {
      authenticatedPlayerId?: string;
    }
  }
}

/**
 * Middleware pour vérifier qu'une requête contient un token API valide
 *
 * Usage:
 *   app.post("/messages/send", requireApiKey, handleSendMessage);
 *
 * Le token doit être fourni dans le header Authorization: Bearer <token>
 * Le playerId est extrait du token et injecté dans req.authenticatedPlayerId
 *
 * ✅ Plus besoin d'envoyer playerId dans le body !
 * ✅ Impossible de se faire passer pour quelqu'un d'autre
 */
export async function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    // Format attendu: "Bearer <token>"
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      res.status(401).json({ error: "Invalid authorization format" });
      return;
    }

    // Récupérer le playerId associé au token
    const result = await query(
      "SELECT id FROM players WHERE api_key = $1",
      [token]
    );

    if (result.rows.length === 0) {
      console.log(`[Auth] No player found for API key: ${token.substring(0, 8)}...`);
      res.status(401).json({ error: "Invalid or expired API key" });
      return;
    }

    // ✅ Extraire le playerId et l'injecter dans req
    const playerId = result.rows[0].id;
    req.authenticatedPlayerId = playerId;

    console.log(`[Auth] Authenticated playerId: ${playerId} (type: ${typeof playerId}, length: ${playerId?.length})`);

    // Token valide, on laisse passer
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
}

/**
 * Middleware optionnel : accepte les requêtes avec OU sans token
 * Utile pour la période de transition
 *
 * Si le token est présent, il est vérifié.
 * Si absent ou invalide, on laisse quand même passer mais on log un warning.
 */
export async function optionalApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const playerId = req.body?.playerId || req.query?.playerId;

    // Si pas de token, on laisse passer (mode permissif)
    if (!authHeader || !playerId) {
      console.warn(`[WARN] Request without API key: ${req.method} ${req.path} from ${playerId || 'unknown'}`);
      next();
      return;
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    // Vérifier le token
    const result = await query(
      "SELECT id FROM players WHERE id = $1 AND api_key = $2",
      [playerId, token]
    );

    if (result.rows.length === 0) {
      console.warn(`[WARN] Invalid API key for player ${playerId}`);
    }

    // On laisse passer quand même (mode permissif)
    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next(); // On laisse passer même en cas d'erreur
  }
}
