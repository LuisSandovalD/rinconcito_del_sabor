export const PERMISSIONS = [
  "dashboard.view","tables.view","tables.open","tables.manage","tables.transfer","tables.merge","orders.view","orders.create","orders.update","orders.cancel","orders.priority","orders.discount","orders.transfer","orders.split",
  "kitchen.view","kitchen.start","kitchen.prepare","kitchen.complete","kitchen.cancel","products.view","products.create","products.update","products.change_price","products.disable",
  "recipes.view","recipes.manage","inventory.view","inventory.adjust","inventory.loss","inventory.movements","sales.view","sales.create","sales.cancel","sales.refund",
  "cash.view","cash.open","cash.close","cash.withdraw","cash.adjust","customers.view","customers.create","customers.update","reservations.view","reservations.manage","delivery.view","delivery.manage",
  "purchases.view","purchases.create","purchases.cancel","suppliers.view","suppliers.create","suppliers.update","expenses.view","expenses.create","expenses.cancel",
  "payments.view","payments.create","payments.refund","reports.view","users.view","users.create","users.update","users.disable","users.manage","roles.manage","audit.view","settings.view","settings.update","settings.manage"
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number];
