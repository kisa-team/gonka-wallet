import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import type { ReactNode } from "react";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Gonka Wallet",
    description: "Gonka Wallet",
};

export const viewport: Viewport = {
    initialScale: 1,
    width: 100,
    height: 100,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="en" className={"text-[14px] min-[390px]:text-[16px] dark"}>
            <head>
                <link rel="icon" href="/images/logo.png" sizes="any" />
                <link rel="apple-touch-icon" href="/images/logo.png" type="image/png" sizes="any" />
            </head>
            <body className={`${inter.variable} antialiased`}>{children}</body>
        </html>
    );
}
