# 📚 BookShelf — sua estante digital (Next.js 15 + React 19 + Tailwind 4)

Aplicação moderna para gerenciar sua biblioteca pessoal: cadastre livros, envie PDF/capa, acompanhe o progresso de leitura e leia PDFs no próprio navegador com um leitor acessível e performático.

> **Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix/shadcn (Progress/Dialog), React Hook Form + Zod, react‑pdf, framer‑motion.

---

## ✨ Principais recursos

- **Dashboard** com KPIs (Total, Lendo, Lidos, Páginas lidas) e cards de progresso
- **Biblioteca** com busca, filtro por status/gênero, ordenação e “com PDF”
- **CRUD de livros** com formulários validados por **Zod** (RHF)
- **Uploads locais** (dev): API `/api/upload` salva PDFs em `public/ebooks` e capas em `public/covers`
- **Leitor de PDF** com:
  - tema (Paper/Creme/Sépia/Escuro/Alto Contraste)
  - zoom, navegação por teclado (← → Home End, + -)
  - salva a **página atual** no store/localStorage (retoma de onde parou)
- **Store global** própria (`useBooks`) com persistência em `localStorage`
- **Acessibilidade**: foco/aria labels, cores contrastadas, feedback visual, toasts
- **UI/UX**: skeletons, animações sutis, mensagens acolhedoras, botões de ação com loading

---

## 🏗️ Estrutura do projeto (simplificada)

```
src/
  app/
    layout.tsx              # layout raiz (Header/Footer/Providers)
    page.tsx                # dashboard (home)
    library/page.tsx        # listagem + filtros
    books/
      new/page.tsx          # criar livro (upload PDF obrigatório)
      [id]/page.tsx         # detalhes do livro
      [id]/edit/page.tsx    # editar (upload opcional / remover capa)
      [id]/read/page.tsx    # leitor de PDF
    api/upload/route.ts     # salva arquivos localmente (dev)
  components/
    book/BookCard.tsx
    book/CoverPreview.tsx
    book/RatingStars.tsx
    reader/PDFReader.tsx
    ui/ConfirmDialog.tsx
    ui/ToastProvider.tsx
    navigation/Breadcrumbs.tsx
    dashboard/KpiCard.tsx
    skeleton/Skeleton.tsx
  store/books.tsx           # contexto + reducer + persistência
  types/book.ts             # tipos e utils de domínio (normalize/sanitize)
  features/books/schema.ts  # schema Zod dos formulários
  lib/cn.ts                 # utilitário clsx/twMerge (se aplica)
public/
  ebooks/                   # PDFs salvos localmente (dev)
  covers/                   # imagens de capa (dev)
```

---

## 🚀 Começando

### 1) Pré-requisitos

- **Node.js 18+**
- **pnpm** (recomendado) ou npm/yarn

### 2) Instalar dependências

```bash
pnpm i
# ou
npm i
```

### 3) Rodar em desenvolvimento

```bash
pnpm dev
# ou
npm run dev
```

Acesse em `http://localhost:3000`.

> **Windows/PowerShell**: se aparecer “`next` não é reconhecido”, reinstale dependências (`npm i`) na raiz do projeto e rode o script via `npm run dev` (ele chama o bin do `node_modules/.bin/next`).

---

## 🧪 Scripts úteis

| Script  | Descrição         |
| ------- | ----------------- |
| `dev`   | Next dev          |
| `build` | Build de produção |
| `start` | Servir build      |
| `lint`  | Eslint            |

---

## ⚙️ Configurações importantes

