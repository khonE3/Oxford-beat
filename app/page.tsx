import type { Metadata } from "next";
import { GameScreen } from "@/components/game/GameScreen";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "th_TH",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "OxfordBeat คือเกมอะไร?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OxfordBeat คือเว็บเกมพิมพ์คำศัพท์ภาษาอังกฤษแนว Rhythm / Falling Notes สไตล์ osu!mania และ Cyber-Piano ที่รวมคลังคำศัพท์ Oxford 3000 ครบ 3,000 คำ (ระดับ A1–B2) พร้อมคำแปลภาษาไทยและเสียงอ่าน UK/US",
      },
    },
    {
      "@type": "Question",
      name: "คลังคำศัพท์ Oxford 3000 ในเกมแบ่งระดับอย่างไรและสุ่มซ้ำไหม?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "แบ่งตามระดับ CEFR ได้แก่ A1–A2 Beginner, B1 Intermediate, B2 Upper-Intermediate และ All Levels โดยใช้ระบบ Fisher-Yates Shuffle Deck ที่บันทึกคิวลงเบราว์เซอร์ รับประกันไม่สุ่มเจอคำซ้ำจนกว่าจะเล่นครบทุกคำในโหมดนั้น",
      },
    },
    {
      "@type": "Question",
      name: "สามารถเล่น OxfordBeat บนมือถือหรือแท็บเล็ตได้หรือไม่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "เล่นได้ทั้งคอมพิวเตอร์และมือถือ บนหน้าจอมือถือจะมี Virtual QWERTY Keyboard พร้อมไฮไลต์ปุ่มถัดไปและปุ่มสลับคีย์บอร์ดระบบให้ใช้งานได้โดยไม่บังเส้น Hit Line",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <GameScreen />
    </>
  );
}
