module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4A90E2',
        secondary: '#50E3C2',
        background: '#f5f5f5', // Cor de fundo do layout
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      spacing: {
        128: '32rem', // Exemplo de espaçamento customizado
      },
      borderRadius: {
        xl: '1rem', // Exemplo de borda arredondada personalizada
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Para melhorar o estilo dos formulários
    require('@tailwindcss/typography'), // Melhorar tipografia
    require('@tailwindcss/aspect-ratio'), // Controle de proporções de vídeos e imagens
  ],
};
