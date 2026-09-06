# Deploy EngBoost lên Vercel

App là **Next.js fullstack** → chỉ cần **1 project Vercel** (frontend + API chung).
Database dùng **Postgres trên cloud** (khuyến nghị **Neon**). DB Docker ở máy bạn
(localhost:5433) chỉ dùng khi dev, **không** dùng cho production.

## ✅ Đã chuẩn bị sẵn trong code
- `build` script đã có `prisma generate` (Vercel tự sinh Prisma Client khi build).
- `postinstall` cũng chạy `prisma generate`.
- Script `pnpm db:deploy` = `prisma migrate deploy` (chạy migration lên DB thật).
- Đã `next build` thử → pass. `typecheck` / `lint` / `test` xanh.

## Bước 1 — Tạo database cloud (Neon)
1. Tạo tài khoản tại https://neon.tech → New Project (chọn region gần bạn).
2. Lấy **Connection string** — dùng bản **Pooled** (host có `-pooler`), dạng:
   ```
   postgresql://<user>:<pass>@ep-xxx-pooler.<region>.aws.neon.tech/<db>?sslmode=require
   ```
   (Pooled quan trọng vì Vercel serverless mở nhiều kết nối.)

## Bước 2 — Đưa schema lên DB cloud (chạy 1 lần, từ máy bạn)
```bash
# PowerShell: $env:DATABASE_URL="<neon-url>"; pnpm db:deploy
DATABASE_URL="<neon-pooled-url>" pnpm db:deploy
```
(Tuỳ chọn tạo dữ liệu mẫu: `DATABASE_URL="<neon-url>" pnpm db:seed` — không bắt buộc;
để trống thì tài khoản admin đầu tiên bạn đăng ký sẽ bắt đầu từ dữ liệu rỗng.)

## Bước 3 — Import repo vào Vercel
1. Push code mới nhất lên GitHub (repo `mountson0327/engboost`).
2. https://vercel.com → **Add New → Project** → chọn repo `engboost` → **Import**.
3. Framework tự nhận **Next.js**. Không cần chỉnh build/output.

## Bước 4 — Đặt Environment Variables trên Vercel
Trong project Vercel → **Settings → Environment Variables** (Production + Preview):

| Biến | Giá trị |
|---|---|
| `DATABASE_URL` | chuỗi **pooled** của Neon (Bước 1) |
| `AUTH_SECRET` | chuỗi bí mật mạnh — tạo bằng `openssl rand -hex 32` (hoặc `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `ANTHROPIC_API_KEY` | (tuỳ chọn) — hoặc nhập trong `/settings` |
| `OPENAI_API_KEY` | (tuỳ chọn) |
| `GEMINI_API_KEY` | (tuỳ chọn) |

> `AUTH_SECRET` **bắt buộc** cho production (ký session đăng nhập). Đừng dùng lại
> secret trong `.env` dev; tạo secret mới cho prod.

## Bước 5 — Deploy & dùng
1. Bấm **Deploy**. Xong Vercel cho URL `https://engboost-xxx.vercel.app`.
2. Mở URL → tự chuyển sang `/register` → **tài khoản đầu tiên = admin**.
3. Đăng nhập, dùng bình thường. Người khác đăng ký sẽ là **user thường**.

## Khi cập nhật code sau này
- `git push` → Vercel tự build & deploy lại.
- Nếu **đổi Prisma schema**: chạy lại `DATABASE_URL="<neon-url>" pnpm db:deploy`
  trước hoặc sau khi push (migration không tự chạy khi Vercel build).

## Lưu ý
- **Bảo mật**: app đã có auth + phân quyền; API key AI của mỗi tài khoản lưu ở DB.
  Key lưu **plaintext** (hợp cho dùng cá nhân/nhóm nhỏ); muốn mã hoá at-rest thì
  cần thêm khoá mã hoá riêng.
- **Chưa có**: đổi mật khẩu / quên mật khẩu (nên thêm nếu mở công khai).
- **Kết nối DB**: giữ `@prisma/adapter-pg` — chạy được cả Docker (dev) lẫn Neon
  (prod, dùng chuỗi pooled). Không cần đổi code.
