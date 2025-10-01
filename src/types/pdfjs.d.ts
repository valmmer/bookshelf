declare module 'pdfjs-dist/build/pdf' {
  const pdfjsLib: any;
  export = pdfjsLib;
}

declare module 'pdfjs-dist/*' {
  const anyModule: any;
  export = anyModule;
}

/** Permite importar a URL de assets (*.mjs) como string */
declare module '*.mjs?url' {
  const url: string;
  export default url;
}
