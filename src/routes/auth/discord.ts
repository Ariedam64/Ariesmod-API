import type { Application, Request, Response } from "express";
import { query } from "../../db";
import crypto from "crypto";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

export function registerDiscordAuthRoutes(app: Application): void {
  // Route pour initier l'auth Discord (optionnel, le client peut construire l'URL lui-même)
  app.get("/auth/discord/login", (_req: Request, res: Response) => {
    if (!DISCORD_CLIENT_ID || !DISCORD_REDIRECT_URI) {
      return res.status(500).send("Discord OAuth not configured");
    }

    const authUrl =
      `https://discord.com/api/oauth2/authorize?` +
      `client_id=${DISCORD_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=identify`;

    res.redirect(authUrl);
  });

  // Route callback Discord (c'est ici que Discord redirige après autorisation)
  app.get("/auth/discord/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI) {
      return res.status(500).send("Discord OAuth not configured");
    }

    try {
      // Étape 1: Échanger le code contre un access token
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: DISCORD_REDIRECT_URI,
        }),
      });

      const tokenData: any = await tokenResponse.json();

      if (!tokenData.access_token) {
        console.error("Failed to get access token:", tokenData);
        return res.status(500).send("Failed to obtain Discord access token");
      }

      // Étape 2: Récupérer les infos du user Discord
      const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userData: any = await userResponse.json();
      const discordId = userData.id;
      const discordUsername = userData.username;
      const discordAvatar = userData.avatar;

      if (!discordId) {
        return res.status(500).send("Failed to retrieve Discord user info");
      }

      // Étape 3: Vérifier si le joueur existe et a déjà une API key
      let apiKey: string | null = null;

      const existingPlayer = await query(
        "SELECT api_key FROM players WHERE id = $1",
        [discordId]
      );

      if (existingPlayer.rows.length > 0 && existingPlayer.rows[0].api_key) {
        // Le joueur a déjà une clé
        apiKey = existingPlayer.rows[0].api_key;
      } else {
        // Générer une nouvelle clé
        apiKey = crypto.randomBytes(32).toString("hex");

        // Construire l'avatar URL Discord si disponible
        let avatarUrl: string | null = null;
        if (discordAvatar) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png`;
        }

        // Sauvegarder ou mettre à jour le joueur avec la clé
        await query(
          `INSERT INTO players (id, name, avatar_url, api_key, created_at, has_mod_installed)
           VALUES ($1, $2, $3, $4, NOW(), false)
           ON CONFLICT (id) DO UPDATE
           SET api_key = $4,
               name = COALESCE(players.name, $2),
               avatar_url = COALESCE(players.avatar_url, $3)`,
          [discordId, discordUsername, avatarUrl, apiKey]
        );
      }

      // Étape 4: Afficher la page de succès avec la clé
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Authentication Successful - Aries Mod</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }

            .container {
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              max-width: 600px;
              width: 100%;
              padding: 40px;
              text-align: center;
            }

            .success-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }

            h1 {
              color: #2d3748;
              font-size: 28px;
              margin-bottom: 10px;
            }

            .username {
              color: #667eea;
              font-weight: 600;
              font-size: 20px;
              margin-bottom: 30px;
            }

            .info {
              background: #f7fafc;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            }

            .info p {
              color: #4a5568;
              margin-bottom: 15px;
              font-size: 14px;
            }

            .key-container {
              background: #2d3748;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              position: relative;
            }

            .key {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              color: #48bb78;
              word-break: break-all;
              line-height: 1.6;
            }

            .copy-btn {
              background: #667eea;
              color: white;
              border: none;
              border-radius: 8px;
              padding: 12px 30px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              margin-top: 10px;
            }

            .copy-btn:hover {
              background: #5568d3;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            .copy-btn:active {
              transform: translateY(0);
            }

            .footer {
              margin-top: 30px;
              color: #718096;
              font-size: 14px;
            }

            .copied-toast {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #48bb78;
              color: white;
              padding: 16px 24px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              display: none;
              font-weight: 600;
              animation: slideIn 0.3s ease;
            }

            @keyframes slideIn {
              from {
                transform: translateX(400px);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }

            .copied-toast.show {
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>Authentication Successful!</h1>
            <p class="username">Hello ${discordUsername}</p>

            <div class="info">
              <p><strong>Your Aries Mod API Key:</strong></p>
              <div class="key-container">
                <div class="key" id="apiKey">${apiKey}</div>
              </div>
              <button class="copy-btn" onclick="copyKey()">📋 Copy Key</button>
            </div>

            <p class="footer">
              Copy this key and paste it into the mod settings.<br>
              You can close this window after copying the key.
            </p>
          </div>

          <div class="copied-toast" id="toast">
            ✓ Key copied to clipboard!
          </div>

          <script>
            // Auto-envoyer la clé au parent window (si popup)
            if (window.opener) {
              window.opener.postMessage({
                type: 'aries_discord_auth',
                apiKey: '${apiKey}',
                discordId: '${discordId}',
                discordUsername: '${discordUsername}'
              }, '*');
            }

            function copyKey() {
              const key = document.getElementById('apiKey').textContent;
              navigator.clipboard.writeText(key).then(() => {
                const toast = document.getElementById('toast');
                toast.classList.add('show');
                setTimeout(() => {
                  toast.classList.remove('show');
                }, 3000);
              });
            }

            // Auto-close après 30 secondes si c'est un popup
            if (window.opener) {
              setTimeout(() => {
                window.close();
              }, 30000);
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Discord auth error:", error);
      res.status(500).send("An error occurred during Discord authentication");
    }
  });
}
