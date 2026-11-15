#!/bin/sh
# يعيد بناء المجسّم ثلاثي الأبعاد إلى public/js/expo3d.js (يحتاج npm install مرة واحدة)
cd "$(dirname "$0")" && npm install && npx esbuild src/main.js --bundle --minify --format=iife --target=es2020 --outfile=../public/js/expo3d.js
