# МІНІСТЕРСТВО ОСВІТИ І НАУКИ УКРАЇНИ
# НАЦІОНАЛЬНИЙ УНІВЕРСИТЕТ ХАРЧОВИХ ТЕХНОЛОГІЙ
# Факультет автоматизації і комп'ютерних систем імені проф. І.В.Ельперіна

**ПОЯСНЮВАЛЬНА ЗАПИСКА**
**ДО КВАЛІФІКАЦІЙНОЇ РОБОТИ БАКАЛАВРА**

**Тема:** Розроблення спеціалізованої системи електронної комерції для тактичного спорядження з інтегрованим 3D-конфігуратором та модулем бізнес-аналітики

**Здобувач:** [Твоє Прізвище та Ініціали]
**Керівник:** [Прізвище та Ініціали керівника]

Київ – 2026

---

## АНОТАЦІЯ
**Назва роботи:** Розроблення спеціалізованої системи електронної комерції для тактичного спорядження з інтегрованим 3D-конфігуратором та модулем бізнес-аналітики.
**Обсяг роботи:** 45 сторінок (без урахування додатків), 8 таблиць, 15 ілюстрацій, 32 джерела.

**Стислий опис:** Кваліфікаційна робота присвячена проектуванню та розробленню Full-stack веб-платформи "Hristo" для продажу страйкбольного спорядження. В роботі реалізовано унікальний 3D-конфігуратор на базі Three.js, систему управління складськими запасами (ERP), модуль візуальної бізнес-аналітики (BI) та механізм реального часу для синхронізації стану кошика через BroadcastChannel API. Платформа побудована на сучасному стеку технологій: React 19, Node.js, PostgreSQL та хмарному сховищі Vercel Blob. Особлива увага приділена безпеці транзакцій через Stripe та аудиту адміністративних дій.

**Ключові слова:** ЕЛЕКТРОННА КОМЕРЦІЯ, REACT 19, THREE.JS, 3D-КОНФІГУРАТОР, POSTGRESQL, NODE.JS, БІЗНЕС-АНАЛІТИКА, СТРАЙКБОЛЬНЕ СПОРЯДЖЕННЯ, FULL-STACK РЕАЛІЗАЦІЯ.

---

## ABSTRACT
**Title:** Development of a specialized e-commerce system for tactical equipment with an integrated 3D configurator and business analytics module.
**Scope:** 45 pages (excluding appendices), 8 tables, 15 illustrations, 32 sources.

**Description:** This qualification work is dedicated to the design and development of the "Hristo" full-stack web platform for airsoft equipment sales. The work implements a unique 3D configurator based on Three.js, a warehouse inventory management system (ERP), a visual business analytics (BI) module, and a real-time cart synchronization mechanism using the BroadcastChannel API. The platform is built on a modern technology stack: React 19, Node.js, PostgreSQL, and Vercel Blob cloud storage. Special attention is paid to transaction security via Stripe and administrative action auditing.

**Keywords:** E-COMMERCE, REACT 19, THREE.JS, 3D CONFIGURATOR, POSTGRESQL, NODE.JS, BUSINESS ANALYTICS, AIRSOFT EQUIPMENT, FULL-STACK IMPLEMENTATION.

---

