/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Document_url_key" ON "Document"("url");
