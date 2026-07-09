# Villa Bond — лендинг

Одностраничный сайт продажи виллы (Раваи, Пхукет). Статический HTML/CSS/JS, двуязычный (RU `index.html` / EN `en.html`). Хостинг — GitHub Pages, домен **villabondphuket.com**.

## Публикация (GitHub Pages)

1. Создать репозиторий на GitHub (напр. `villa-bond-site`), публичный.
2. Запушить содержимое этой папки в ветку `main` (см. команды ниже).
3. **Settings → Pages** → Source: `main` / `/ (root)` → Save.
4. Файл `CNAME` уже содержит `villabondphuket.com` — Pages подхватит кастомный домен.
5. Настроить DNS в Namecheap (см. ниже), дождаться выдачи HTTPS-сертификата, включить **Enforce HTTPS**.

## DNS в Namecheap (Advanced DNS)

Apex-домен `villabondphuket.com` → 4 A-записи на GitHub Pages:

| Type | Host | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | `<username>.github.io.` |

(При желании AAAA-записи для IPv6: 2606:50c0:8000–8003::153.)

## Аналитика / пиксель

В `<head>` обоих файлов лежат закомментированные блоки: **GA4** (`G-XXXXXXX`), **Яндекс.Метрика** (`METRIKA_ID`), **Meta Pixel** (`PIXEL_ID`). Раскомментировать и подставить реальные ID перед запуском рекламы.

## Форма заявок

Форма шлёт на FormSubmit (`formsubmit.co/…`). Первая отправка требует подтверждения по e-mail — активировать до запуска трафика.

## Структура

- `index.html` / `en.html` — страницы
- `assets/styles.css`, `assets/script.js` — стили и логика
- `assets/img/` — фото, `assets/video/` — видео-луп и тур
- `robots.txt`, `sitemap.xml`, `CNAME`, `404.html`, `.nojekyll` — служебные