## ЗМІСТ
ВСТУП
РОЗДІЛ 1. ДОСЛІДЖЕННЯ ПРЕДМЕТНОЇ ОБЛАСТІ ТА ПОСТАНОВКА ЗАДАЧІ
1.1. Загальна характеристика об’єкта дослідження (Hristo)
1.2. Організаційна структура та бізнес-процеси
1.3. Аналіз стану комп’ютеризації та обґрунтування розробки
1.4. Функціональне моделювання існуючих процесів (AS-IS)
1.5. Огляд існуючих рішень та порівняльний аналіз
1.6. Техніко-економічне обґрунтування
1.7. Обґрунтування доцільності розроблення системи
РОЗДІЛ 2. ТЕХНІЧНЕ ЗАВДАННЯ
2.1. Призначення та цілі створення системи
2.2. Функціональні та технічні вимоги
2.3. Вимоги до видів забезпечення (програмне, технічне, інформаційне)
2.4. Календарний план та діаграма Ганта
РОЗДІЛ 3. ПРОЄКТУВАННЯ, СТВОРЕННЯ ТА АПРОБАЦІЯ ПРОГРАМНОГО ЗАБЕЗПЕЧЕННЯ
3.1. Обґрунтування вибору програмно-технічних засобів (Stack)
3.2. Проєктування та логічна структура бази даних
3.3. Реалізація функціональних модулів (3D, BI, ERP)
3.4. Інструкція користувача та адміністратора
3.5. Тестування та результати апробації
3.6. Забезпечення безпеки та захист даних
3.7. Забезпечення доступності (Accessibility / WCAG 2.1)
ВИСНОВКИ
СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ
ДОДАТКИ

---

## ВСТУП
В умовах стрімкої цифровізації глобальної економіки, спеціалізовані нішеві ринки, такі як страйкбольне спорядження (airsoft), потребують інноваційних інструментів для взаємодії з клієнтом. Актуальність теми розробки зумовлена складністю товарної групи, яка вимагає від користувача глибокого розуміння сумісності компонентів. Традиційні 2D-каталоги не забезпечують достатнього рівня занурення та наочності, що призводить до помилок при замовленні та збільшення кількості повернень.

Метою даної роботи є створення високопродуктивної e-commerce платформи, яка інтегрує 3D-технології безпосередньо в процес покупки, автоматизує управління складськими залишками та надає власнику бізнесу інструменти глибокої аналітики в реальному часі.

---

## РОЗДІЛ 1. ДОСЛІДЖЕННЯ ПРЕДМЕТНОЇ ОБЛАСТІ ТА ПОСТАНОВКА ЗАДАЧІ

### 1.1. Загальна характеристика об’єкта дослідження
Hristo Airsoft — це спеціалізований ритейлер тактичного спорядження та страйкбольної зброї. Основна сфера діяльності включає продаж основних приводів, аксесуарів, витратних матеріалів та послуг з кастомізації. Головною метою установи є забезпечення гравців надійним обладнанням з можливістю індивідуального налаштування кожної одиниці товару.

### 1.3. Аналіз нинішнього стану комп’ютеризації
На початковому етапі установа використовувала розрізнені інструменти: Excel для обліку залишків, Telegram-боти для прийому замовлень та статичні веб-сторінки на базі конструкторів.
**Висновки:** Поточний стан є незадовільним через:
- Відсутність єдиної бази даних товарів та варіацій.
- Неможливість візуально оцінити сумісність деталей перед покупкою.
- Велика частка ручної праці при обробці замовлень.
- Відсутність аналітичних даних для прогнозування попиту.

### 1.5. Огляд існуючих рішень
В роботі проведено порівняння трьох систем:
1. **Shopify**: Потужне рішення, але має високу вартість підписки та обмежені можливості кастомізації 3D-інтерфейсів без сторонніх платних плагінів.
2. **WooCommerce**: Гнучке, але потребує постійного технічного обслуговування та вразливе до безпекових ризиків.
3. **Кастомна розробка (Hristo)**: Дозволяє реалізувати унікальний алгоритм декартового добутку для варіацій та безшовну інтеграцію Three.js.

### 1.6. Техніко-економічне обґрунтування
Впровадження розробленої системи дозволяє досягти наступних показників:
- **Зменшення витрат на повернення**: Завдяки 3D-конфігуратору очікується зниження кількості повернень через "невідповідність очікуванням" на 25-30%.
- **Автоматизація обробки**: Скорочення часу менеджера на обробку одного замовлення з 15 хвилин до 3 хвилин завдяки інтегрованій ERP-системі.
- **ROI (Окупність)**: При середньому обсязі продажів, витрати на розробку та підтримку (Vercel, Neon) окупаються протягом 8-12 місяців експлуатації.

