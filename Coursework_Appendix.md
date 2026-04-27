# Додаток до курсової роботи: Технічна реалізація інформаційної системи Hristo Airsoft

Цей документ містить опис технічної архітектури, схеми бази даних та ключові фрагменти коду для реалізації функціоналу інтернет-магазину.

## 1. Архітектура системи
Система побудована за архітектурою клієнт-сервер:
- **Front-end**: React 18, TypeScript, Tailwind CSS, Zustand (керування станом).
- **Back-end**: Node.js (Vercel Serverless Functions), TypeScript.
- **База даних**: PostgreSQL.
- **Хмарне сховище**: Vercel Blob Storage (для медіафайлів).

---

## 2. Схема бази даних (PostgreSQL)
Основна структура таблиць для забезпечення процесу замовлень та управління каталогом.

```sql
-- Таблиця Товарів
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category_id TEXT REFERENCES categories(id),
    characteristics JSONB DEFAULT '[]', -- Динамічні характеристики
    variants JSONB DEFAULT '[]',        -- Варіанти товару
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблиця Замовлень
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id TEXT REFERENCES users(id),
    total DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid, processing, shipped, delivered
    shipping_address JSONB DEFAULT '{}',
    tracking_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблиця Елементів замовлення
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);
```

---

## 3. Бекенд: Робота з PostgreSQL (Node.js)

### 3.1. Налаштування з'єднання (Pool)
Файл: `api/index.ts`
```typescript
import pg from "pg";
const { Pool } = pg;

let pool: any = null;
function getPool() {
  if (pool) return pool;
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
  });
  return pool;
}
```

### 3.2. Логіка розрахунку лояльності та статусів
Приклад функції перерахунку балів користувача після замовлення:
```typescript
async function recalculateUserPointsAndRank(pool: any, userId: string) {
  const ordersRes = await pool.query(
    "SELECT SUM(total) as spent FROM orders WHERE user_id = $1 AND status IN ('paid', 'delivered')",
    [userId]
  );
  const totalSpent = parseFloat(ordersRes.rows[0]?.spent || 0);
  const points = Math.floor(totalSpent); // 1 EUR = 1 PT

  // Визначення рангу за порогами
  let rank = 'recruit';
  if (points >= 10000) rank = 'commander';
  else if (points >= 5000) rank = 'operator';
  // ... інші ранги

  await pool.query(
    "UPDATE users SET points = $1, rank = $2 WHERE id = $3",
    [points, rank, userId]
  );
}
```

---

