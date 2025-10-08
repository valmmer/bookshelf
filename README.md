# 📚 Bookshelf — sua estante digital

App para gerenciar sua biblioteca pessoal: cadastre livros, envie o PDF e a capa, leia no navegador (com progresso salvo), filtre e ordene sua coleção.  
**Stack:** Next.js 15 (App Router) • React 19 • TypeScript • Tailwind v4 • Prisma • PostgreSQL (Railway) • Supabase Storage • pdfjs-dist

---

## ✨ Funcionalidades

- CRUD completo de livros (título, autor, ano, gênero, páginas, rating, notas, ISBN etc.)
- Upload de **PDF** e **capa** (armazenados no **Supabase Storage**)
- Leitor de PDF integrado (zoom, navegação, progresso salvo automaticamente)
- Biblioteca com **busca**, **filtros por status** e **ordenação**
- Tema **claro/escuro** e estilos consistentes (tokens em `globals.css`)
- API REST básica (`/api/books`, `/api/upload`, `/api/ping`)
- Server Actions (Next) para criação/edição/remoção, com revalidação
- Tipagem forte com Zod/TypeScript (validações no server e no client)

---

## 🗂️ Estrutura de pastas

```
src/
  app/
    api/
      books/route.ts          # GET/POST livros (listagem/criação)
      ping/route.ts           # health/env check (Supabase vars)
      upload/route.ts         # upload PDF/capa -> Supabase Storage
    books/
      [id]/page.tsx           # detalhes do livro
      [id]/read/              # leitor de PDF
        page.tsx
        ReaderClient.tsx
      [id]/edit/page.tsx      # edição
      [id]/delete/page.tsx    # confirmação de exclusão
      new/page.tsx            # formulário de criação
    library/page.tsx          # listagem com busca/filtros/ordenação
    page.tsx                  # home (atalhos)
  components/
    book/BookCard.tsx
    book/BookForm.tsx
    ui/*                      # botões, toasts, etc.
  features/
    books/schema.ts           # Zod (form + server)
  server/
    db/
      books.ts                # camada de acesso (Prisma)
      prisma.ts               # cliente Prisma
      types.ts                # DTOs e tipos de domínio
    supabase.ts               # client admin (server-only)
prisma/
  schema.prisma
public/
  pdf.worker.min.mjs          # worker copiado em build (ver scripts)
  covers/*                    # (apenas dev)
  ebooks/*                    # (apenas dev)
scripts/
  copy-pdf-worker.mjs         # copia o worker do pdfjs-dist para /public
```

---

## 🧰 Modelagem (Prisma/Postgres)

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ReadingStatus {
  QUERO_LER
  LENDO
  LIDO
  PAUSADO
  ABANDONADO
}

model Genre {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  createdAt DateTime @default(now())
  books     Book[]
  @@index([name])
}

model Book {
  id          Int           @id @default(autoincrement())
  title       String
  author      String
  year        Int?
  pages       Int           @default(0)
  rating      Int?
  synopsis    String?
  cover       String?
  fileUrl     String?
  status      ReadingStatus @default(QUERO_LER)
  currentPage Int           @default(0)       // 0-based
  isbn        String?
  notes       String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  genreId Int?
  genre   Genre? @relation(fields: [genreId], references: [id], onDelete: SetNull)

  @@index([createdAt], map: "idx_book_createdAt")
  @@index([status],    map: "idx_book_status")
  @@index([author],    map: "idx_book_author")
  @@index([title],     map: "idx_book_title")
  @@index([genreId],   map: "idx_book_genreId")
}
```

---

## 🔌 Rotas de API

- `GET  /api/books` — lista paginada (query: `status`, `orderBy`, `orderDir`, `page`, `pageSize`)
- `POST /api/books` — cria livro (sanitiza tipos; resolve `genre` por nome)
- `POST /api/upload` — recebe `FormData` (`pdf` obrigatório, `cover` opcional), salva no **Supabase Storage** e retorna URLs públicas
- `GET  /api/ping` — health-check e verificação de envs do Supabase

> Exclusão/edição usam **Server Actions** (mais simples e com revalidação do cache do Next).

---

## 🔐 Variáveis de ambiente

| Nome                       | Onde usar     | Exemplo / Observações                                                                 |
|---------------------------|---------------|----------------------------------------------------------------------------------------|
| `DATABASE_URL`            | Server        | `postgresql://…@postgres.railway.internal:5432/railway` (Private) ou `…proxy…?sslmode=require` |
| `NEXT_PUBLIC_SUPABASE_URL`| Client/Server | `https://SEU-PROJETO.supabase.co`                                                      |
| `SUPABASE_SERVICE_ROLE`   | **Server**    | **NUNCA** expor no client. Use a **Service Role Key** (painel Supabase → Project Settings → API). |
| `SUPABASE_BUCKET`         | Server        | `uploads` (crie esse bucket e deixe **public**)                                        |
| `NIXPACKS_NODE_VERSION`   | Railway       | `20`                                                                                   |
| `NEXT_DISABLE_ESLINT`     | Build         | `1` (opcional)                                                                         |
| `NEXT_DISABLE_TYPECHECK`  | Build         | `1` (opcional)                                                                         |

> No Railway, se o seu serviço Node **está no mesmo projeto** que o Postgres, crie a env `DATABASE_URL` com o valor:  
> `\${{ Postgres.DATABASE_URL }}` (Private Network).  
> Se for acessar **fora do Railway** (ex.: rodando local), use a **Public** (`…proxy…`) e adicione `?sslmode=require`.

---

## ▶️ Rodando local

1) **Instalar dependências**
```bash
npm install
```

