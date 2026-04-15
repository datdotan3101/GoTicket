# GoTicket Backend (Phase 4)

## Mục tiêu hiện tại
- Dựng backend nền tảng theo clean architecture + DRY.
- Ưu tiên dịch vụ 100% free tier.
- Triển khai luồng ticket end-to-end: `tickets`, `payments`, `checkin`, `notifications`, `approvals`.
- Triển khai core modules còn thiếu: `news`, `clubs`, `leagues`, `stadiums`, `users`.

## Cách chạy local
1. Cài dependency:
   ```bash
   npm install
   ```
2. Tạo `.env` từ `.env.example`.
3. Chạy lần lượt migrations:
   - `database/migrations/001_init_core.sql`
   - `database/migrations/002_phase2_ticketing.sql`
   - `database/migrations/003_phase3_publish_support.sql`
   - `database/migrations/004_phase4_core_modules.sql`
4. Chạy server:
   ```bash
   npm run dev
   ```

## API đã có
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/onboarding`
- `GET /api/sports`
- `POST /api/sports` (admin)
- `PUT /api/sports/:id` (admin)
- `DELETE /api/sports/:id` (admin)
- `GET /api/matches`
- `GET /api/matches/:id`
- `GET /api/matches/:id/seats`
- `POST /api/matches` (manager)
- `POST /api/matches/:id/submit` (manager)
- `POST /api/matches/stands/preview` (manager)
- `PUT /api/matches/:id/stands` (manager)
- `POST /api/tickets/book` (audience)
- `GET /api/tickets/my` (audience)
- `POST /api/payments/create-intent` (audience)
- `POST /api/payments/webhook` (public, Stripe)
- `POST /api/checkin/scan` (checker)
- `GET /api/checkin/match/:id/stats` (checker)
- `GET /api/notifications` (auth user)
- `PUT /api/notifications/:id/read` (auth user)
- `GET /api/approvals/pending` (admin)
- `POST /api/approvals/:id/approve` (admin)
- `POST /api/approvals/:id/reject` (admin)
- `GET /api/news` (public)
- `GET /api/news/:slug` (public)
- `POST /api/news` (editor)
- `PUT /api/news/:id` (editor)
- `DELETE /api/news/:id` (editor)
- `POST /api/news/:id/submit` (editor)
- `GET /api/clubs` (public)
- `POST /api/clubs` (admin)
- `PUT /api/clubs/:id` (admin)
- `DELETE /api/clubs/:id` (admin)
- `GET /api/leagues` (public)
- `POST /api/leagues` (admin)
- `PUT /api/leagues/:id` (admin)
- `DELETE /api/leagues/:id` (admin)
- `GET /api/stadiums` (public)
- `POST /api/stadiums` (admin)
- `PUT /api/stadiums/:id` (admin)
- `DELETE /api/stadiums/:id` (admin)
- `GET /api/users` (admin)
- `PUT /api/users/:id/role` (admin)
- `PUT /api/users/:id/active` (admin)

## Lưu ý
- Stripe local webhook: `stripe listen --forward-to localhost:5000/api/payments/webhook`
- Route webhook cần `STRIPE_WEBHOOK_SECRET` đúng từ Stripe CLI/dashboard.
- QR token được ký bằng `QR_JWT_SECRET` (fallback `JWT_SECRET` nếu chưa set).
- Socket.IO events đã có:
  - `join:match` (client -> server)
  - `join:user` (client -> server)
  - `seat:booked`, `seat:checked_in`, `checkin:stats`, `notification:new` (server -> client)
- Cron jobs chạy mỗi phút khi server start:
  - Scheduled publish (`matches`, `news`)
  - Match reminder email (60 phút trước trận)
- Luồng đăng ký đã tạo approval `user_account` để admin duyệt tài khoản mới.
