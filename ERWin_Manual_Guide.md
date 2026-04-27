# ULTIMATE ІНСТРУКЦІЯ (17 Таблиць для 3NF Моделі)

Ця версія містить усі можливі модулі для сучасного e-commerce проекту.

## 1. Довідники (Lookup Tables)
1. **role** (id, name)
2. **user_rank** (id, name, discount_percent)
3. **order_status** (id, name)
4. **shipping_method** (id, name, cost) — **НОВА**
5. **payment_method** (id, name)
6. **category** (id, name, slug)

## 2. Основні сутності (Core Entities)
7. **user** (id, username, email, phone, role_id, user_rank_id)
8. **subcategory** (id, category_id, name, slug)
9. **product** (id, subcategory_id, name, base_price, stock, sku)
10. **order** (id, user_id, order_status_id, shipping_method_id, payment_method_id, total_amount, created_at)
11. **order_item** (id, order_id, product_id, quantity, price)

## 3. Модулі розширення (Extension Modules)

### Модуль: Характеристики та Медіа
12. **product_characteristic** (id, product_id, char_name, char_value)
13. **product_image** (id, product_id, image_url, is_main)

### Модуль: Складський облік — **НОВИЙ**
14. **inventory_log** (id, product_id, user_id, change_amount, reason, created_at)
    *(Дозволяє бачити історію: хто з адмінів додав або списав товар)*

### Модуль: Зворотній зв'язок — **НОВИЙ**
15. **review** (id, product_id, user_id, rating, comment, created_at)
    *(Відгуки клієнтів про автомати чи спорядження)*

### Модуль: Лояльність та Маркетинг — **НОВИЙ**
16. **wishlist** (id, user_id, product_id, added_at)
    *(Товари, які користувач зберіг "на потім")*

### Модуль: Адміністрування системи — **НОВИЙ**
17. **audit_log** (id, user_id, action_type, description, created_at)
    *(Логування дій адміністратора для безпеки)*

---

## 4. Зв'язки для ідеальної схеми
1. `role` -> `user`
2. `user_rank` -> `user`
3. `category` -> `subcategory`
4. `subcategory` -> `product`
5. `product` -> `product_characteristic`
6. `product` -> `product_image`
7. `user` -> `order`
8. `order_status` -> `order`
9. `shipping_method` -> `order`
10. `payment_method` -> `order`
11. `order` -> `order_item`
12. `product` -> `order_item`
13. `product` -> `inventory_log`
14. `user` -> `inventory_log` (хто вніс зміни)
15. `product` -> `review`
16. `user` -> `review`
17. `user` -> `wishlist`
18. `product` -> `wishlist`
19. `user` -> `audit_log`
