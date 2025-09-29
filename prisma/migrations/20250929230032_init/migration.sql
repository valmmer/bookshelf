/*
  Warnings:

  - The primary key for the `Book` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cover` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `pages` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `pdfUrl` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `synopsis` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Book` table. All the data in the column will be lost.
  - You are about to alter the column `genreId` on the `Book` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `id` on the `Book` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `Genre` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Genre` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Made the column `author` on table `Book` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Book" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "genreId" INTEGER,
    "isbn" TEXT,
    "currentPage" INTEGER,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TO_READ',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Book" ("author", "createdAt", "currentPage", "genreId", "id", "isbn", "notes", "status", "title", "updatedAt") SELECT "author", "createdAt", "currentPage", "genreId", "id", "isbn", "notes", "status", "title", "updatedAt" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");
CREATE TABLE "new_Genre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Genre" ("id", "name") SELECT "id", "name" FROM "Genre";
DROP TABLE "Genre";
ALTER TABLE "new_Genre" RENAME TO "Genre";
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
