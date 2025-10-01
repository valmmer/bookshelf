// prisma/seed.ts
import { prisma } from '../src/lib/prisma';

async function main() {
  // Seed propositalmente vazio.
  // Mantemos o arquivo só para o script "npm run db:seed" não quebrar.
  // Se um dia quiseres criar dados de teste, põe aqui — por padrão, não cria nada.
  return;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
