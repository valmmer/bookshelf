-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "year" INTEGER,
    "pages" INTEGER,
    "rating" REAL,
    "synopsis" TEXT,
    "cover" TEXT,
    "pdfUrl" TEXT,
    "genreId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUERO_LER',
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "isbn" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE INDEX "Book_createdAt_idx" ON "Book"("createdAt");

-- CreateIndex
CREATE INDEX "Book_status_idx" ON "Book"("status");
