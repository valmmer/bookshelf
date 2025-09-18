'use client'; // Garantir que esse código seja executado no cliente (navegador)

import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LibraryFilter() {
  // Estado para o texto de pesquisa e filtro de status
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Usando o roteador para aplicar a pesquisa e o filtro
  const router = useRouter();

  // Função para atualizar o texto de pesquisa
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Função para atualizar o filtro de status
  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value);
  };

  // Função para submeter o formulário de pesquisa e filtros
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(`/library?search=${searchQuery}&status=${statusFilter}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-4 p-4 bg-white shadow-md rounded-md"
    >
      {/* Campo de pesquisa */}
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Buscar livro..."
        className="border p-2 rounded"
      />
      {/* Filtro de status */}
      <select
        value={statusFilter}
        onChange={handleStatusChange}
        className="border p-2 rounded"
      >
        <option value="ALL">Todos os status</option>
        <option value="LENDO">Lendo</option>
        <option value="LIDO">Lido</option>
        <option value="PAUSADO">Pausado</option>
        <option value="ABANDONADO">Abandonado</option>
      </select>
      {/* Botão para submeter o filtro */}
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Buscar
      </button>
    </form>
  );
}