## 4. Логіка міграцій (Migrations)
Автоматичне оновлення схеми БД без простою системи.
Файл: `api/lib/migrations.ts`
```typescript
async function migrateSchema(pool: Pool) {
  const tasks = [
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS attachment_slot TEXT",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT",
    `CREATE TABLE IF NOT EXISTS inventory_logs (
      id SERIAL PRIMARY KEY,
      product_id TEXT NOT NULL,
      change_amount INTEGER NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  ];

  for (const sql of tasks) {
    await pool.query(sql);
  }
}
```

---

## 5. Фронтенд: Взаємодія з даними (React)

### 5.1. Сервіс управління даними (Abstraction Layer)
Файл: `src/services/databaseService.ts`
```typescript
export const databaseService = {
  // Отримання товарів з фільтрацією
  async getProducts(category?: string, type?: string): Promise<Product[]> {
    const url = new URL('/api/products', window.location.origin);
    if (category) url.searchParams.append('category', category);
    if (type) url.searchParams.append('type', type);
    const res = await fetch(url.toString());
    return res.ok ? await res.json() : [];
  },

  // Збереження/Оновлення товару (CRUD)
  async saveProduct(product: any) {
    const url = product.id ? `/api/admin/products/${product.id}` : '/api/admin/products';
    const method = product.id ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.getToken()}` },
      body: JSON.stringify(product)
    });
  }
};
```

### 5.2. Реалізація пошуку та фільтрації
Файл: `src/pages/ShopPage.tsx`
```typescript
const { filters, setFilters, getFilteredProducts } = useShopStore();

// Обробка зміни пошукового запиту
<input
  type="text"
  placeholder="Пошук товарів..."
  value={filters.search}
  onChange={(e) => setFilters({ search: e.target.value })}
/>

// Відображення відфільтрованих товарів
const filteredProducts = getFilteredProducts();
{filteredProducts.map(product => (
  <ProductCard key={product.id} product={product} />
))}
```

---

## 6. Ключові файли та їх призначення
| Назва файлу | Призначення |
| :--- | :--- |
| `api/index.ts` | Головний обробник API запитів (Routing & DB Logic) |
| `api/lib/migrations.ts` | Управління структурою бази даних |
| `src/services/databaseService.ts` | Фронтенд-сервіс для зв'язку з бекендом |
| `src/store/shopStore.ts` | Сховище стану магазину (фільтри, кошик, товари) |
| `src/pages/AdminDashboard.tsx` | Панель управління контентом (CRUD операції) |
| `database_schema.sql` | Повна SQL-схема для розгортання бази даних |

---

## 7. Детальний опис бізнес-логіки процесів

### 7.1. Управління каталогом товарів (CRUD)
**Створення та редагування товарів:**
1.  **Фронтенд**: В панелі адміністратора (`AdminDashboard.tsx`) використовується форма `ProductForm`. При натисканні "Зберегти" викликається метод `databaseService.saveProduct(product)`.
    *   Якщо `product.id` існує — відправляється `PUT` запит на оновлення.
    *   Якщо `product.id` відсутній — відправляється `POST` запит на створення нового запису.
2.  **Бекенд**: В `api/index.ts` обробник перевіряє права доступу (JWT Admin) та виконує SQL запит:
    ```sql
    INSERT INTO products (id, name, price, stock, characteristics, variants, category_id, ...)
    VALUES ($1, $2, $3, $4, $5, $6, $7, ...)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, ...;
    ```
    *Важливо:* Характеристики та варіанти зберігаються як `JSONB`, що дозволяє передавати масиви об'єктів безпосередньо з React-форми.

### 7.2. Процес оформлення замовлення (Checkout)
Цей процес є найбільш критичним і складається з декількох етапів:
1.  **Кошик**: Користувач додає товари, стан яких зберігається у `shopStore`.
2.  **Checkout**: На сторінці `CheckoutPage.tsx` збираються дані про доставку та викликається `databaseService.createOrder(orderData)`.
3.  **Бекенд (Транзакційність)**:
    - Створюється запис у таблиці `orders`.
    - Для кожного товару з кошика створюється запис у `order_items`.
    - Розраховується загальна вартість та прибуток (`profit`) на основі `price` та `landing_cost` (собівартості).
4.  **Оплата**: При використанні Stripe, після успішного підтвердження платежу, статус замовлення змінюється на `paid` через Webhook.

### 7.3. Автоматичне списання залишків (Stock Management)
При створенні замовлення або зміні його статусу на "Оплачено", система автоматично коригує кількість товару на складі:
- **SQL запит**: `UPDATE products SET stock = stock - $1 WHERE id = $2`.
- **Логування**: Кожна зміна фіксується в таблиці `inventory_logs` для аудиту (хто зміг, коли і з якої причини).

### 7.4. Система фільтрації та пошуку
Для забезпечення швидкої роботи з великою кількістю товарів (Airsoft зброя, запчастини, спорядження) реалізовано:
- **Client-side filtering**: Фронтенд отримує список товарів, а функція `getFilteredProducts` у `shopStore.ts` фільтрує їх за категоріями, ціною, брендами та наявністю 3D-моделі без додаткових запитів до БД.
- **Search**: Пошук здійснюється за назвою (`name`), описом (`description`) та кодом товару (`sku`).
