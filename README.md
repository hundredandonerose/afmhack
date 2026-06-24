# Aldanba

Expo Go приложение для AFM AI Hackathon 2026, трек AI Shield. Aldanba проверяет QR-ссылку до открытия: камера или ручной ввод, offline ML-вердикт, объяснение риска, история на устройстве и экран модели.

## Запуск

```bash
npm install
npm start
```

Дальше откройте QR из терминала через Expo Go на телефоне. Backend не нужен.

## Что внутри

- `src/ml/qrshieldEngine.js` — локальный QR-Shield engine, функция `assess(url)`.
- `src/ml/qrshield_model.json` — встроенная обученная модель Gradient Boosted Trees.
- `src/ml/modelManager.ts` — загрузка встроенной модели и безопасный placeholder для обновления модели.
- `MODEL_URL` сейчас стоит как заглушка: `https://example.com/aldanba/qrshield_model.json`.
- `AsyncStorage` хранит историю проверок только на устройстве.

Детекция работает локально. URL не отправляется в ChatGPT, API или backend.

## Acceptance test

```bash
npm run typecheck
npm run test:acceptance
```

Ожидаемые проверки:

- `kaspi.kz` -> green
- `kaspi-pay.top` -> red
- `forms.gle/abc` -> green
- `bit.ly/x` -> yellow
- `summit2026.kz` -> yellow

В airplane mode уже встроенная модель продолжает работать. Если обновление `MODEL_URL` недоступно, приложение использует bundled model.
