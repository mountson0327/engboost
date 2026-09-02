# EngBoost — App học tiếng Anh cá nhân

Web app giúp tự học tiếng Anh: **từ vựng + lặp lại ngắt quãng (SRS)**, **luyện tập
với AI**, **quiz**, và **đọc–nghe–phát âm**. Thiết kế cho 1 người dùng trước, nhưng
mọi dữ liệu gắn `userId` để mở rộng multi-user sau này.

## Tech stack

- **Next.js 16** (App Router, Route Handlers) + **React 19** + **Tailwind 4**
- Font **Inter** (kèm subset `vietnamese`)
- **shadcn/ui** (style base-nova, trên Base UI) + **@animateicons/react** (icon động)
- **Đa ngôn ngữ VI/EN** (mặc định VI) — i18n gọn nhẹ bằng cookie + context
  ([src/lib/i18n](src/lib/i18n)); đổi ngôn ngữ ở góc phải thanh điều hướng
- **Prisma 7** + **PostgreSQL** (qua driver adapter `@prisma/adapter-pg`)
- **Zod** (validate API), **Anthropic Claude** cho AI (có fallback khi thiếu key)
- **Web Speech API** cho phát âm (miễn phí), **dictionaryapi.dev** cho tra từ

> **Tailwind v4 không có file `tailwind.config.js`** — cấu hình theme nằm trong
> [src/app/globals.css](src/app/globals.css) (block `@theme` + biến CSS). Thêm
> component shadcn: `pnpm dlx shadcn@latest add <tên>`.

## Yêu cầu

- Node >= 20, pnpm >= 10, Docker Desktop (cho Postgres)

## Chạy local

```bash
pnpm install
pnpm db:up        # bật Postgres (Docker, cổng 5433)
pnpm db:migrate   # tạo schema
pnpm db:seed      # thêm 1 bộ từ mẫu (6 từ)
pnpm dev          # http://localhost:3000
```

Trang chủ có **badge DB OK** (xanh = web ↔ Postgres thông suốt) và badge **AI:
fallback / Claude**.

## Bật Claude (tuỳ chọn)

Mặc định app chạy đầy đủ luồng bằng **fallback** (không cần key). Muốn dùng Claude
thật, thêm vào `.env`:

```
ANTHROPIC_API_KEY="sk-ant-..."
# ANTHROPIC_MODEL="claude-sonnet-5"   # tuỳ chọn
```

## Tính năng

| Trang | Chức năng |
|---|---|
| `/` | Dashboard: thẻ due hôm nay, tổng thẻ, đã thuộc, quiz gần đây |
| `/decks` | Tạo/xoá bộ từ; **nhập bộ từ** từ file; thêm thẻ, nút **✨ AI điền** |
| `/decks/[id]` | Chi tiết bộ từ; **Xuất JSON/CSV**, **Nhập file** (.json/.csv); **✍️ Đặt câu** dùng từ → AI chấm ngữ pháp/cách dùng/độ tự nhiên + điểm & CEFR (lưu vào thẻ) |
| `/review` | Ôn tập flashcard, tự chấm **Again/Hard/Good/Easy** (thuật toán SM-2) |
| `/quiz` | Sinh quiz trắc nghiệm từ bộ từ (ưu tiên từ hay sai), chấm điểm |
| `/read` | Sinh/dán bài đọc, **click từ để tra + 🔊 + thêm vào bộ từ** |
| `/chat` | Hội thoại luyện tập + kiểm tra ngữ pháp |

## Scripts

- `pnpm dev` / `build` / `start`
- `pnpm typecheck` · `pnpm lint` · `pnpm test`
- `pnpm db:up` / `db:down` / `db:migrate` / `db:seed` / `db:studio`

## Cấu trúc

```
src/
  app/            # trang + API route handlers
    api/          # decks, cards, review, quiz, ai/*, lookup
  lib/
    srs.ts        # thuật toán SM-2 (có test: srs.test.ts)
    ai/claude.ts  # tích hợp Claude + fallback
    db.ts         # Prisma client (pg adapter)
    validation/   # Zod schemas
  generated/prisma/  # Prisma client (tự sinh, không commit)
prisma/
  schema.prisma   # data model
  seed.ts         # dữ liệu mẫu
```

## Lộ trình tiếp theo

- Multi-user: thêm auth (Auth.js), tách dữ liệu theo user thật
- Chấm phát âm qua mic, PWA offline
- Thống kê tiến độ nâng cao (biểu đồ, streak theo ngày)
