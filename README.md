# Лабораторная работа №3 — Прототип интернет-магазина (React + Redux)

Веб-приложение — прототип интернет-магазина, реализованный тремя различными подходами к управлению состоянием.

## Структура проекта

```
react_lb3/
├── server/                      # Mock-сервер (json-server)
├── approach-1-redux-thunk/      # Redux + redux-thunk
├── approach-2-rtk-slice/        # @reduxjs/toolkit (createSlice)
├── approach-3-rtk-query/        # @reduxjs/toolkit + RTK Query
```

## Функциональность

1. **Список товаров** — загрузка товаров с сервера, добавление в корзину
2. **Корзина** — управление количеством, удаление товаров, оформление заказа
3. **Оформление заказа** — многоступенчатая симуляция оплаты (доставка → оплата → подтверждение)
4. **Список заказов** — просмотр истории заказов пользователя
5. **Регистрация и авторизация** — страницы входа и регистрации

## Запуск

### 1. Запуск сервера

```bash
cd server
npm install
npm start
```

Сервер будет доступен на `http://localhost:3001`.

### 2. Запуск любого из подходов

```bash
cd approach-1-redux-thunk   # или approach-2-rtk-slice / approach-3-rtk-query
npm install
npm run dev
```

Приложение будет доступно на `http://localhost:5173`.

## Три подхода

### Подход 1: Redux + redux-thunk
Классический Redux с ручным созданием action types, action creators и reducers. Асинхронные операции через redux-thunk.

### Подход 2: @reduxjs/toolkit (createSlice)
Использование `createSlice` и `createAsyncThunk` для упрощения кода Redux. Иммутабельные обновления через Immer.

### Подход 3: @reduxjs/toolkit + RTK Query
Использование `createApi` и `fetchBaseQuery` для автоматического управления серверным состоянием с кэшированием и инвалидацией.

## Технологии

- React 18
- React Router v6
- Vite
- json-server (mock backend)
