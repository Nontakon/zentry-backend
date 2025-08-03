// apps/web/src/app/layout.tsx
import './globals.css'; // Make sure you have a globals.css file with Tailwind directives

export const metadata = {
  title: 'Bacefook Analytics',
  description: 'Social network data analytics platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-200 font-sans">{children}</body>
    </html>
  );
}
