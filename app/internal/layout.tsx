import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        html, body {
          width: 1080px !important;
          height: 1080px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #000 !important;
        }
      `}</style>
      {children}
    </>
  );
}