### `next.config.js` (imagens locais com `next/image`)

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
    // ou: unoptimized: true
  },
};
export default nextConfig;
```

### `tsconfig.json`

- `moduleResolution: "bundler"`
- `baseUrl: "src"` e `paths: { "@/*": ["./*"] }`

### `tailwind`

- Tailwind v4 (postcss) já configurado, classes utilitárias em todo o app.

---

## 📦 Upload local (dev)

A rota `POST /api/upload` aceita `multipart/form-data` com campos:

- `pdf` **(obrigatório na criação)** — salvo em `public/ebooks`
- `cover` _(opcional)_ — salva em `public/covers`

Retorno:

```json
{
  "id": "uuid",
  "pdfUrl": "/ebooks/<file>.pdf",
  "coverUrl": "/covers/<file>.jpg"
}
```

> **Produção (Vercel)**: o filesystem é efêmero. Para persistir, troque para um provedor de storage (Vercel Blob, S3, etc.) e ajuste o `PDFReader`/URLs.

---

## 🧠 State & Tipos

- `src/store/books.tsx`: reducer (`ADD/UPDATE/DELETE/HYDRATE`), normalização de status por `currentPage/pages` e persistência no `localStorage`.
- `src/types/book.ts`: `Book`, `ReadingStatus`, `normalizeBook`, `sanitizeBook`, `normalizeFileUrl`, _guards_ e utilitários.
- O store _clampa_ `currentPage ≤ pages` e ajusta `status` automaticamente (`LENDO`/`LIDO`).

---

## 📝 Formulários (RHF + Zod)

- `features/books/schema.ts` define `bookFormSchema` e `BookFormValues`.
- Padrão usado no **new/edit** para evitar conflito com `SubmitHandler`:
  - `useForm<BookFormValues>({ resolver: zodResolver(schema) as Resolver<BookFormValues> })`
  - `const onValid = (values: BookFormValues) => { ... }`
  - `const onSubmit: FormEventHandler<HTMLFormElement> = (e) => { e.preventDefault(); void (form.handleSubmit as (cb: (d: BookFormValues) => unknown) => any)(onValid)(e); }`

Campos com `valueAsNumber` nos inputs numéricos para coerção segura.

---

## 📖 Leitor de PDF (`react-pdf`)

- Carregado só no cliente via `dynamic(..., { ssr: false })`
- Worker local em `/public/pdf.worker.min.mjs`
- Salva progresso por livro (`reading_progress_<id>`) e no store (`updateBook` debounced)
- Teclas: **←/→**, **+/-**, **Home/End**
- Temas guardados em `localStorage` (`reader_theme`)

> **Dica**: para ocupar a tela sem sobrepor o rodapé, usamos `min-h-screen` no layout e na página de leitura um container `h-[calc(100vh-140px)]` (ajuste esse offset se seu Header/Footer mudar de altura).

---

## ♿ Acessibilidade

- Labels/aria nos botões/inputs, contraste em temas, “aria-busy” nos botões com loading.
- Navegação por teclado no leitor e focos visíveis nos componentes clicáveis.
- Mensagens claras nos estados vazios/erros.

---

## 🚀 Performance & DX

- `next/font` para fontes otimizadas
- Suspense/skeletons em listas e no leitor
- `useMemo`/`useCallback` nos cálculos de KPIs e filtros
- Evitamos re-renders no store expondo apenas funções estáveis

---

## 🧯 Troubleshooting

- **Imagem com `next/image` deu erro de hostname**: adicione `localhost` (ou use `unoptimized: true`) no `next.config.js`.
- **“next não é reconhecido” no Windows**: rode `npm i` na raiz e use `npm run dev`.
- **Footer sobre o leitor**: ajuste o `calc(100vh - XXXpx)` da página `read`, ou transforme o Footer em `sticky`/`static` conforme sua UI.
- **Form mostra `NaN` no rating**: garanta `register('rating', { valueAsNumber: true })` + fallback `value={rating ?? 0}` no `RatingStars`.

---

## 🗺️ Roadmap (sugestões)

- Autenticação (NextAuth)
- Sincronizar dados em um DB (Postgres/Prisma)
- Upload em storage (Vercel Blob/S3)
- Coleções, tags e metas de leitura
- Importação por ISBN (Google Books API)
- Notas destacáveis no PDF

---

## 🤝 Contribuindo

1. Faça um fork
2. Crie um branch: `feat/minha-feature`
3. Commit: `feat: descrição curta`
4. Abra um PR

---

## 👥 Participantes

- Valmer Mariano
- Cassia Deiro
- Catarine Formiga
- Paola Pontes
- Samille Ervely

> Quer adicionar cargo/contato de cada participante? Me passe os detalhes e eu atualizo aqui. 😉

---

## 📄 Licença

Este projeto é distribuído sob a licença MIT. Consulte `LICENSE` (opcional) para mais detalhes.
