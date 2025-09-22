// middleware.ts (na raiz do projeto)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/*
  Aplica o middleware nas rotas abaixo.
  - /api/upload → rota de upload dos arquivos
  - /admin/*    → páginas administrativas (opcional)
*/
export const config = {
  matcher: ['/api/upload', '/admin/:path*'],
};

export function middleware(req: NextRequest) {
  // Em dev, mantém liberado para facilitar testes locais
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  // Em produção, exija token
  const expected = process.env.ADMIN_TOKEN;
  const token =
    req.cookies.get('admin_token')?.value || req.headers.get('x-admin-token');

  // Se não configurou ADMIN_TOKEN, não bloqueia (evita travar deploys por engano)
  if (!expected) return NextResponse.next();

  if (token !== expected) {
    return new NextResponse('Não autorizado', { status: 401 });
  }

  return NextResponse.next();
}
