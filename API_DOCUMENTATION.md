# Aries Mod Backend — Documentation API

Documentation destinée à l'intégration côté client. Tous les endpoints sont décrits avec leur méthode HTTP, les paramètres attendus, les réponses retournées et le comportement serveur.

**Base URL :** `http(s)://<host>:4000`

---

## Table des matières

1. [Authentification](#authentification)
2. [Collect State (Envoi de données)](#collect-state)
3. [Players (Joueurs)](#players)
4. [Friends (Amis)](#friends)
5. [Messages (Messages directs)](#messages)
6. [Groups (Groupes)](#groups)
7. [Events (Temps réel)](#events)
8. [Leaderboard (Classements)](#leaderboard)
9. [Codes d'erreur](#codes-derreur)
10. [Statut en ligne](#statut-en-ligne)
11. [Système de confidentialité](#système-de-confidentialité)

---

## Authentification

Toutes les routes protégées nécessitent un header `Authorization` contenant la clé API du joueur :

```
Authorization: Bearer <api_key>
```

La clé API est obtenue via le flux OAuth Discord. Le serveur extrait le token du header, le cherche dans la table `players.api_key` et identifie le joueur associé. Si le token est absent ou invalide, le serveur renvoie `401 Unauthorized`.

### Flux OAuth Discord

Le processus d'obtention de la clé API se fait en deux étapes :

---

### `GET /auth/discord/login`

Lance le flux OAuth Discord. Redirige le navigateur vers la page d'autorisation Discord.

**Auth requise :** Non

**Comportement serveur :**
- Construit l'URL d'autorisation Discord avec le `client_id`, le `redirect_uri` et le scope `identify`
- Redirige le navigateur vers Discord

**Utilisation côté client :**
Ouvrir cette URL dans un navigateur ou une popup. L'utilisateur autorise l'application sur Discord, puis est redirigé vers le callback.

---

### `GET /auth/discord/callback`

Callback OAuth Discord. Appelé automatiquement par Discord après autorisation.

**Auth requise :** Non

**Query params :**

| Param | Type   | Description                     |
|-------|--------|---------------------------------|
| code  | string | Code d'autorisation fourni par Discord |

**Comportement serveur :**
1. Échange le `code` contre un access token Discord
2. Récupère le profil Discord (id, username, avatar)
3. Crée ou met à jour le joueur dans la base de données
4. Génère une clé API aléatoire de 64 caractères hexadécimaux
5. Retourne une page HTML qui affiche la clé et tente de l'envoyer via `window.opener.postMessage`

**Utilisation côté client :**
Si ouvert en popup, écouter le message `postMessage` pour récupérer la clé API automatiquement. Sinon, l'utilisateur la copie manuellement depuis la page affichée.

---

## Collect State

### `POST /collect-state`

Envoie l'état du jeu au serveur. C'est l'endpoint principal appelé périodiquement par le mod pour synchroniser les données du joueur.

**Auth requise :** Oui

**Body (JSON) :**

```json
{
  "playerName": "string",
  "avatar": ["string", "string", "string", "string"],
  "coins": 12345,
  "room": {
    "id": "room_id",
    "isPrivate": false,
    "playersCount": 5,
    "userSlots": [
      {
        "playerId": "player_id",
        "name": "Nom",
        "avatarUrl": "https://...",
        "coins": 100
      }
    ]
  },
  "state": {
    "garden": { },
    "inventory": { },
    "stats": {
      "player": { "numEggsHatched": 10 }
    },
    "activityLog": { },
    "journal": { }
  },
  "privacy": {
    "showProfile": true,
    "showGarden": true,
    "showInventory": true,
    "showCoins": true,
    "showActivityLog": true,
    "showJournal": true,
    "showStats": true,
    "hideRoomFromPublicList": false
  },
  "modVersion": "1.0.0"
}
```

Tous les champs sont optionnels (sauf le token d'auth). Le serveur met à jour uniquement les champs fournis.

**Réponse :** `204 No Content`

**Comportement serveur :**
- Met à jour la table `players` (nom, avatar, coins, `last_event_at`, `mod_version`)
- Met à jour `player_privacy` (upsert)
- Met à jour `player_state` (garden, inventory, stats, activity_log, journal) en upsert
- Met à jour `rooms` et `room_players` (gestion des salles)
- Met à jour `leaderboard_stats` (coins + eggs_hatched extraits de `stats.player.numEggsHatched`)
- Les joueurs dont l'ID commence par `p_` dans les `userSlots` sont ignorés

---

## Players

### `GET /get-player-view`

Récupère le profil et l'état d'un joueur unique.

**Auth requise :** Non

**Query params :**

| Param    | Type   | Requis | Description                                                                 |
|----------|--------|--------|-----------------------------------------------------------------------------|
| playerId | string | Oui    | ID du joueur                                                                |
| sections | string | Non    | Sections à inclure, séparées par des virgules. Valeurs possibles : `profile`, `garden`, `inventory`, `stats`, `activityLog`, `journal`, `room`, `leaderboard` |

**Réponse (200) :**

```json
{
  "playerId": "123",
  "name": "Nom",
  "avatarUrl": "https://...",
  "avatar": ["...", "...", "...", "..."],
  "isOnline": true,
  "lastEventAt": "2025-01-01T00:00:00Z",
  "room": {
    "id": "room_id",
    "isPrivate": false,
    "playersCount": 5
  },
  "garden": { },
  "inventory": { },
  "stats": { },
  "activityLog": { },
  "journal": { },
  "leaderboard": {
    "coinsRank": 5,
    "eggsRank": 12
  }
}
```

**Comportement serveur :**
- Respecte les paramètres de confidentialité du joueur (les sections masquées ne sont pas retournées)
- Le statut en ligne est calculé sur un seuil de 6 minutes depuis `last_event_at`
- La room n'est incluse que si elle n'est pas privée
- Les rangs du leaderboard sont calculés dynamiquement

---

### `POST /get-players-view`

Récupère les profils de plusieurs joueurs en une seule requête.

**Auth requise :** Non

**Body (JSON) :**

```json
{
  "playerIds": ["id1", "id2", "id3"],
  "sections": "profile,garden"
}
```

| Champ     | Type             | Requis | Description                       |
|-----------|------------------|--------|-----------------------------------|
| playerIds | string[]         | Oui    | Liste d'IDs (max 50)              |
| sections  | string/string[]  | Non    | Sections à inclure                |

**Réponse (200) :** Tableau de profils joueurs (même format que `get-player-view`), ordonnés dans le même ordre que les IDs fournis.

**Comportement serveur :**
- Maximum 50 joueurs par requête
- La confidentialité est appliquée individuellement pour chaque joueur

---

### `GET /list-mod-players`

Liste les joueurs qui ont le mod installé.

**Auth requise :** Non

**Query params :**

| Param  | Type   | Requis | Description                               |
|--------|--------|--------|-------------------------------------------|
| query  | string | Non    | Recherche par nom ou ID (insensible à la casse) |
| limit  | number | Non    | Nombre de résultats (défaut: 50, max: 200) |
| offset | number | Non    | Décalage pour la pagination (défaut: 0)    |

**Réponse (200) :**

```json
[
  {
    "playerId": "123",
    "playerName": "Nom",
    "avatarUrl": "https://...",
    "avatar": ["...", "...", "...", "..."],
    "lastEventAt": "2025-01-01T00:00:00Z"
  }
]
```

**Comportement serveur :**
- Filtre : `has_mod_installed = true` et profil non masqué
- Recherche par `ILIKE` sur le nom ou l'ID
- Trié par `last_event_at` décroissant (les plus récemment actifs en premier)

---

## Friends

Toutes les routes friends nécessitent l'authentification.

### `POST /friend-request`

Envoie une demande d'ami.

**Auth requise :** Oui

**Body (JSON) :**

```json
{
  "toPlayerId": "target_player_id"
}
```

**Réponse :** `204 No Content`

**Comportement serveur :**
- Vérifie que les deux joueurs existent
- Vérifie qu'il n'y a pas déjà une relation (amis, en attente)
- Nettoie les anciennes relations rejetées si elles existent
- Crée une entrée `player_relationships` avec status `pending`
- Les IDs sont ordonnés (le plus petit = `user_one_id`)
- Émet un événement `friend_request` aux deux joueurs (via SSE/polling)

**Erreurs possibles :**
- `404` : Joueur cible introuvable
- `409` : Déjà amis, demande déjà en attente, ou impossible de s'envoyer une demande à soi-même

---

### `GET /list-friend-requests`

Récupère les demandes d'ami en attente.

**Auth requise :** Oui

**Réponse (200) :**

```json
{
  "playerId": "my_id",
  "incoming": [
    {
      "fromPlayerId": "other_id",
      "otherPlayerId": "other_id",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "outgoing": [
    {
      "toPlayerId": "other_id",
      "otherPlayerId": "other_id",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### `GET /list-friends`

Récupère la liste des amis acceptés.

**Auth requise :** Oui

**Réponse (200) :**

```json
[
  {
    "playerId": "friend_id",
    "name": "Nom",
    "avatarUrl": "https://...",
    "avatar": ["...", "...", "...", "..."],
    "lastEventAt": "2025-01-01T00:00:00Z",
    "roomId": "room_id_or_null",
    "isOnline": true
  }
]
```

**Comportement serveur :**
- Inclut le statut en ligne (seuil de 6 min)
- `roomId` est `null` si la room est privée

---

### `POST /friend-respond`

Accepte ou refuse une demande d'ami.

**Auth requise :** Oui

**Body (JSON) :**

```json
{
  "otherPlayerId": "requester_id",
  "action": "accept"
}
```

| Champ         | Type   | Description                       |
|---------------|--------|-----------------------------------|
| otherPlayerId | string | ID du joueur qui a fait la demande |
| action        | string | `"accept"` ou `"reject"`          |

**Réponse :** `204 No Content`

**Comportement serveur :**
- Seul le destinataire de la demande peut répondre (pas l'émetteur)
- Si rejeté, la relation est supprimée de la base
- Émet un événement `friend_response`

**Erreurs possibles :**
- `400` : Action invalide
- `403` : Pas autorisé à répondre (c'est vous qui avez fait la demande)
- `404` : Demande introuvable

---

### `POST /friend-cancel`

Annule une demande d'ami sortante.

**Auth requise :** Oui

**Body (JSON) :**

```json
{
  "otherPlayerId": "target_id"
}
```

**Réponse :** `204 No Content`

**Comportement serveur :**
- Seul l'émetteur de la demande peut annuler
- Supprime la relation de la base
- Émet un événement `friend_cancelled`

---

### `POST /friend-remove`

Supprime un ami.

**Auth requise :** Oui

**Body (JSON) :**

```json
{
  "otherPlayerId": "friend_id"
}
```

**Réponse :** `204 No Content`

**Comportement serveur :**
- La relation doit être en status `accepted`
- Supprime la relation de la base
- Émet un événement `friend_removed`

---

## Messages

Messages directs entre joueurs amis.

### `POST /messages/send`

Envoie un message direct.

**Auth requise :** Oui

**Body (JSON) :**

```json
{
  "toPlayerId": "recipient_id",
  "roomId": "current_room_id",
  "text": "Contenu du message"
}
```

| Champ      | Type   | Description                                      |
|------------|--------|--------------------------------------------------|
| toPlayerId | string | ID du destinataire                                |
| roomId     | string | ID de la room dans laquelle l'expéditeur se trouve |
| text       | string | Contenu du message (max 1000 caractères)           |

**Réponse (201) :**

```json
{
  "id": 1,
  "conversationId": "id1:id2",
  "senderId": "sender_id",
  "recipientId": "recipient_id",
  "body": "Contenu du message",
  "createdAt": "2025-01-01T00:00:00Z",
  "deliveredAt": null,
  "readAt": null
}
```

**Comportement serveur :**
- Vérifie que les joueurs sont amis
- Vérifie que l'expéditeur est connecté dans la room indiquée
- Le `conversationId` est formaté comme `"id_petit:id_grand"` (IDs triés)
- Émet un événement `message` aux deux joueurs
- Rate limit : 30 messages/min par joueur

**Erreurs possibles :**
- `400` : Texte vide ou trop long
- `403` : Les joueurs ne sont pas amis
- `404` : Joueur non trouvé ou non connecté

---

### `GET /messages/thread`

Récupère l'historique des messages avec un joueur (pagination).

**Auth requise :** Oui

**Query params :**

| Param         | Type   | Requis | Description                                    |
|---------------|--------|--------|------------------------------------------------|
| otherPlayerId | string | Oui    | ID de l'autre joueur                            |
| afterId       | number | Non    | Récupérer les messages après cet ID             |
| limit         | number | Non    | Nombre de messages (défaut: 50, max: 200)       |

**Réponse (200) :** Tableau de messages (même format que `send`), triés par ID croissant.

**Comportement serveur :**
- Vérifie que les joueurs sont amis et connectés
- Pagination basée sur l'ID du message

---

### `POST /messages/read`

Marque les messages comme lus.

**Auth requise :** Oui

**Body (JSON) :**

```json
{
  "otherPlayerId": "sender_id",
  "upToId": 42
}
```

| Champ         | Type   | Description                                   |
|---------------|--------|-----------------------------------------------|
| otherPlayerId | string | ID de l'autre joueur                           |
| upToId        | number | Marquer comme lus tous les messages jusqu'à cet ID |

**Réponse (200) :**

```json
{
  "updated": 5
}
```

**Comportement serveur :**
- Met à jour le champ `read_at` sur les messages concernés
- Émet un événement `read` aux deux joueurs

---

### `GET /messages/poll`

Récupère les nouveaux messages depuis un timestamp donné (polling simple).

**Auth requise :** Non (utilise `playerId` en query param)

**Query params :**

| Param    | Type   | Requis | Description                      |
|----------|--------|--------|----------------------------------|
| playerId | string | Oui    | ID du joueur                     |
| since    | string | Oui    | Timestamp ISO (ex: `2025-01-01T00:00:00Z`) |

**Réponse (200) :** Tableau de messages reçus depuis le timestamp (max 100).

**Comportement serveur :**
- Rate limité par `playerId`
- Retourne les messages où le joueur est le destinataire et `created_at > since`

---

## Groups

Système de groupes de discussion.

### `POST /groups`

Crée un nouveau groupe.

**Auth requise :** Oui

**Body (JSON) :**

```json
{
  "name": "Mon groupe"
}
```

| Champ | Type   | Description                        |
|-------|--------|------------------------------------|
| name  | string | Nom du groupe (max 40 caractères)  |

**Réponse (201) :**

```json
{
  "id": 1,
  "name": "Mon groupe",
  "ownerId": "creator_id",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

**Comportement serveur :**
- Le créateur devient automatiquement propriétaire (`role: owner`)
- Le créateur est ajouté comme membre du groupe

---

### `GET /groups`

Liste les groupes du joueur authentifié.

**Auth requise :** Oui

**Réponse (200) :**

```json
{
  "playerId": "my_id",
  "groups": [
    {
      "id": 1,
      "name": "Mon groupe",
      "ownerId": "owner_id",
      "createdAt": "...",
      "updatedAt": "...",
      "memberCount": 5,
      "previewMembers": [
        { "playerId": "...", "name": "...", "avatarUrl": "...", "avatar": [...] }
      ],
      "unreadCount": 3
    }
  ]
}
```

**Comportement serveur :**
- `previewMembers` contient un aperçu de 3 membres maximum
- `unreadCount` est calculé à partir de `last_read_message_id` du membre
- Trié par `updated_at` décroissant

---

### `GET /groups/:groupId`

Détails d'un groupe spécifique.

**Auth requise :** Oui (doit être membre du groupe)

**Réponse (200) :**

```json
{
  "group": {
    "id": 1,
    "name": "Mon groupe",
    "ownerId": "owner_id",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "members": [
    {
      "playerId": "...",
      "name": "...",
      "avatarUrl": "...",
      "avatar": [...],
      "role": "owner",
      "joinedAt": "...",
      "isOnline": true,
      "lastEventAt": "..."
    }
  ]
}
```

---

### `PATCH /groups/:groupId`

Renomme un groupe.

**Auth requise :** Oui (propriétaire uniquement)

**Body (JSON) :**

```json
{
  "name": "Nouveau nom"
}
```

**Réponse (200) :**

```json
{
  "groupId": 1,
  "name": "Nouveau nom",
  "updatedAt": "..."
}
```

---

### `DELETE /groups/:groupId`

Supprime un groupe.

**Auth requise :** Oui (propriétaire uniquement)

**Réponse :** `204 No Content`

**Comportement serveur :**
- Supprime le groupe, ses membres et ses messages
- Émet un événement `group_deleted` à tous les membres

---

### `POST /groups/:groupId/members`

Ajoute un membre au groupe.

**Auth requise :** Oui (propriétaire uniquement)

**Body (JSON) :**

```json
{
  "memberId": "player_id_to_add"
}
```

**Réponse :** `204 No Content`

**Comportement serveur :**
- Le nouveau membre doit être ami avec le propriétaire
- Maximum 12 membres par groupe
- Le nouveau membre reçoit le rôle `member`
- Émet un événement `group_member_added`

**Erreurs possibles :**
- `400` : Limite de membres atteinte
- `403` : Pas propriétaire ou le joueur n'est pas ami
- `409` : Déjà membre

---

### `DELETE /groups/:groupId/members/:memberId`

Retire un membre du groupe.

**Auth requise :** Oui (propriétaire uniquement)

**Réponse :** `204 No Content`

**Comportement serveur :**
- Le propriétaire ne peut pas se retirer lui-même
- Émet un événement `group_member_removed`

---

### `POST /groups/:groupId/leave`

Quitter un groupe.

**Auth requise :** Oui

**Réponse :** `204 No Content`

**Comportement serveur :**
- Le propriétaire ne peut pas quitter (il doit supprimer le groupe)
- Émet un événement `group_member_left`

---

### `POST /groups/:groupId/messages`

Envoie un message dans un groupe.

**Auth requise :** Oui (doit être membre)

**Body (JSON) :**

```json
{
  "text": "Contenu du message"
}
```

| Champ | Type   | Description                             |
|-------|--------|-----------------------------------------|
| text  | string | Contenu du message (max 1000 caractères) |

**Réponse (201) :**

```json
{
  "groupId": 1,
  "message": {
    "id": 42,
    "senderId": "sender_id",
    "body": "Contenu du message",
    "createdAt": "..."
  }
}
```

**Comportement serveur :**
- Seuls les membres peuvent envoyer des messages
- Le serveur garde uniquement les 500 messages les plus récents par groupe (les anciens sont supprimés)
- Émet un événement `group_message` aux autres membres

---

### `GET /groups/:groupId/messages`

Récupère l'historique des messages du groupe.

**Auth requise :** Oui (doit être membre)

**Query params :**

| Param    | Type   | Requis | Description                              |
|----------|--------|--------|------------------------------------------|
| afterId  | number | Non    | Messages après cet ID                     |
| beforeId | number | Non    | Messages avant cet ID                     |
| limit    | number | Non    | Nombre de messages (1-100, défaut: 50)    |

**Réponse (200) :** Tableau de messages du groupe.

---

### `POST /groups/:groupId/messages/read`

Marque les messages du groupe comme lus.

**Auth requise :** Oui (doit être membre)

**Body (JSON) :**

```json
{
  "messageId": 42
}
```

**Réponse :** `204 No Content`

**Comportement serveur :**
- Met à jour le `last_read_message_id` du membre dans le groupe

---

## Events

Système de temps réel pour recevoir les événements (demandes d'ami, messages, etc.).

Deux méthodes sont disponibles : **SSE (Server-Sent Events)** et **Long Polling**.

### `GET /events/stream`

Connexion SSE (Server-Sent Events) pour le temps réel.

**Auth requise :** Oui

**Headers requis :**
```
Authorization: Bearer <api_key>
Accept: text/event-stream
```

**Comportement serveur :**
1. Vérifie que le joueur est connecté (`last_event_at` dans les 6 dernières minutes)
2. Envoie immédiatement deux événements initiaux :
   - `connected` : `{ playerId, lastEventId }`
   - `welcome` : État initial complet (voir ci-dessous)
3. Envoie un heartbeat (ping) toutes les 30 secondes
4. Streame les événements en temps réel

**Format des événements SSE :**
```
event: <type>
data: <json>
id: <event_id>

```

**Événement `welcome` (état initial) :**

```json
{
  "friends": [ ],
  "friendRequests": {
    "incoming": [ ],
    "outgoing": [ ]
  },
  "groups": [ ],
  "conversations": [ ],
  "modPlayers": [ ]
}
```

---

### `GET /events/poll`

Alternative long-polling au SSE.

**Auth requise :** Oui

**Query params :**

| Param     | Type   | Requis | Description                                              |
|-----------|--------|--------|----------------------------------------------------------|
| since     | string | Oui    | Dernier event ID reçu (commencer avec `"0"`)              |
| timeoutMs | number | Non    | Timeout d'attente en ms (5000-30000, défaut: 25000)       |

**Réponse (200) :**

```json
{
  "playerId": "my_id",
  "lastEventId": "42",
  "events": [
    {
      "type": "friend_request",
      "data": { }
    }
  ]
}
```

**Comportement serveur :**
- Premier appel (`since=0`) : retourne `connected` + `welcome` immédiatement
- Appels suivants : attend jusqu'à `timeoutMs` qu'un nouvel événement arrive
- Si aucun événement, retourne un tableau vide
- Le client doit rappeler en boucle avec le `lastEventId` reçu

**Utilisation côté client (pseudo-code) :**
```javascript
let lastEventId = "0";

async function poll() {
  const res = await fetch(`/events/poll?since=${lastEventId}&timeoutMs=25000`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const data = await res.json();
  lastEventId = data.lastEventId;

  for (const event of data.events) {
    handleEvent(event.type, event.data);
  }

  // Rappeler immédiatement
  poll();
}
```

---

### Types d'événements

| Type               | Description                          | Données clés                                                      |
|--------------------|--------------------------------------|-------------------------------------------------------------------|
| `connected`        | Connexion établie                    | `playerId`, `lastEventId`                                         |
| `welcome`          | État initial complet                 | `friends`, `friendRequests`, `groups`, `conversations`, `modPlayers` |
| `friend_request`   | Nouvelle demande d'ami reçue         | `requesterId`, `requesterName`, `targetId`, `targetName`, `createdAt` |
| `friend_response`  | Réponse à une demande d'ami          | `requesterId`, `responderId`, `action`, `updatedAt`               |
| `friend_cancelled` | Demande d'ami annulée                | `requesterId`, `targetId`, `cancelledAt`                          |
| `friend_removed`   | Ami supprimé                         | `removerId`, `removedId`, `removedAt`                             |
| `message`          | Nouveau message direct reçu          | `conversationId`, `senderId`, `recipientId`, `body`, `createdAt`  |
| `read`             | Messages marqués comme lus           | `conversationId`, `readerId`, `upToId`, `readAt`                  |
| `presence`         | Changement de statut en ligne        | `playerId`, `online`, `lastEventAt`, `roomId`                     |
| `group_message`    | Nouveau message de groupe            | `groupId`, `message`                                              |
| `group_deleted`    | Groupe supprimé                      | `groupId`                                                         |
| `group_member_added`   | Membre ajouté au groupe          | `groupId`, `memberId`                                             |
| `group_member_removed` | Membre retiré du groupe          | `groupId`, `memberId`                                             |
| `group_member_left`    | Membre a quitté le groupe        | `groupId`, `memberId`                                             |

---

## Leaderboard

### `GET /leaderboard/coins`

Classement par nombre de pièces.

**Auth requise :** Non

**Query params :**

| Param  | Type   | Requis | Description                          |
|--------|--------|--------|--------------------------------------|
| limit  | number | Non    | Nombre de résultats (1-100, défaut: 50) |
| offset | number | Non    | Décalage pour pagination (défaut: 0)    |

**Réponse (200) :**

```json
{
  "rows": [
    {
      "playerId": "123",
      "playerName": "Nom",
      "avatarUrl": "https://...",
      "avatar": [...],
      "lastEventAt": "...",
      "coins": 50000,
      "eggsHatched": 100
    }
  ]
}
```

**Comportement serveur :**
- Trié par coins décroissant
- Si un joueur a masqué ses coins (`show_coins = false`), il apparaît comme `"anonymous"`

---

### `GET /leaderboard/coins/rank`

Rang d'un joueur dans le classement des pièces.

**Auth requise :** Non

**Query params :**

| Param    | Type   | Requis | Description   |
|----------|--------|--------|---------------|
| playerId | string | Oui    | ID du joueur  |

**Réponse (200) :**

```json
{
  "rank": 5,
  "total": 1000,
  "row": {
    "playerId": "123",
    "playerName": "Nom",
    "coins": 50000,
    "eggsHatched": 100
  }
}
```

---

### `GET /leaderboard/eggs-hatched`

Classement par nombre d'œufs éclos.

**Auth requise :** Non

**Query params :** Identiques à `/leaderboard/coins`

**Réponse (200) :** Même structure que `/leaderboard/coins`, trié par `eggsHatched` décroissant.

**Comportement serveur :**
- Si un joueur a masqué ses stats (`show_stats = false`), il apparaît comme `"anonymous"`

---

### `GET /leaderboard/eggs-hatched/rank`

Rang d'un joueur dans le classement des œufs.

**Auth requise :** Non

**Query params / Réponse :** Identiques à `/leaderboard/coins/rank`

---

## Codes d'erreur

| Code | Signification                                                   |
|------|-----------------------------------------------------------------|
| 400  | Requête invalide (paramètres manquants ou mal formatés)          |
| 401  | Non authentifié (token manquant ou invalide)                     |
| 403  | Interdit (pas les permissions nécessaires)                       |
| 404  | Ressource introuvable                                           |
| 409  | Conflit (doublon, état invalide — ex: déjà amis)                 |
| 429  | Rate limit atteint (trop de requêtes)                            |
| 500  | Erreur serveur                                                  |

---

## Statut en ligne

Un joueur est considéré **en ligne** si son `last_event_at` date de moins de **6 minutes**.

Ce champ est mis à jour à chaque appel à `/collect-state`. Le mod doit donc appeler cet endpoint régulièrement (toutes les quelques minutes) pour maintenir le statut en ligne.

---

## Système de confidentialité

Chaque joueur peut configurer la visibilité de ses données via le champ `privacy` de `/collect-state` :

| Paramètre               | Effet                                                   |
|--------------------------|----------------------------------------------------------|
| `showProfile`            | Masque le profil dans les recherches et vues              |
| `showGarden`             | Masque le jardin dans les vues joueur                     |
| `showInventory`          | Masque l'inventaire dans les vues joueur                  |
| `showCoins`              | Masque les pièces + anonymise dans le leaderboard coins   |
| `showActivityLog`        | Masque le journal d'activité                              |
| `showJournal`            | Masque le journal                                        |
| `showStats`              | Masque les stats + anonymise dans le leaderboard eggs     |
| `hideRoomFromPublicList` | Cache la room des listes publiques                        |

---

## WebSocket

Un endpoint WebSocket est disponible pour les pings :

**URL :** `ws://<host>:4000/ws/ping`

**Protocole :**
- Envoyer `ping` → reçoit `pong`
- Tout autre message → reçoit un écho du message

> **Note :** Pour le temps réel (événements), utiliser SSE (`/events/stream`) ou long polling (`/events/poll`) plutôt que le WebSocket, qui ne sert qu'au ping.

---

## Health Check

### `GET /health`

Vérification que le serveur est en ligne.

**Auth requise :** Non

**Réponse (200) :**

```json
{
  "status": "ok"
}
```
