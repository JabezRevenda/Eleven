# Publicar na Vercel

Este repositório é uma cópia do [VoiceStudio](https://github.com/debpalash/VoiceStudio)
(commit `28bf2c7`, licença AGPL-3.0). O `vercel.json` publica o projeto como
**Vercel Services**, com dois serviços no mesmo domínio:

| Serviço | Pasta | Caminho público | O que é |
|---|---|---|---|
| `web` | `electron/` | `/` | Interface (site estático gerado pelo Vite) |
| `api` | raiz, `deploy/Dockerfile.vercel` | `/api/*` | Backend FastAPI em container, só CPU |

A interface é gerada com `window.__OMNIVOICE_API_BASE__="/api"`
(`OMNIVOICE_WEB_API_BASE` em `electron/vite.web.config.ts`), então o navegador
chama o backend no mesmo domínio. A regra `routes` do serviço `api` tira o
prefixo `/api` antes de a requisição chegar ao backend, menos em `settings`,
`auth`, `integrations` e `mcp`, que já usam `/api` no próprio backend. É a
mesma regra do proxy de desenvolvimento (`electron/src/shared/web-api-routing.ts`).

## Importar na Vercel

1. **Add New → Project → Import** `JabezRevenda/Eleven`, com Root Directory `./`.
2. Opcional, mas recomendado: em **Settings → Environment Variables**, crie
   `OMNIVOICE_API_KEY` com uma senha. Sem ela, qualquer pessoa com o link usa o
   backend. A interface mostra uma tela pedindo a chave.
3. **Deploy**.

## Limites do backend na Vercel

- Não tem GPU. A geração roda na CPU, devagar.
- A memória vai até 2 GB no Hobby e 4 GB no Pro. O modelo padrão (OmniVoice,
  2,4 GB) não cabe no Hobby. Motores leves, como o KittenTTS, cabem.
- O disco é temporário. Modelos, vozes e projetos se perdem quando o backend
  fica 5 minutos sem uso.
- Uploads vão até 4,5 MB, o que limita os áudios de referência e impede
  vídeos para dublagem.
- Cada requisição dura até 300 s no Hobby e até 800 s no Pro.

Para usar o app de verdade, o melhor é rodar o backend num servidor com GPU
(veja `docs/install/docker.md`) e deixar só a interface na Vercel.

## O que foi alterado em relação ao original

- Adicionados `vercel.json`, `deploy/Dockerfile.vercel` e este arquivo.
- `electron/vite.web.config.ts`: opção `OMNIVOICE_WEB_API_BASE` para gravar o
  endereço da API no HTML na hora do build.
- Removidos `.github/workflows/` e `.github/dependabot.yml`, para não rodar a CI
  e as publicações do projeto original no seu GitHub.
- Removido `.gitmodules` (a galeria `omnivoice-gallery` é opcional e não entra
  no build).