### 1.7. Обґрунтування доцільності розроблення системи
На основі аналізу пп. 1.3-1.6 можна стверджувати, що розроблення власної платформи є доцільним, оскільки жодна з існуючих на ринку систем не надає необхідного рівня інтеграції 3D-графіки з внутрішньою бізнес-логікою обліку збройових компонентів за прийнятну вартість.

---

## РОЗДІЛ 2. ТЕХНІЧНЕ ЗАВДАННЯ

### 2.1. Мета розробки
Створення Full-stack системи для автоматизації циклу продажу: від 3D-конфігурації клієнтом до формування звіту про прибуток в адмін-панелі.

### 2.2. Функціональні та технічні вимоги
**Функціональні вимоги:**
- Підтримка багатошарової 3D-конфігурації (база + аксесуари).
- Автоматична генерація SKU для тисяч комбінацій товарів.
- Рольова модель доступу (Admin, Editor, Customer).
**Технічні вимоги:**
- Час завантаження першої сторінки (LCP) < 1.5 сек.
- Підтримка протоколу HTTPS та стандартів PCI DSS для платежів.
- Кросбраузерна сумісність (Chrome, Safari, Firefox) з підтримкою WebGL 2.0.

### 2.3. Вимоги до видів забезпечення
- **Програмне забезпечення**: Серверна частина — Node.js 20+, Клієнтська — Сучасні браузери з підтримкою ES6+.
- **Технічне забезпечення**: RAM від 4ГБ для серверної частини (serverless ліміти), підтримка апаратного прискорення графіки на стороні клієнта.
- **Інформаційне забезпечення**: Реляційна БД PostgreSQL, хмарне сховище Vercel Blob для статичних медіа-файлів.

### 2.4. Календарний план та діаграма Ганта
Розробка проєкту розрахована на 12 тижнів:
1. Аналіз та проектування (Тиждень 1-2).
2. Розробка архітектури та БД (Тиждень 3).
3. Backend API та інтеграція Stripe (Тиждень 4-6).
4. Frontend та 3D-конфігуратор (Тиждень 7-9).
5. Тестування та виправлення помилок (Тиждень 10-11).
6. Впровадження та апробація (Тиждень 12).
*(Графічне представлення діаграми Ганта наведено у Додатку В).*

### 2.2. Основні функції системи
- **Для клієнта:** 3D-перегляд, фільтрація, кошик з синхронізацією в реальному часі, оплата Stripe.
- **Для адміністратора:** ERP-панель, BI-дашборди, управління медіа-активами через Vercel Blob, аудит дій персоналу.

---

## РОЗДІЛ 3. ПРОЄКТУВАННЯ ТА РЕАЛІЗАЦІЯ

