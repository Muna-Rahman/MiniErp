import { VT323, Press_Start_2P } from "next/font/google";
import "./globals.css";

const body = VT323({ subsets: ["latin"], weight: "400", variable: "--font-body" });
const head = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-head" });

export const metadata = {
  title: "Mini ERP 95",
  description: "Retro-styled wholesale ERP: purchases, stock, sales and expenses.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${body.variable} ${head.variable}`}>
      <body>{children}</body>
    </html>
  );
}
