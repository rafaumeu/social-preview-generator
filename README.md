# Social Preview Generator

Gerador de imagens OG (Open Graph) com personalidade SquadOps. SVG direto + resvg-js, sem dependência de satori.

**1200x630px**, dark theme, accent color customizável, tags, emoji, autor.

## Uso local

```bash
npm install
node generate-og.js                          # usa .github/social-preview.config.json
node generate-og.js /path/to/config.json      # config custom
```

Gera `social-preview.png` + `og-image.png`.

## Config

Crie `.github/social-preview.config.json`:

```json
{
  "title": "Hermes Agent",
  "subtitle": "AI agent for Telegram, Discord & CLI",
  "accent": "#6C5CE7",
  "darkMode": true,
  "emoji": "⚡",
  "author": "Nous Research",
  "tags": ["AI", "Open-Source", "Agent"]
}
```

| Campo      | Default           | Descrição                          |
|------------|-------------------|-------------------------------------|
| title      | nome do repo      | Título principal                    |
| subtitle   | ""                | Descrição curta                     |
| accent     | "#6C5CE7"         | Cor accent (hex)                    |
| darkMode   | true              | Fundo escuro ou claro               |
| emoji      | "⚡"              | Emoji exibido acima do título       |
| author     | "Rafael Zendron"  | Atribuição                          |
| tags       | []                | Array de tags como pills            |

## GitHub Actions

O workflow em `.github/workflows/generate-social-preview.yml` roda automaticamente:
- Push para main (quando config, package.json ou README mudam)
- Mensal (dia 1)
- Manual (`workflow_dispatch`)

Para aplicar em qualquer repo:

```bash
./setup-social-preview.sh /path/to/repo "Meu Repo" "Descrição" "🚀" "#6C5CE7" "tag1,tag2"
```

## Stack

- **SVG** — template declarativo, sem JSX
- **@resvg/resvg-js** — SVG → PNG (Rust-based, rápido)
- Sem satori, sem fontes externas, sem puppeteer

## Licença

MIT
