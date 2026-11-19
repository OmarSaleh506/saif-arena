-- وثيقة التطبيق الواحدة (الجولات والإعدادات). آمنة التكرار.
CREATE TABLE IF NOT EXISTS app_data (
  key        text PRIMARY KEY,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
