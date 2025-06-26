import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html
      lang="en"
      className="h-full"
      data-theme="brickred"
      suppressHydrationWarning
    >
      <Head />
      <body className="h-full dark:bg-backgroundColor dark:text-textColor">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
