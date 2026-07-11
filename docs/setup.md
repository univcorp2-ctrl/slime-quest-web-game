# Setup and Operations

## Zero-setup play

Open the production URL from the repository or deployment output. No account, login, API key, database migration, or browser extension is required.

## Codespaces

1. Open the repository in GitHub Codespaces.
2. The devcontainer installs Node.js 20 and runs `npm ci`.
3. Run `npm run serve` in the terminal.
4. The forwarded port 8000 opens the game preview.

## Production

Cloudflare Pages serves the repository root as a static site. Production branch: `main`. Build command: empty. Output directory: `.`. Every push to `main` triggers CI, a Pages rebuild through Git integration, and Google Drive synchronization through the connected webhook/Worker.

## Secrets

The web game itself requires no Secrets. Infrastructure credentials, if used by the connected automation Worker, remain server-side and must never be committed to this repository.

## Validation checklist

- Open the production URL and confirm the title screen appears.
- Start the game and verify left, right, and jump controls.
- Collect all coins and touch the crystal.
- Reload and confirm the best time remains.
- Check GitHub Actions for a green CI run and downloadable `slime-quest-site` artifact.
