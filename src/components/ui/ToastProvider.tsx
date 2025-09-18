'use client'; // Garantir que este código seja executado no cliente (navegador)

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

// Definindo o tipo do Toast, que contém:
// - `id`: Identificador único do toast (gerado dinamicamente)
// - `title`: Título opcional do toast
// - `message`: Mensagem principal do toast (obrigatória)
// - `variant`: Tipo do toast, que pode ser 'success', 'error', 'info'.
// - `duration`: Duração em milissegundos que o toast ficará visível (padrão: 3500ms)
type Toast = {
  id: string;
  title?: string;
  message: string;
  variant?: 'success' | 'error' | 'info';
  duration?: number;
};

// Contexto para o Toast, que expõe a função `showToast` para exibir notificações
type ToastContextType = {
  showToast: (t: Omit<Toast, 'id'>) => void; // Função para exibir o toast, sem o ID
};

// Criando o contexto do Toast, que será usado para fornecer o estado e a função para exibir toasts
const ToastContext = createContext<ToastContextType | null>(null);

// Hook customizado para acessar a função `showToast` do contexto
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// Componente que fornece o contexto de Toast para toda a aplicação
export function ToastProvider({ children }: { children: React.ReactNode }) {
  // Estado para armazenar os toasts visíveis na tela
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Função para exibir um novo toast
  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    // Gerando um ID único para cada toast
    const id = `${Date.now()}-${Math.random()}`; // Usando Date.now() e Math.random() para gerar um ID único
    // Completando o objeto do toast com os dados e o ID gerado
    const toast: Toast = { id, duration: 3500, variant: 'info', ...t };

    // Atualizando o estado com o novo toast
    setToasts((prev) => [...prev, toast]);

    // Remover o toast após o tempo de duração
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id)); // Remover o toast com o ID correspondente
    }, toast.duration);
  }, []);

  // Fornecendo a função `showToast` para os componentes filhos via contexto
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Container fixo no topo-direita para exibir os toasts */}
      <div
        className="fixed right-4 top-4 z-[1000] flex flex-col gap-2"
        role="region" // Definindo o papel da região para leitores de tela
        aria-live="assertive" // As notificações precisam ser anunciadas imediatamente
        aria-atomic="true" // Garantir que a adição de novas mensagens seja anunciada
        aria-relevant="additions" // Garantir que apenas as adições sejam anunciadas
      >
        {/* Mapeando e exibindo todos os toasts na tela */}
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status" // O toast é uma mensagem de status que pode ser lida por leitores de tela
            className={[
              'w-[min(90vw,360px)] rounded-xl border px-4 py-3 shadow-lg transition-all', // Estilos básicos para o toast
              t.variant === 'success' &&
                'border-green-300 bg-green-50 text-green-900', // Estilo para toasts de sucesso
              t.variant === 'error' && 'border-red-300 bg-red-50 text-red-900', // Estilo para toasts de erro
              t.variant === 'info' &&
                'border-slate-300 bg-white text-slate-900', // Estilo para toasts informativos
            ].join(' ')} // Combinando as classes do Toast com base no tipo (sucesso, erro, info)
          >
            {/* Se o toast tiver título, exibe o título */}
            {t.title && <p className="mb-0.5 font-medium">{t.title}</p>}
            {/* Exibindo a mensagem do toast */}
            <p className="text-sm opacity-90">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
