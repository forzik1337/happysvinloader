# 🎬 happysvinloader

> Самый пиздатый сайт для скачивания VOD и клипов с Twitch.

**🌐 Сайт:** [happysvinloader.pages.dev](https://happysvinloader.pages.dev)

---

## Что это

Простой браузерный загрузчик VOD и клипов с Twitch. Никаких приложений, никакой регистрации — просто вставил ссылку и скачал.

**Что умеет:**
- Скачивать клипы в разных качествах
- Скачивать VOD целиком или нарезать нужный кусок прямо в браузере
- Работает через CORS-прокси на Cloudflare Workers — без него Twitch CDN блокирует запросы из браузера

---

## Как пользоваться

1. Открой [happysvinloader.pages.dev](https://happysvinloader.pages.dev)
2. Вставь ссылку на VOD или клип:
   - `https://www.twitch.tv/videos/1234567890`
   - `https://www.twitch.tv/канал/clip/НазваниеКлипа`
3. Выбери качество и скачай

---

## Если хочешь поднять свой прокси

Сайт использует Cloudflare Worker как CORS-прокси. Можешь задеплоить свой за 5 минут бесплатно:

1. Зайди на [workers.cloudflare.com](https://workers.cloudflare.com) и залогинься
2. **Create application → Start with Hello World**
3. Удали шаблонный код, вставь содержимое файла `worker.js` из этого репозитория
4. Нажми **Deploy**
5. Скопируй адрес воркера вида `https://ИМЯ.САБДОМЕН.workers.dev`
6. На сайте нажми **настройки** (левый сайдбар) и вставь:
   ```
   https://ИМЯ.САБДОМЕН.workers.dev/?url=
   ```

Бесплатного лимита Cloudflare (100 000 запросов/день) для личного использования хватит с запасом.

---

## Стек

- Чистый HTML/CSS/JS — никаких фреймворков
- Cloudflare Pages — хостинг
- Cloudflare Workers — CORS-прокси
- Twitch GQL API — получение данных о видео

---

## Лицензия

Делай что хочешь. (только звёздочку поставь )) <img width="180" height="48" alt="image" src="https://github.com/user-attachments/assets/50f8a94b-a80e-4ca3-a5bb-1b830bc22d7e" />

