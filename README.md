# Aldanba

Expo Go приложение для AFM AI Hackathon 2026, трек AI Shield. Aldanba проверяет QR-ссылку до открытия: камера, ручной ввод, демо-режим, offline ML-вердикт, объяснение риска, история, статистика и локальные репорты.

## Запуск

```bash
npm install
npm start
```

Дальше откройте QR из терминала через Expo Go на телефоне. Backend не нужен.

## Что внутри

- `src/ml/qrshieldEngine.js` — локальный QR-Shield engine, функция `assess(url)`.
- `src/ml/qrshield_model.json` — встроенная обученная модель Gradient Boosted Trees.
- `src/screens/ScanScreen.tsx` — камера, ручной ввод, demo URLs и анимация анализа.
- `src/components/ResultModal.tsx` — gauge, причины, действия и «Сообщить о мошенничестве».
- `AsyncStorage` хранит историю и локальную очередь репортов только на устройстве.

Детекция работает локально. URL не отправляется в ChatGPT, API или backend. Репорты не переобучают модель на телефоне: они только попадают в локальную очередь для будущего модерируемого обновления.

## Acceptance test

```bash
npm run typecheck
npm run test:acceptance
```

Ожидаемые проверки:

- `https://kaspi.kz` -> green
- `https://egov.kz` -> green
- `https://kaspi-pay.top/login` -> red
- `http://halyk-bank.kz.verify-account.xyz` -> red
- `http://192.168.4.21/kaspi/pay` -> red
- `https://bit.ly/kaspi-bonus` -> yellow + neutral, без процента риска

В airplane mode встроенная модель продолжает работать. Вердикты являются risk flags, не гарантиями; точность модели ≈97.6%.