### 3.1. Програмно-технічні засоби
Обрано наступний стек:
- **Frontend:** React 19 (швидкість рендерингу), TailwindCSS (адаптивність).
- **Backend:** Node.js Express (асинхронність та масштабованість).
- **Database:** PostgreSQL (надійність реляційних зв'язків).
- **Graphics:** Three.js / React Three Fiber.

### 3.2. База даних
Логічна структура бази даних включає **14 пов'язаних таблиць**. Ключовою особливістю є таблиця `variant_combinations`, яка зберігає динамічно згенеровані SKU на основі декартового добутку атрибутів.

**Повний перелік таблиць бази даних:**

| № | Таблиця | Призначення | Ключові поля |
|---|---------|-------------|--------|
| 1 | `products` | Каталог товарів | id, name, slug, price, stock, category_id, discount |
| 2 | `categories` | Ієрархія категорій | id, name, slug, parent_id, image_url |
| 3 | `orders` | Замовлення клієнтів | id, user_id, status, total, profit, payment, shipping |
| 4 | `order_items` | Позиції замовлення | id, order_id, product_id, quantity, price, landing_cost |
| 5 | `users` | Профілі користувачів | id, firebase_uid, email, role, discount_level, loyalty_points |
| 6 | `coupons` | Промо-коди та знижки | id, code, discount_type, discount_value, usage_limit |
| 7 | `messages` | Звернення клієнтів | id, name, email, subject, message, status |
| 8 | `audit_logs` | Журнал дій адміністратора | id, user_id, action, entity_type, entity_id, timestamp |
| 9 | `inventory_logs` | Журнал складських операцій | id, product_id, change_type, quantity_change, reason |
| 10 | `saved_builds` | Збережені 3D-конфігурації | id, user_id, product_id, configuration, name |
| 11 | `filters` | Фільтри каталогу | id, name, type, category_id |
| 12 | `filter_values` | Значення фільтрів | id, filter_id, value |
| 13 | `product_filter_values` | Зв'язок товар-фільтр | product_id, filter_value_id |
| 14 | `blog_posts` | Статті блогу | id, title, slug, content, author_id, status |

Всі таблиці забезпечені GIN-індексами для повнотекстового пошуку та B-Tree індексами для швидкої фільтрації.

### 3.4. Інструкція користувача
Користувач ініціює процес через головну сторінку, переходить до каталогу, обирає базову модель та натискає "Configure". У 3D-вікні обираються додатки. Після завершення товар додається до кошика, де відбувається Stripe-оплата.

### 3.5. Тестування та результати апробації
**Методика тестування:**

**Модульне тестування (Unit Testing):**
Для модульного тестування обрано фреймворк **Vitest** — швидке рішення, повністю сумісне з Vite-екосистемою проєкту.

| Тестовий файл | Кількість тестів | Результат | Опис |
|---|---|---|---|
| `tests/price.test.ts` | 12 | ✅ Passed | Розрахунок ціни зі знижкою, форматування валюти |
| `tests/format.test.ts` | 12 | ✅ Passed | Форматування enum, SKU, міток для UI |
| `tests/validation.test.ts` | 15 | ✅ Passed | Zod-схеми валідації замовлень, товарів, автентифікації |
| `tests/variants.test.ts` | 8 | ✅ Passed | Алгоритм декартового добутку, генерація SKU |
| **Всього** | **47** | **100%** | — |

Тестами покрито ключові бізнес-алгоритми: ціноутворення, генерація варіацій, валідація введених даних.

**Інтеграційне тестування:**
- `POST /api/orders` — створення замовлення з перевіркою залишків: **Успішно**.
- `GET /api/products` — завантаження каталогу з фільтрацією: **Успішно**.
- `POST /api/stripe/create-checkout-session` — створення сесії оплати: **Успішно**.

**Стрес-тестування:** Одночасне завантаження 3D-конфігуратора 50 користувачами. Результат: стабільна робота без падіння FPS.

**Апробація:** Система розгорнута на Vercel та протестована групою з 5 досвідчених гравців у страйкбол. Відгуки підтвердили зручність інтерфейсу та точність візуалізації.

### 3.6. Забезпечення безпеки та захист даних

Безпека системи реалізована на декількох рівнях:

**Таблиця 3.2. Рівні безпеки системи Hristo**

| Рівень | Технологія | Призначення |
|--------|-----------|-------------|
| HTTP-заголовки | `helmet()` | Захист від XSS, clickjacking, MIME-sniffing |
| Обмеження запитів | `express-rate-limit` | Ліміт 100 запитів / 15 хвилин на IP |
| CORS | `cors()` | Контроль міжсайтових запитів (whitelist доменів) |
| SQL-ін'єкції | Параметризовані запити | Всі SQL-запити використовують `$1, $2...` замість конкатенації |
| Автентифікація | JWT + Firebase REST API | Верифікація токенів через Google Identity Toolkit |
| Авторизація (RBAC) | `authenticateAdmin` middleware | Розмежування ролей: admin, manager, clerk, tech, user |
| Платіжна безпека | Stripe PCI DSS Level 1 | Дані карток ніколи не проходять через сервер Hristo |
| Аудит дій | `audit_logs` таблиця | Журналювання всіх адміністративних операцій |

**Рольова модель доступу (RBAC):**

| Роль | Перегляд каталогу | Замовлення | Управління товарами | BI-аналітика | ERP/Склад | Аудит | Налаштування |
|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `user` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `clerk` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `manager` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `tech` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Особливість реалізації:** Для вирішення проблеми ініціалізації Firebase Admin SDK у serverless-середовищі Vercel, було реалізовано гібридний підхід — REST-верифікація токенів через Google Identity Toolkit API (`auth.middleware.ts`). Це дозволяє уникнути cold start crashes, зберігаючи повну безпеку автентифікації.

### 3.7. Забезпечення доступності (Accessibility / WCAG 2.1)

Система відповідає основним критеріям WCAG 2.1 (рівень AA):

- **Семантична HTML-розмітка:** використано `<header>`, `<nav>`, `<main>`, `<footer>` з атрибутами `role="banner"`, `role="navigation"`, `role="main"`.
- **ARIA-атрибути:** кнопки мають `aria-label`, форми пошуку — `role="search"`, мобільне меню — `aria-expanded`.
- **Skip-to-content:** реалізовано посилання для пропуску навігації.
- **Контраст кольорів:** основний текст (#f4f4f5 на #0a0a0a) забезпечує контрастність > 15:1.
- **Підтримка клавіатури:** всі інтерактивні елементи доступні через Tab-навігацію.
- **Адаптивний дизайн:** Mobile First підхід з підтримкою від 320px.

---

## ВИСНОВКИ
В ході кваліфікаційної роботи була розроблена та успішно апробована система електронної комерції "Hristo". Розроблений програмний продукт розв'язує задачу візуалізації складних товарів через 3D-інтерфейс та автоматизує управління складськими операціями. Використання сучасних технологій, таких як BroadcastChannel та хмарні сервіси Vercel, дозволило досягти високої продуктивності та стабільності системи.

**Основні результати роботи:**
1. Реалізовано Full-stack e-commerce платформу з 14 таблицями PostgreSQL, 13 REST API маршрутами та 11 Zustand-сторами.
2. Розроблено 3D-конфігуратор на базі Three.js з підтримкою GLB/Draco-моделей та PBR-матеріалів.
3. Впроваджено модуль BI-аналітики з візуалізацією через SVG-графіки (Recharts).
4. Реалізовано ERP-модуль з автоматичною генерацією SKU на основі декартового добутку.
5. Забезпечено безпеку транзакцій через Stripe PCI DSS Level 1 та JWT/Firebase автентифікацію.
6. Створено 47 модульних тестів (Vitest) з 100% проходженням.

**Перспективи подальшого розвитку:**
- Інтеграція Stripe Webhooks для автоматичного оновлення статусу замовлення.
- Реалізація email-сповіщень (Transactional Emails) через Resend/Nodemailer.
- Впровадження PWA (Progressive Web App) для офлайн-доступу до каталогу.
- Розширення 3D-конфігуратора додатковими attachment points та фізикою зіткнень.
- Інтеграція AR (Augmented Reality) для перегляду моделей у реальному середовищі.

---

## СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ

1. React Documentation [Електронний ресурс]. — Режим доступу: https://react.dev/ — Дата звернення: 15.03.2026.
2. Three.js Documentation [Електронний ресурс]. — Режим доступу: https://threejs.org/docs/ — Дата звернення: 10.03.2026.
3. PostgreSQL 16 Documentation [Електронний ресурс]. — Режим доступу: https://www.postgresql.org/docs/16/ — Дата звернення: 20.02.2026.
4. Stripe API Reference [Електронний ресурс]. — Режим доступу: https://stripe.com/docs/api — Дата звернення: 15.04.2026.
5. Express.js Guide [Електронний ресурс]. — Режим доступу: https://expressjs.com/ — Дата звернення: 01.03.2026.
6. Zustand: Bear necessities for state management in React [Електронний ресурс]. — GitHub. — Режим доступу: https://github.com/pmndrs/zustand — Дата звернення: 05.03.2026.
7. Vercel Documentation: Serverless Functions [Електронний ресурс]. — Режим доступу: https://vercel.com/docs — Дата звернення: 10.04.2026.
8. Firebase Authentication Documentation [Електронний ресурс]. — Google. — Режим доступу: https://firebase.google.com/docs/auth — Дата звернення: 25.03.2026.
9. TailwindCSS v4 Documentation [Електронний ресурс]. — Режим доступу: https://tailwindcss.com/docs — Дата звернення: 01.04.2026.
10. Framer Motion: Production-Ready Animation Library [Електронний ресурс]. — Режим доступу: https://motion.dev/ — Дата звернення: 15.03.2026.
11. Recharts: Composable charting library for React [Електронний ресурс]. — Режим доступу: https://recharts.org/ — Дата звернення: 20.04.2026.
12. Zod: TypeScript-first schema validation [Електронний ресурс]. — Режим доступу: https://zod.dev/ — Дата звернення: 10.03.2026.
13. React Three Fiber Documentation [Електронний ресурс]. — Poimandres. — Режим доступу: https://docs.pmnd.rs/react-three-fiber — Дата звернення: 12.03.2026.
14. ДСТУ 3008:2015. Звіти у сфері науки і техніки. Структура та правила оформлення [Текст]. — Київ: ДП «УкрНДНЦ», 2016. — 26 с.
15. ДСТУ ISO/IEC 12207:2008. Інформаційні технології. Процеси життєвого циклу програмного забезпечення [Текст]. — Київ: Держспоживстандарт, 2008. — 42 с.
16. Нільсен Я. Дизайн веб-навігації / Я. Нільсен, М. Тахір. — Санкт-Петербург: Символ-Плюс, 2008. — 312 с.
17. Фаулер М. Шаблони корпоративних застосунків / М. Фаулер. — Москва: Вільямс, 2021. — 544 с.
18. Gamma E. Design Patterns: Elements of Reusable Object-Oriented Software / E. Gamma, R. Helm, R. Johnson, J. Vlissides. — Addison-Wesley, 1994. — 416 p.
19. MDN Web Docs: WebGL API [Електронний ресурс]. — Mozilla. — Режим доступу: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API — Дата звернення: 05.03.2026.
20. MDN Web Docs: BroadcastChannel API [Електронний ресурс]. — Mozilla. — Режим доступу: https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel — Дата звернення: 20.03.2026.
21. OWASP Top 10 — 2025 [Електронний ресурс]. — The Open Web Application Security Project. — Режим доступу: https://owasp.org/www-project-top-ten/ — Дата звернення: 15.04.2026.
22. PCI DSS Requirements and Testing Procedures v4.0.1 [Електронний ресурс]. — PCI Security Standards Council. — Режим доступу: https://www.pcisecuritystandards.org/ — Дата звернення: 10.04.2026.
23. Jones M. JSON Web Token (JWT) / M. Jones, J. Bradley, N. Sakimura // RFC 7519. — IETF, 2015. — 30 p.
24. Fielding R. Architectural Styles and the Design of Network-based Software Architectures: PhD thesis / R. Fielding. — University of California, Irvine, 2000. — 162 p.
25. Neon Serverless PostgreSQL Documentation [Електронний ресурс]. — Neon Inc. — Режим доступу: https://neon.tech/docs — Дата звернення: 25.02.2026.
26. Node.js v22 Documentation [Електронний ресурс]. — OpenJS Foundation. — Режим доступу: https://nodejs.org/en/docs/ — Дата звернення: 01.03.2026.
27. TypeScript Handbook [Електронний ресурс]. — Microsoft. — Режим доступу: https://www.typescriptlang.org/docs/ — Дата звернення: 15.02.2026.
28. Vite: Next Generation Frontend Tooling [Електронний ресурс]. — Режим доступу: https://vite.dev/guide/ — Дата звернення: 20.02.2026.
29. Draco 3D Data Compression [Електронний ресурс]. — Google. — Режим доступу: https://google.github.io/draco/ — Дата звернення: 10.03.2026.
30. Vercel Blob SDK Documentation [Електронний ресурс]. — Vercel Inc. — Режим доступу: https://vercel.com/docs/storage/vercel-blob — Дата звернення: 05.04.2026.
31. WCAG 2.1: Web Content Accessibility Guidelines [Електронний ресурс]. — W3C. — Режим доступу: https://www.w3.org/TR/WCAG21/ — Дата звернення: 01.05.2026.
32. Vitest: Blazing Fast Unit Testing Framework [Електронний ресурс]. — Режим доступу: https://vitest.dev/ — Дата звернення: 05.05.2026.

---

## ДОДАТОК А: ФРАГМЕНТИ КОДУ
```typescript
// Алгоритм генерації варіацій (Декартів добуток)
function generateVariants(attributes: { name: string; options: string[] }[]): Record<string, string>[] {
  if (attributes.length === 0) return [];
  return attributes.reduce<Record<string, string>[]>((acc, attr) => {
    if (acc.length === 0) {
      return attr.options.map(val => ({ [attr.name]: val }));
    }
    return acc.flatMap(item =>
      attr.options.map(val => ({ ...item, [attr.name]: val }))
    );
  }, []);
}
```

```typescript
// Middleware автентифікації (гібридний підхід JWT + Firebase REST API)
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token required' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  // Верифікація через Google Identity Toolkit REST API
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    { method: 'POST', body: JSON.stringify({ idToken }) }
  );
  // ... перевірка та розпакування даних користувача
};
```

```typescript
// Розрахунок ціни зі знижкою
export const getDiscountedPrice = (price: number | string, discount?: number): number => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 0;
  if (!discount || discount <= 0) return numPrice;
  return numPrice * (1 - discount / 100);
};
```

```typescript
// Zod-схема валідації замовлення
export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1),
    shipping: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(5),
      city: z.string().min(1),
      address: z.string().min(1),
      postalCode: z.string().min(1)
    }).passthrough()
  }).passthrough()
});
```

## ДОДАТОК Б: СТРУКТУРА БД (SQL)
```sql
-- Основна таблиця товарів (1 з 14)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_hr VARCHAR(255),
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  landing_cost DECIMAL(10,2) DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  brand VARCHAR(100),
  discount DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  images TEXT[],
  model_3d_url TEXT,
  has_3d BOOLEAN DEFAULT false,
  variant_attributes JSONB DEFAULT '[]',
  variants JSONB DEFAULT '[]',
  characteristics JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблиця аудиту дій (автоматичний журнал)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Індекси для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_products_search
  ON products USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

## ДОДАТОК В: ТАБЛИЦЯ API-ЕНДПОІНТІВ

| № | Метод | Маршрут | Опис | Авторизація |
|---|-------|---------|------|-------------|
| 1 | GET | `/api/products` | Отримання каталогу товарів з фільтрацією | — |
| 2 | GET | `/api/products/:id` | Деталі товару за ID | — |
| 3 | POST | `/api/products` | Створення товару | Admin |
| 4 | PUT | `/api/products/:id` | Оновлення товару | Admin |
| 5 | DELETE | `/api/products/:id` | Видалення товару | Admin |
| 6 | POST | `/api/orders` | Створення замовлення | Token |
| 7 | GET | `/api/admin/orders` | Список всіх замовлень | Admin |
| 8 | POST | `/api/stripe/create-checkout-session` | Сесія Stripe-оплати | Token |
| 9 | GET | `/api/analytics/summary` | BI-зведення продажів | Admin |
| 10 | POST | `/api/coupons/validate` | Перевірка промокоду | — |
| 11 | POST | `/api/uploads/image` | Завантаження зображення | Admin |
| 12 | GET | `/api/blog` | Список статей блогу | — |
| 13 | PUT | `/api/settings` | Оновлення налаштувань сайту | Admin |
| 14 | GET | `/api/audit-logs` | Журнал дій адміністратора | Admin |
| 15 | POST | `/api/auth/register` | Реєстрація нового користувача | — |
| 16 | POST | `/api/auth/login` | Вхід в систему | — |
| 17 | GET | `/api/categories` | Список категорій | — |
| 18 | GET | `/api/users/me` | Профіль поточного користувача | Token |
