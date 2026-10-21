# Publicar a interface na Vercel

Este repositório é uma cópia do [VoiceStudio](https://github.com/debpalash/VoiceStudio)
(commit `28bf2c7`, licença AGPL-3.0). O `vercel.json` já está configurado para
publicar só a **interface web**.

## Importar na Vercel

1. Na Vercel: **Add New → Project → Import** `JabezRevenda/Eleven`.
2. Deixe **Root Directory** na raiz (`./`). Instalação, build e pasta de saída
   (`frontend/dist`) já vêm do `vercel.json`.
3. Clique em **Deploy**.

## O que funciona e o que não funciona

A Vercel hospeda só a interface. A geração de voz (clonagem, dublagem,
transcrição) roda num **backend em Python** com modelos de IA (PyTorch, alguns GB,
de preferência com GPU), e esse backend não roda na Vercel.

Sem backend, a página abre com o logo do VoiceStudio e um botão **Retry**.

## Ligar a interface a um backend

1. Rode o backend numa máquina sua ou num servidor com GPU (veja
   `docs/install/docker.md`). Ele precisa estar acessível por **HTTPS**.
2. No backend, libere o domínio da Vercel:
   `OMNIVOICE_ALLOWED_ORIGINS=https://seu-projeto.vercel.app`
3. Na Vercel, em **Settings → Environment Variables**, crie
   `VITE_OMNIVOICE_API` = URL do backend (ex.: `https://meu-backend.com`)
   e faça um novo deploy. A variável entra no build, então mudar o valor
   exige redeploy.

## O que foi alterado em relação ao original

- Adicionados `vercel.json` e este arquivo.
- Removidos `.github/workflows/` e `.github/dependabot.yml`, para não rodar a CI
  e as publicações do projeto original no seu GitHub.
- Removido `.gitmodules` (a galeria `omnivoice-gallery` é opcional e não entra
  no build).
