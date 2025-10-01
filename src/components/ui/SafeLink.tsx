'use client';

import Link, { LinkProps } from 'next/link';
import * as React from 'react';

function isValidHref(h: any): h is string {
  if (!h) return false;
  const s = String(h).trim();
  if (!s || s === 'undefined' || s === 'null' || s === '#') return false;
  return (
    s.startsWith('/') || s.startsWith('http://') || s.startsWith('https://')
  );
}

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
  Omit<LinkProps, 'href'> & {
    href?: string; // opcional de propósito
    children: React.ReactNode;
    prefetch?: boolean;
  };

export default function SafeLink({
  href,
  children,
  prefetch = false,
  className,
  ...rest
}: Props) {
  if (!isValidHref(href)) {
    // Sem href válido? Vira um span inofensivo (sem navegação/prefetch)
    return (
      <span
        aria-disabled="true"
        role="link"
        tabIndex={-1}
        className={className + ' opacity-60 cursor-not-allowed'}
        {...rest}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={className}
      {...(rest as any)}
    >
      {children}
    </Link>
  );
}