2) **Configurar `.env`**
```env
DATABASE_URL="postgresql://usuario:senha@host:port/db?sslmode=require"
NEXT_PUBLIC_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
SUPABASE_SERVICE_ROLE="eyJhbGciOiJI..."  # server-only
SUPABASE_BUCKET="uploads"
```

3) **Banco (Prisma)**
```bash
npx prisma validate
npx prisma migrate dev --name init
npx prisma generate
```

4) **Dev**
```bash
npm run dev
# http://localhost:3000
```

---

## 🚀 Deploy no Railway

1) **Serviço Postgres**
   - Adicione um Postgres no mesmo projeto.

2) **Serviço Node (Bookshelf)**
   - **Build Command:** `prisma generate && node scripts/copy-pdf-worker.mjs && next build`
   - **Start Command:** `next start -p $PORT`  
     (o script `prestart` roda `prisma migrate deploy` antes de subir)
   - **Env vars do Node:**
     - `DATABASE_URL` → `\${{ Postgres.DATABASE_URL }}`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE`
     - `SUPABASE_BUCKET=uploads`
     - `NIXPACKS_NODE_VERSION=20`

3) **Supabase**
   - Crie o **bucket** público `uploads`.
   - (Opcional) Limite de arquivo no **free** é ~50 MB — PDFs maiores exigem upgrade.

---

## 🧾 Uploads (Supabase)

- Rota: `POST /api/upload`  
  Envie `FormData` com:
  - `pdf` (obrigatório, `application/pdf`)
  - `cover` (opcional, `image/*`)

- O endpoint valida tipo/tamanho e grava em:
  - `uploads/ebooks/...pdf`
  - `uploads/covers/...jpg|png|webp`
- Retorna `{ ok: true, pdfUrl, coverUrl }` (URLs públicas do Supabase)  
- O **formulário** de novo livro já chama essa rota antes de criar o registro no banco.

---

## 📖 Leitor de PDF

- Usa `pdfjs-dist@4` com **worker local** em `/public/pdf.worker.min.mjs`.
- **Importante:** copiar o worker no build.

**scripts/copy-pdf-worker.mjs**
```js
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const from = resolve(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const to   = resolve(__dirname, '../public/pdf.worker.min.mjs');
mkdirSync(resolve(__dirname, '../public'), { recursive: true });
copyFileSync(from, to);
console.log('✔ pdf.worker.min.mjs copiado para /public');
```

**package.json (trecho)**
```json
{
  "scripts": {
    "build": "prisma generate && node scripts/copy-pdf-worker.mjs && next build",
    "prestart": "prisma migrate deploy",
    "start": "next start -p $PORT"
  }
}
```

**ReaderClient.tsx (trecho)**
```ts
const pdfjsLib = await import('pdfjs-dist/build/pdf');
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
```

> O leitor salva automaticamente o **progresso** (`currentPage`, 0-based) via `updateBookAction`.

---

## 🖼️ Next Image (Supabase)

No `next.config.js`, libere seu domínio do Supabase:

```js
/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'snzsacdpnazpmmnznuyh.supabase.co' } // seu host
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
```

---

## 🎨 Tema & Acessibilidade

- **Tokens** definidos em `globals.css` (claro/escuro).
- Nos formulários/filtros use sempre classes que **forçam contraste**:
  - `bg-background text-foreground`
  - `placeholder:text-muted-foreground`
  - `border`
- Ex.: `<select className="rounded-md border bg-background text-foreground px-2 py-2 text-sm" />`.

---

## 🧪 Scripts úteis

```bash
npm run dev                # desenvolvimento
npm run build              # gera pdf.worker + build Next
npm start                  # inicia (Railway usa $PORT)
npm run migrate:deploy     # aplica migrações em produção
npm run db:push            # push do schema (dev)
npm run db:migrate         # migrate dev (gera arquivos)
npm run prisma:generate    # client do Prisma
npm run prisma:studio      # GUI do Prisma
```

---

## 🧯 Troubleshooting

- **P1012 — `Environment variable not found: DATABASE_URL`**  
  → Garanta `DATABASE_URL` no `.env` (local) ou no painel do Railway (service → Variables).

- **P1001 — `Can't reach database server at postgres.railway.internal:5432` (local)**  
  → A URL *Private Network* só funciona **dentro** do Railway.  
  Para rodar local, use a **Public** (`…proxy…`) + `?sslmode=require`.

- **`NS_ERROR_CORRUPTED_CONTENT` / `disallowed MIME type (text/html)` no `pdf.worker.min.mjs`**  
  → O worker não foi copiado. Inclua o script `copy-pdf-worker.mjs` e rode antes do `next build`.

- **`MissingPDFException` com URL duplicada**  
  → Garante que `fileUrl` seja **uma URL válida** do Supabase (ex.: `https://…supabase.co/storage/v1/object/public/uploads/ebooks/…pdf`),  
  e que o `ReaderClient` **não** prefixe novamente com `window.location.origin`.

- **Uploads não aparecem em produção**  
  → Em produção, **não grave em `public/*`**. Use a rota `/api/upload` (Supabase Storage).  
  Verifique `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `SUPABASE_BUCKET` e se o bucket está **public**.

- **Arquivo grande**  
  → Plano gratuito do Supabase limita ~**50 MB** por upload. PDFs maiores exigem upgrade.

---

## 🗺️ Roadmap

- Autenticação (NextAuth/Auth.js) para uploads privados
- Busca full-text por título/autor (Prisma + Postgres `ILIKE`/`tsvector`)
- Leitor: mini-mapa/miniaturas de páginas, rolagem contínua, modo duas páginas

---

## 👤 Autor

**Valmer Benedito Mariano**  
+ colaboradores: Cassia Deiro, Catarine Formiga, Paola Pontes, Samille Ervely

---

## 📄 Licença

MIT
