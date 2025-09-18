import React from 'react';

// Tipos de feedback possíveis
type FeedbackProps = {
  type: 'loading' | 'error' | 'success';
  message: string;
};

const Feedback: React.FC<FeedbackProps> = ({ type, message }) => {
  // Função para renderizar um loading spinner
  const renderLoading = () => (
    <div className="flex justify-center items-center">
      <div className="w-8 h-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
      <span className="ml-2 text-blue-500">{message}</span>
    </div>
  );

  // Função para renderizar uma mensagem de erro
  const renderError = () => (
    <div className="flex justify-center items-center text-red-500">
      <span className="material-icons">error</span>
      <span className="ml-2">{message}</span>
    </div>
  );

  // Função para renderizar uma mensagem de sucesso
  const renderSuccess = () => (
    <div className="flex justify-center items-center text-green-500">
      <span className="material-icons">check_circle</span>
      <span className="ml-2">{message}</span>
    </div>
  );

  return (
    <div className="py-4 px-6 border rounded-lg shadow-md">
      {type === 'loading' && renderLoading()}
      {type === 'error' && renderError()}
      {type === 'success' && renderSuccess()}
    </div>
  );
};

export default Feedback;
