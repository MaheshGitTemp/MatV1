# FROM node:22-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# EXPOSE 9012
# CMD ["npm", "start"]
FROM node:22-alpine
WORKDIR /app

# ── Fonts for Sharp/libvips SVG text rendering ────────────────────────────────
# The watermark is composited from an SVG <text> element. Alpine ships with NO
# fonts, so librsvg/fontconfig can't rasterize the glyphs and the text renders
# as missing-glyph boxes (□□□). Install a Unicode sans-serif family + fontconfig
# so "font-family: ... sans-serif" resolves to a real face. ttf-dejavu provides
# the sans-serif fallback; fontconfig builds the font cache.
RUN apk add --no-cache fontconfig ttf-dejavu font-noto \
    && fc-cache -f

COPY package*.json ./
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
ENV npm_config_sharp_binary_host=https://npmmirror.com/mirrors/sharp
RUN npm install
COPY . .
EXPOSE 9012
CMD ["npm", "start"]