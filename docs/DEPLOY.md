# Deploy Flipduel on Render

## Что поднимается

| Сервис | Тип | URL |
|--------|-----|-----|
| `flipduel-api` | Node Web Service | `https://flipduel-api.onrender.com` |
| `flipduel-web` | Static Site | `https://flipduel-web.onrender.com` |

Фронт при сборке получает `VITE_API_URL` из URL API (через Blueprint).

## Шаг 1 — Код на GitHub

Render деплоит из Git. Локально:

```powershell
cd C:\project1
git init -b main
git add -A
git commit -m "Initial Flipduel MVP"
```

Создай репозиторий на GitHub (New repository → без README) и подключи:

```powershell
git remote add origin https://github.com/<твой-username>/flipduel.git
git push -u origin main
```

## Шаг 2 — Blueprint на Render

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
2. Подключи GitHub и выбери репозиторий `flipduel`.
3. Render прочитает `render.yaml` и создаст **API + Web**.
4. При запросе секретов задай:
   - `HELIUS_API_KEY` — опционально, для парсинга tx (можно оставить пустым на devnet).
   - `AUTHORITY_PRIVATE_KEY` — JSON массив байт кошелька для settlement (devnet). Без него дуэли создаются, но payout может не пройти.

5. **Create Blueprint** → дождись зелёного деплоя (первый build ~3–5 мин).

## Шаг 3 — Проверка

- API: `https://<flipduel-api>.onrender.com/health` → `{"ok":true,...}`
- Сайт: открой URL static site → лендинг, Lobby, Create room.

## Env (API)

| Variable | Пример | Нужен? |
|----------|--------|--------|
| `PORT` | Render задаёт сам | авто |
| `NODE_ENV` | `production` | в yaml |
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | да |
| `HELIUS_API_KEY` | — | опционально |
| `AUTHORITY_PRIVATE_KEY` | `[1,2,3,...]` | для payout |
| `DATABASE_PATH` | путь на disk | только с persistent disk |

## SQLite на free tier

На **free** плане данные SQLite **сбрасываются при redeploy**. Для постоянной БД — paid plan + disk в `render.yaml` (закомментирован блок `disk`).

## Ручной деплой (без Blueprint)

### API only

**New → Web Service** → репо → настройки:

- **Root Directory:** `/`
- **Build:** `npm install && npm run build -w @flipduel/shared && npm run build -w @flipduel/api`
- **Start:** `npm run start -w @flipduel/api`
- **Health Check Path:** `/health`

### Web (static)

**New → Static Site**:

- **Build:** `npm install && npm run build -w @flipduel/shared && npm run build -w @flipduel/web`
- **Publish:** `apps/web/dist`
- **Env:** `VITE_API_URL=https://<твой-api>.onrender.com`
- **Redirect/Rewrite:** `/*` → `/index.html` (SPA)

## Cloudflare (опционально)

Фронт можно оставить на Render Static Site или позже на Cloudflare Pages с `VITE_API_URL` = URL Render API.
