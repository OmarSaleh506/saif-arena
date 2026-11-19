/* يرفع الملفات الكبيرة (الموشن) إلى تخزين S3 المتوافق. يشغّله المطوّر/CI، وليس جزءًا من الحاوية.
   الإعداد من البيئة: S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_FORCE_PATH_STYLE
   الاستعمال: npm run upload-assets -- ./assets/video/saif-loader.mp4 video/saif-loader.mp4 */
import { readFileSync } from 'node:fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const [, , local, key] = process.argv;
const need = ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'].filter(k => !process.env[k]);
if (!local || !key || need.length) { console.error('usage: upload-assets <local-file> <object-key>; missing env: ' + need.join(', ')); process.exit(2); }
const s3 = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || undefined,   // قابل للتجاوز: التخزين متوافق مع S3 وليس بالضرورة AWS
  forcePathStyle: /^(1|true)$/i.test(process.env.S3_FORCE_PATH_STYLE || ''),
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
});
await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: readFileSync(local), ContentType: key.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream', CacheControl: 'public, max-age=86400' }));
console.log('uploaded', key);
