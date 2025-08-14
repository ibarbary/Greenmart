const queryList = {
  GET_PRODUCT: `SELECT * FROM products WHERE id = $1`,

  ADD_PRODUCT: `
    INSERT INTO products (name, description, category, instock, price, offerprice, images, category_id)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id;`,

  UPDATE_PRODUCT: `
  UPDATE products
  SET name = COALESCE($1, name),
      description = COALESCE($2, description),
      category = COALESCE($3, category),
      instock = COALESCE($4, instock),
      price = COALESCE($5, price),
      offerPrice = $6,
      images = COALESCE($7, images),
      category_id = COALESCE($8, category_id)
  WHERE id = $9`,

  UPDATE_PRODUCT_STOCK: `UPDATE products SET instock = $1 WHERE id = $2;`,

  GET_ALL_CATEGORIES: `SELECT * FROM categories ORDER BY id`,

  GET_CATEGORY: `SELECT * FROM categories WHERE id = $1`,

  ADD_CATEGORY: `INSERT INTO categories (name, image, image_public_id, is_active) VALUES($1, $2, $3, $4)`,

  UPDATE_CATEGORY: `
    UPDATE categories
    SET name = COALESCE($1, name),
        image = COALESCE($2, image),
        image_public_id = COALESCE($3, image_public_id),
        is_active = COALESCE($4, is_active)
    WHERE id = $5
    `,

  UPDATE_CATEGORY_ACTIVE_STATUS: `UPDATE categories SET is_active = $1 WHERE id = $2;`,

  CHECK_USER_AND_PENDING_EXIST: `
    SELECT 'users' as table_name FROM users WHERE email = $1
    UNION ALL
    SELECT 'pending_users' as table_name FROM pending_users WHERE email = $1
    LIMIT 1;`,

  CHECK_USER_EXIST: `SELECT id, name, email, type, password FROM users WHERE email = $1;`,

  GET_USER_WITH_CART: `
    SELECT 
      u.id, u.name, u.email, u.type, u.password,
      c.id as cart_id
    FROM users u
    LEFT JOIN carts c ON u.id = c.user_id
    WHERE u.email = $1;`,

  GET_USER_WITH_CART_BY_ID: `
    SELECT 
      u.id, u.name, u.email, u.type,
      c.id as cart_id
    FROM users u
    LEFT JOIN carts c ON u.id = c.user_id
    WHERE u.id = $1;`,

  GET_USER: `SELECT id, name, email, type FROM users WHERE id = $1;`,

  CREATE_USER: `
    INSERT INTO users (name, email, password) 
    VALUES ($1, $2, $3) 
    RETURNING id, name, email, type;`,

  CREATE_USER_CART: `
    INSERT INTO carts (user_id) 
    VALUES ($1) 
    RETURNING id;`,

  GET_CART: `SELECT id FROM carts WHERE user_id = $1;`,

  GET_CART_ITEMS: `
    SELECT 
      ci.id, ci.quantity, ci.product_id, 
      p.name, p.price, p.offerPrice, p.category, p.images
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = $1
    ORDER BY ci.id;`,

  ADD_CART_ITEM: `
    INSERT INTO cart_items (cart_id, product_id, quantity)
    VALUES ($1, $2, $3)
    ON CONFLICT (cart_id, product_id) 
    DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
    RETURNING id;`,

  UPDATE_CART_ITEM: `
    UPDATE cart_items 
    SET quantity = $1 
    WHERE id = $2;`,

  DELETE_CART_ITEM: `
    DELETE FROM cart_items 
    WHERE id = $1;`,

  GET_USER_ADDRESSES: `
    SELECT * FROM addresses 
    WHERE user_id = $1 
    ORDER BY id DESC;`,

  GET_ADDRESS: `
    SELECT * FROM addresses
    WHERE id = $1`,

  ADD_ADDRESS: `
    INSERT INTO addresses
    (user_id, first_name, last_name, phone, street, city, state, country)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
    RETURNING id;`,

  UPDATE_ADDRESS: `
    UPDATE addresses
    SET 
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      phone = COALESCE($3, phone),
      street = COALESCE($4, street),
      city = COALESCE($5, city),
      state = COALESCE($6, state),
      country = COALESCE($7, country)
    WHERE id = $8 AND user_id = $9;`,

  DELETE_ADDRESS: `
    DELETE FROM addresses 
    WHERE id = $1 AND user_id = $2;`,

  CREATE_ORDER: `
    INSERT INTO orders (user_id, address_id, payment_type, amount, delivery_fee, payment_status, transaction_id, delivery_paid) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
    RETURNING id;`,

  ADD_ORDER_ITEM: `
    INSERT INTO order_items (order_id, product_id, status_id, price) 
    VALUES ($1, $2, $3, $4);`,

  CLEAR_USER_CART: `
    DELETE FROM cart_items 
    WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1);`,

  GET_ORDER_ITEM: `
    SELECT 
      o.id as order_id,
      p.name,
      p.category,
      p.images[1] as image,
      oi.price
    FROM orders o 
    JOIN order_items oi ON o.id = oi.order_id 
    JOIN products p ON oi.product_id = p.id
    WHERE oi.id = $1`,

  GET_ALL_ORDERS_BY_ID: `
    SELECT 
      o.id as order_id,
      oi.id as order_item_id,
      oi.complaintStatus,
      o.amount,
      o.delivery_fee,
      o.payment_type,
      o.ordered_at,
      s.name as status_name,
      s.color as status_color,
      p.id as product_id,
      p.name,
      p.category,
      p.images[1] as image,
      oi.price,
      a.street,
      a.city,
      a.state,
      a.country
    FROM orders o 
    JOIN order_items oi ON o.id = oi.order_id 
    JOIN products p ON oi.product_id = p.id
    JOIN addresses a ON o.address_id = a.id 
    JOIN statuses s ON oi.status_id = s.id
    WHERE o.user_id = $1
    ORDER BY o.ordered_at DESC, oi.id ASC;`,

  GET_ORDERS_BY_ANY: `
    SELECT 
      o.id as order_id,
      oi.id as order_item_id,
      o.delivery_fee,
      o.delivery_paid,
      o.payment_type,
      p.name,
      p.images,
      p.price as order_item_price,
      oi.price,
      u.email
    FROM order_items oi 
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    JOIN users u ON o.user_id = u.id
    WHERE oi.id = ANY($1) AND o.id = $2;
  `,

  UPDATE_ORDER_DELIVERY_PAID: `
    UPDATE orders 
    SET delivery_paid = true 
    WHERE id = $1;
  `,

  CANCEL_ORDER: `
    UPDATE order_items 
    SET status_id = 5
    WHERE id = $1 AND order_id = $2;`,

  ADD_COMPLAINT: `
    INSERT INTO complaints (order_item_id, user_id, description, image)
    VALUES ($1, $2, $3, $4)`,

  UPDATE_COMPLAINT_STATUS: `
    UPDATE complaints
    SET status = $1
    WHERE id = $2 AND user_id = $3
    RETURNING order_item_id
  `,

  UPDATE_ORDER_AND_COMPLAINT_STATUS: `
    UPDATE order_items
    SET status_id = $1, complaintstatus = $2
    WHERE id = $3
  `,

  UPDATE_ORDER_STATUS: `
    UPDATE order_items 
    SET status_id = $1 
    WHERE id = ANY($2) AND order_id = $3
    RETURNING *;`,

  CREATE_REFRESH_TOKEN: `
    INSERT INTO refresh_tokens (user_id, token, expires_at) 
    VALUES ($1, $2, $3) 
    ON CONFLICT (user_id) 
    DO UPDATE SET token = $2, expires_at = $3, created_at = NOW();`,

  CHECK_REFRESH_TOKEN_EXIST: `SELECT 1 FROM refresh_tokens WHERE user_id = $1 AND token = $2 AND expires_at > NOW()`,

  DELETE_REFRESH_TOKEN: `
    DELETE FROM refresh_tokens
    WHERE token = $1`,

  DELETE_EXPIRED_REFRESH_TOKENS: `
    DELETE FROM refresh_tokens 
    WHERE expires_at <= NOW();`,

  CHECK_PENDING_USER_EXIST: `
    SELECT id FROM pending_users 
    WHERE email = $1;`,

  CREATE_PENDING_USER: `
    INSERT INTO pending_users (name, email, password, verification_token, expires_at) 
    VALUES ($1, $2, $3, $4, $5);`,

  GET_PENDING_USER_BY_TOKEN: `
    SELECT * FROM pending_users 
    WHERE verification_token = $1 AND expires_at > NOW();`,

  GET_PENDING_USER_BY_EMAIL: `
    SELECT * FROM pending_users 
    WHERE email = $1;`,

  DELETE_PENDING_USER: `
    DELETE FROM pending_users 
    WHERE id = $1;`,

  DELETE_EXPIRED_PENDING_USERS: `
    DELETE FROM pending_users 
    WHERE expires_at <= NOW();`,

  UPDATE_PENDING_USER_TOKEN: `
    UPDATE pending_users 
    SET verification_token = $1, expires_at = $2 
    WHERE id = $3;`,

  UPSERT_PASSWORD_RESET: `
    INSERT INTO password_resets (email, reset_token, expires_at) 
    VALUES ($1, $2, $3) 
    ON CONFLICT (email) DO UPDATE SET 
      reset_token = EXCLUDED.reset_token, 
      expires_at = EXCLUDED.expires_at;`,

  DELETE_EXPIRED_PASSWORD_RESETS: `
    DELETE FROM password_resets 
    WHERE expires_at <= NOW();`,

  GET_PASSWORD_RESET_WITH_EMAIL: `
    SELECT id FROM password_resets 
    WHERE reset_token = $1 AND email = $2 AND expires_at > NOW();`,

  GET_PASSWORD_RESET: `
    SELECT id FROM password_resets 
    WHERE reset_token = $1 AND expires_at > NOW();`,

  DELETE_PASSWORD_RESET: `
    DELETE FROM password_resets 
    WHERE id = $1;`,

  UPDATE_USER_PASSWORD: `
    UPDATE users 
    SET password = $1 
    WHERE email = $2;`,

  GET_ALL_STATUSES: `SELECT * from statuses ORDER BY id`,
};

export default queryList;
