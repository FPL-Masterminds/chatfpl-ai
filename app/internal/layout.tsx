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
          margin: 0 !important;
          padding: 0 !important;
          min-width: 1080px !important;
          min-height: 1080px !important;
          overflow: auto !important;
          background: #ffffff !important;
        }
      `}</style>
      {children}
    </>
  );
}
