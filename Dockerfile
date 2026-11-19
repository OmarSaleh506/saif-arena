# syntax=docker/dockerfile:1
# صورة واحدة لكل العمليات: الويب (الافتراضي) وأمر الهجرة (node src/migrate.mjs).

# --- المرحلة 1: تثبيت اعتماديات التشغيل فقط (طبقة مخزّنة تتغير فقط عند تغيّر المانيفست) ---
FROM node:22.11.0-alpine3.20 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# --- المرحلة 2: الصورة النهائية (بلا أدوات بناء) ---
FROM node:22.11.0-alpine3.20
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY migrations ./migrations
COPY public ./public
# مستخدم غير root
USER node
EXPOSE 8080
# صيغة exec: تصل إشارة SIGTERM مباشرة إلى عملية Node للإيقاف التدريجي
CMD ["node", "src/main.mjs"]
