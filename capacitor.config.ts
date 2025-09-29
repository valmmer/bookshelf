import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.bookshelf', // pode trocar para algo único
  appName: 'Bookshelf',
  webDir: 'public', // ou "build"/"dist", depende do seu projeto
  bundledWebRuntime: false
};

export default config;
