# OxfordBeat — Oxford 3000 Rhythm Typing Game

เกมพิมพ์คำศัพท์ภาษาอังกฤษแนว **Rhythm / Falling Notes** สไตล์ osu!mania & Cyber-Piano อ้างอิงคลังคำศัพท์ **Oxford 3000** ครบ 3,000 คำ (CEFR A1–B2) พร้อมคำแปลภาษาไทย ชนิดของคำ เสียงเปียโนสังเคราะห์ (Web Audio API) และเสียงอ่านคำศัพท์ (UK/US)

## Features

- **3,000 Oxford Words (A1–B2):** แยกคลัง JSON ตามระดับ (A1: 850, A2: 750, B1: 750, B2: 650) พร้อม POS badge และคำแปลไทย
- **Non-Repeating Shuffle Deck:** สุ่มด้วย Fisher–Yates และบันทึกคิวลง `localStorage` ไม่เจอคำซ้ำจนกว่าจะเล่นครบคลัง
- **60fps Rhythm Engine:** อัปเดตตำแหน่งผ่าน `requestAnimationFrame` + CSS `translate3d` พร้อม Canvas Particle FX
- **Web Audio Piano + 4-Channel Mixer:** เสียงโน้ตเปียโนไล่สเกล Pentatonic, ปรับระดับเสียงแยก `Master / Piano / SFX / Voice` ได้แบบ Real-time
- **Pronunciation (UK / US):** อ่านออกเสียงคำศัพท์อัตโนมัติเมื่อพิมพ์สำเร็จด้วย Web Speech API
- **Mobile & Desktop Ready:** เวทีเล่น 600px แบบ osu!mania บนจอคอม และ Virtual QWERTY Keyboard (พร้อมสลับคีย์บอร์ดระบบ) บนมือถือ

## Getting Started

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Verification

```bash
bun test
bun x tsc --noEmit
bun run lint
```

## Environment Variables (Optional, for SEO)

- `NEXT_PUBLIC_SITE_URL`: Canonical base URL for `sitemap.xml`, `robots.txt`, and Open Graph metadata (defaults to `https://oxfordbeat.vercel.app`).
