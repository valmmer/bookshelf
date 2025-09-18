# BookShelf

Aplicação **Next.js** para gerenciar sua biblioteca pessoal com uma experiência moderna de UX e foco em acessibilidade. Permite cadastrar livros, ler PDFs no navegador, acompanhar progresso e organizar sua coleção.

---

## ✨ Principais funcionalidades

- **Biblioteca** com busca, filtros (status/gênero) e ordenação.
- **Cadastro/edição** de livros (capa, autor, páginas, status, notas, PDF etc.).
- **Leitor de PDF integrado** (react-pdf) com:
  - retomada automática da **última página lida**;
  - **salvamento de progresso** no `localStorage` e no store global;
  - **atalhos de teclado** (← → Home End + -);
  - **zoom** e paginação;
  - **temas acessíveis** (paper, creme, sépia, escuro e **alto contraste**).
- **KPIs** (total, lendo, lidos, páginas lidas) na página inicial, com cartões animados.
- **UX polida**: transições suaves (framer-motion), skeletons, toasts, diálogos de confirmação, barra de progresso de navegação no header.

---

## ♿ Acessibilidade & Inclusão (inclui daltonismo)

- Leitor com **temas** que melhoram contraste (ex.: *Escuro* e **Alto contraste**).
- Botões e links com foco visível, rótulos ARIA e atalhos de teclado.
- Preferência por **texto claro em fundo escuro** nos temas para reduzir cansaço visual.
- Estrutura semântica (header/main/footer) e componentes com estados (`aria-busy`, `aria-pressed`, etc.).

> **Dica para daltonismo:** use o tema **Alto contraste** no leitor. O fundo preto com texto branco e bordas claras reduz ambiguidade de cor e melhora legibilidade.

---

## 🧱 Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **framer-motion** (animações)
- **react-pdf** (visualização de PDF)
- **Radix/shadcn** (UI primitives como `Progress`, `AlertDialog`)

---

## 📦 Pré‑requisitos

- Node 18+
- npm ou pnpm ou yarn

---

## 🚀 Instalação & Execução

```bash
# instalar dependências
npm install

# copiar o worker do PDF para /public (garante que o react-pdf use a versão correta)
# opção 1 – copiar do pdfjs-dist **que o react-pdf usa internamente**
mkdir -p public && cp node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/

# iniciar o dev server
npm run dev
```

Acesse: `http://localhost:3000`

> **Importante (PDF Worker):** manter a **mesma versão** de `pdfjs-dist` do `react-pdf`. Copiar o worker da pasta de `react-pdf` evita erro “API version … does not match Worker version …”. O código do leitor configura:
>
> ```ts
> pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
> ```

---

## 🗂️ Estrutura de pastas (essencial)

```
src/
├─ app/
│  ├─ page.tsx                 # Home (KPIs + Atualmente lendo)
│  ├─ library/page.tsx         # Listagem, filtros e cartões
│  └─ books/
│     ├─ new/page.tsx          # Formulário de novo livro
│     ├─ [id]/page.tsx         # Detalhes do livro + ações
│     └─ [id]/read/page.tsx    # Leitor de PDF
├─ components/
│  ├─ header.tsx               # Header com transições e progress bar
│  ├─ layout/Footer.tsx        # Footer com gradiente e animações
│  ├─ book/BookCard.tsx        # Cartão do livro (capa, tags, rating)
│  ├─ book/ReadOnlyStars.tsx   # Estrelas de leitura (somente display)
│  ├─ reader/PDFReader.tsx     # **Leitor de PDF** (temas, atalhos, progresso)
│  ├─ navigation/Breadcrumbs.tsx
│  ├─ ui/ConfirmDialog.tsx     # Diálogo de confirmação (Radix)
│  ├─ ui/ToastProvider.tsx     # Toaster global
│  ├─ ui/progress.tsx          # Progress (Radix/shadcn)
│  ├─ actions/AddBookFab.tsx   # Botão flutuante “Novo” com animação
│  └─ skeleton/…               # Skeletons reutilizáveis
├─ data/
│  ├─ store.ts                 # Persistência (localStorage) CRUD
│  └─ seed.ts                  # (Opcional) dados de exemplo
├─ store/books.tsx             # Contexto global (reducer + persistência)
└─ types/book.ts               # Tipos (Book, ReadingStatus, Genre)
```

