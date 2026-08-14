import type { Metadata } from "next";

// НАЗВАНИЕ ВКЛАДКИ В БРАУЗЕРЕ (Как вы и просили!)
export const metadata: Metadata = {
  title: "No simple counter",
  description: "Amazing counter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        {/* Железный, принудительный сброс шрифтов для ВСЕХ элементов сайта */}
        <style>{`
          * {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            box-sizing: border-box !important;
          }
          body {
            margin: 0;
            background-color: transparent;
          }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
