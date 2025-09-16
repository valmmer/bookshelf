// src/types/book.ts

export type ReadingStatus =
  | 'QUERO_LER'
  | 'LENDO'
  | 'LIDO'
  | 'PAUSADO'
  | 'ABANDONADO';

export interface Book {
  id: string;
  title: string; // obrigatório
  author: string; // obrigatório
  genre?: string; // você pode trocar para 'Genre' se quiser restringir aos valores de GENRES
  year?: number;
  pages?: number; // total de páginas
  currentPage?: number; // página atual (progresso)
  rating?: number; // 1-5
  synopsis?: string;
  cover?: string; // URL da imagem de capa (http(s):// ou /path)
  status?: ReadingStatus;
  isbn?: string;
  notes?: string;

  /**
   * Caminho/URL do PDF para leitura.
   * Ex.: '/ebooks/dezesseis-luas-kami-garcia.pdf'
   * Dica: coloque o arquivo em public/ebooks/ e informe começando por /ebooks/…
   */
  fileUrl?: string;
}

export const GENRES = [
  'Literatura Brasileira',
  'Ficção Científica',
  'Realismo Mágico',
  'Ficção',
  'Fantasia',
  'Romance',
  'Biografia',
  'História',
  'Autoajuda',
  'Tecnologia',
  'Programação',
  'Negócios',
  'Psicologia',
  'Filosofia',
  'Poesia',
] as const;

export type Genre = (typeof GENRES)[number];
// Se quiser restringir o campo 'genre' aos valores acima, troque na interface:
//   genre?: Genre;