Arquivos estáticos:
```
public/
├─ pdf.worker.min.mjs          # worker do PDF (copiado no pós‑install)
├─ ebooks/…                    # seus PDFs (ex.: /ebooks/meu-livro.pdf)
└─ covers/…                    # capas locais (opcional)
```

---

## ⚙️ Configurações importantes

### 1) next/image (caso use `Image` com URLs externas)
Adicione domínios de capa em `next.config.js` (ex.: imagens da Amazon):

```js
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};
```

Se usar `<img>` simples, não precisa desta configuração.

### 2) React‑PDF
- Worker em `/public/pdf.worker.min.mjs`.
- Evite SSR: o `PDFReader` faz **import dinâmico só no cliente**.
- Erros comuns e soluções:
  - **DOMMatrix is not defined** → importar `react-pdf` apenas no cliente.
  - **Worker version mismatch** → copiar worker da pasta do `react-pdf`.

### 3) Persistência
- Chave: `bookshelf:books:v1` (localStorage)
- O módulo `src/data/store.ts` cuida de ler/gravar. Você pode **remover** o `seed.ts` se não quiser dados de exemplo.

---

## 🧭 Fluxo de uso

1. **Adicionar livro** em `/books/new`.
   - Se o PDF estiver em `public/ebooks/`, use o caminho começando por `/ebooks/...`.
   - A capa pode ser URL externa ou arquivo em `public/covers/`.
2. **Listar e filtrar** em `/library`.
3. Abrir **detalhes** em `/books/[id]`: capa, metadados, progresso e ações.
4. Clicar em **Ler** → `/books/[id]/read`: o leitor abre **na última página lida**.

> Ao começar a ler (página > 1), o status pode ser promovido de `QUERO_LER` para `LENDO` (configurável no `PDFReader`/store).

---

## 🔐 Acessibilidade no leitor (daltônicos)

- Selecione **Tema** na toolbar do leitor:
  - *Paper* (padrão), *Creme*, *Sépia* → tons suaves para sessões longas.
  - *Escuro* → fundo escuro c/ texto claro.
  - **Alto contraste** → fundo preto e texto branco (recomendado para diferentes tipos de daltonismo).
- Atalhos (↑ conforto):
  - `←` / `→`: anterior/próxima página
  - `+` / `-`: zoom in/out
  - `Home` / `End`: primeira/última página

---

## 🧩 Dicas de desenvolvimento

- **Evite loops** de renderização usando somente **funções estáveis** do store nas dependências de hooks (`updateBook`).
- **Debounce** ao salvar progresso reduz escrita excessiva em localStorage/store.
- Use `prefers-reduced-motion` se quiser reduzir animações (opcional via Tailwind `motion-safe:` já aplicado em alguns pontos).

---

## 🛠️ Solução de problemas

**1) `Invalid src prop ... next/image ... hostname "localhost"`**
- Adicione `localhost`/domínios em `next.config.js` (ou use `<img>` simples).

**2) `DOMMatrix is not defined`**
- Garanta que `react-pdf` é carregado **apenas no cliente** (import dinâmico já implementado no `PDFReader`).

**3) `The API version X does not match the Worker version Y`**
- Copie o worker de `node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs` para `/public`.

**4) `Maximum update depth exceeded`**
- Não inclua objetos do contexto inteiro nas dependências dos efeitos; use apenas `updateBook` (função estável) e valores primitivos.

**5) Página do leitor volta para 1**
- Garanta que você passa `initialPage={book.currentPage ?? 1}` **ou** que o `localStorage` possui a chave `reading_progress_${book.id}`.

---

## 🗺️ Roadmap (sugestões)

- Upload de PDFs (drag & drop) com cópia automática para `/public/ebooks`.
- Sincronização opcional em nuvem (ex.: Supabase/Firestore).
- Estante com **coleções**/estrelas/etiquetas múltiplas.
- Estatísticas por período (gráficos).
- Exportar/importar coleção (JSON).

---

## 📄 Licença

Este projeto é distribuído sob a licença MIT. Sinta-se à vontade para usar e adaptar.

---

### 💬 Suporte
Ficou com dúvida ou quer evoluir algo específico? Abra uma issue ou comente o que deseja melhorar — a ideia é que este BookShelf seja seu **guia de leitura acolhedor** 😊

