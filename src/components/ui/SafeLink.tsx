import * as React from 'react';
import Link from 'next/link';

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  external?: boolean;
};

export function SafeLink({ href, external, children, ...rest }: Props) {
  const isExternal = external ?? /^https?:\/\//i.test(href);
  if (isExternal) {
    return (
      <a href={href} rel="noopener noreferrer" target="_blank" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
