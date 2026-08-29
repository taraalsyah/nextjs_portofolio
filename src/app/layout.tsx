import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tasktuntas.com"),
  title: {
    default: "TaskTuntas — Platform Manajemen Task & Proyek Modern",
    template: "%s | TaskTuntas",
  },
  description:
    "TaskTuntas adalah aplikasi manajemen proyek dan task modern yang dilengkapi dengan fitur RBAC, workflow approval (Request to Done & Request to Close), analisis produktivitas, dan AI Assistant.",
  keywords: [
    "TaskTuntas",
    "Task Management",
    "Project Management",
    "Aplikasi Manajemen Task",
    "Workflow Approval",
    "RBAC",
    "Task Tracking",
    "SaaS",
    "Next.js",
    "React",
  ],
  authors: [{ name: "TaskTuntas Team" }],
  creator: "TaskTuntas",
  publisher: "TaskTuntas",
  alternates: {
    canonical: "https://tasktuntas.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://tasktuntas.com",
    siteName: "TaskTuntas",
    title: "TaskTuntas — Platform Manajemen Task & Proyek Modern",
    description:
      "Aplikasi manajemen proyek dan task modern yang dilengkapi dengan fitur RBAC, workflow approval, analisis produktivitas, dan AI Assistant.",
    images: [
      {
        url: "https://tasktuntas.com/task_management.png",
        width: 1200,
        height: 630,
        alt: "TaskTuntas Task Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskTuntas — Platform Manajemen Task & Proyek Modern",
    description:
      "Aplikasi manajemen proyek dan task modern dengan fitur RBAC, workflow approval, dan AI Assistant.",
    images: ["https://tasktuntas.com/task_management.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "TaskTuntas",
  "operatingSystem": "Web",
  "applicationCategory": "BusinessApplication",
  "url": "https://tasktuntas.com",
  "description":
    "Aplikasi manajemen proyek dan task modern yang dilengkapi dengan fitur RBAC, workflow approval (Request to Done & Request to Close), analisis produktivitas, dan AI Assistant.",
  "offers": {
    "@type": "Offer",
    "price": "30000",
    "priceCurrency": "IDR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
