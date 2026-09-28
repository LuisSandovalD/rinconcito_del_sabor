import { config } from "dotenv";
import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { PERMISSIONS, type PermissionCode } from "../src/lib/permissions";

config();

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL es obligatorio para ejecutar el seed.");
const password = process.env.SEED_DEMO_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;
if (!password || password.length < 12) throw new Error("SEED_DEMO_PASSWORD debe tener al menos 12 caracteres.");
const demoPassword: string = password;

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const rolePermissions: Record<string, PermissionCode[]> = {
  ADMINISTRADOR: [...PERMISSIONS],
  MESERO: ["tables.view", "tables.open", "orders.view", "orders.create", "orders.update", "orders.transfer", "products.view", "reservations.view", "reservations.manage"],
  COCINA: ["orders.view", "kitchen.view", "kitchen.start", "kitchen.prepare", "kitchen.complete", "products.view", "products.update"],
  CAJERO: ["tables.view", "orders.view", "payments.view", "payments.create", "cash.view", "cash.open", "cash.close", "cash.withdraw", "sales.view", "sales.create"]
};

const people = [
  { email: "admin@rinconcito.pe", firstName: "Lucía", lastName: "Administradora", role: "ADMINISTRADOR" },
  { email: "mesero@rinconcito.pe", firstName: "Juan", lastName: "Ramírez", role: "MESERO" },
  { email: "cocina@rinconcito.pe", firstName: "Rosa", lastName: "Quispe", role: "COCINA" },
  { email: "caja@rinconcito.pe", firstName: "Marco", lastName: "Vega", role: "CAJERO" }
];

const catalog = [
  { name: "Ceviche clásico", slug: "ceviche-clasico", category: "Entradas", station: "Cocina", price: 34, cost: 13.2, minutes: 12, featured: true, image: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?auto=format&fit=crop&w=800&q=80" },
  { name: "Causa limeña", slug: "causa-limena", category: "Entradas", station: "Cocina", price: 18, cost: 6.8, minutes: 8, image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80" },
  { name: "Lomo saltado", slug: "lomo-saltado", category: "Platos principales", station: "Cocina", price: 36, cost: 14.5, minutes: 18, featured: true, image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80" },
  { name: "Arroz con mariscos", slug: "arroz-con-mariscos", category: "Platos principales", station: "Cocina", price: 38, cost: 16.1, minutes: 20, featured: true, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80" },
  { name: "Ají de gallina", slug: "aji-de-gallina", category: "Platos principales", station: "Cocina", price: 29, cost: 10.4, minutes: 14, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80" },
  { name: "Parrilla mixta", slug: "parrilla-mixta", category: "Parrillas", station: "Parrilla", price: 49, cost: 21, minutes: 25, image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=80" },
  { name: "Pollo a la brasa", slug: "pollo-a-la-brasa", category: "Parrillas", station: "Parrilla", price: 24, cost: 9.1, minutes: 16, featured: true, image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80" },
  { name: "Suspiro limeño", slug: "suspiro-limeno", category: "Postres", station: "Postres", price: 14, cost: 4.2, minutes: 5, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80" },
  { name: "Limonada frozen", slug: "limonada-frozen", category: "Bebidas", station: "Bebidas", price: 12, cost: 2.8, minutes: 5, image: "https://images.unsplash.com/photo-1523371054106-bbf80586c38c?auto=format&fit=crop&w=800&q=80" },
  { name: "Chicha morada", slug: "chicha-morada", category: "Bebidas", station: "Bebidas", price: 10, cost: 2.2, minutes: 3, image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80" },
  { name: "Inca Kola", slug: "inca-kola", category: "Bebidas", station: "Bebidas", price: 7, cost: 3.1, minutes: 2, image: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=800&q=80" },
  { name: "Pisco sour", slug: "pisco-sour", category: "Cócteles", station: "Bar", price: 22, cost: 7.4, minutes: 7, featured: true, image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=800&q=80" }
];

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("El seed está bloqueado en producción.");
  const permissionRows = await Promise.all(PERMISSIONS.map(code => db.permission.upsert({ where: { code }, update: {}, create: { code } })));
  const permissionByCode = new Map(permissionRows.map(row => [row.code, row.id]));

  const passwordHash = await argon2.hash(demoPassword, { type: argon2.argon2id });
  for (const person of people) {
    const role = await db.role.upsert({ where: { name: person.role }, update: {}, create: { name: person.role, system: true } });
    await db.rolePermission.createMany({
      data: rolePermissions[person.role].map(code => ({ roleId: role.id, permissionId: permissionByCode.get(code)! })),
      skipDuplicates: true
    });
    const user = await db.user.upsert({
      where: { email: person.email },
      update: { firstName: person.firstName, lastName: person.lastName, status: "ACTIVE" },
      create: { email: person.email, passwordHash, firstName: person.firstName, lastName: person.lastName }
    });
    await db.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id } });
  }

  await db.restaurantSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", legalName: "Rinconcito del Sabor S.A.C.", tradeName: "Rinconcito del Sabor", ruc: "20601234567", address: "Av. de la Tradición 245, Lima", phone: "+51 987 654 321", email: "hola@rinconcito.pe" }
  });

  const zoneSpecs = [{ name: "Salón principal", count: 12 }, { name: "Terraza", count: 6 }, { name: "Barra", count: 4 }];
  let tableNumber = 1;
  for (let z = 0; z < zoneSpecs.length; z++) {
    const spec = zoneSpecs[z];
    const zone = await db.zone.upsert({ where: { name: spec.name }, update: { sortOrder: z }, create: { name: spec.name, sortOrder: z } });
    for (let i = 0; i < spec.count; i++, tableNumber++) {
      await db.restaurantTable.upsert({
        where: { number: tableNumber },
        update: { zoneId: zone.id },
        create: { number: tableNumber, capacity: tableNumber > 12 ? 2 : tableNumber % 4 === 0 ? 6 : 4, zoneId: zone.id }
      });
    }
  }

  for (const [index, name] of ["Cocina", "Parrilla", "Bebidas", "Bar", "Postres"].entries()) {
    const colors = ["#f97316", "#ef4444", "#0ea5e9", "#8b5cf6", "#ec4899"];
    await db.station.upsert({ where: { name }, update: {}, create: { name, color: colors[index] } });
  }
  for (const [index, name] of ["Entradas", "Platos principales", "Parrillas", "Postres", "Bebidas", "Cócteles"].entries()) {
    await db.category.upsert({ where: { name }, update: { sortOrder: index }, create: { name, sortOrder: index } });
  }

  for (const item of catalog) {
    const category = await db.category.findUniqueOrThrow({ where: { name: item.category } });
    const station = await db.station.findUniqueOrThrow({ where: { name: item.station } });
    const product = await db.product.upsert({
      where: { slug: item.slug },
      update: { name: item.name, price: item.price, cost: item.cost, imageUrl: item.image, categoryId: category.id, stationId: station.id },
      create: { name: item.name, slug: item.slug, description: "Preparado al momento con ingredientes seleccionados.", price: item.price, cost: item.cost, estimatedMinutes: item.minutes, featured: item.featured ?? false, imageUrl: item.image, categoryId: category.id, stationId: station.id, type: item.category === "Bebidas" || item.category === "Cócteles" ? "BEVERAGE" : "DISH" }
    });
    if (item.slug === "lomo-saltado") {
      await db.productVariant.createMany({ data: ["1/2", "3/4", "Bien cocido"].map(name => ({ productId: product.id, groupName: "Término de carne", name })), skipDuplicates: true });
      await db.productAddon.createMany({ data: [{ name: "Huevo", price: 2 }, { name: "Queso", price: 3 }, { name: "Papas adicionales", price: 5 }].map(addon => ({ ...addon, productId: product.id })), skipDuplicates: true });
    }
  }

  const ingredients = [
    { name: "Carne de res", unit: "kg", stock: 14.5, min: 5, cost: 32 },
    { name: "Papa amarilla", unit: "kg", stock: 31, min: 10, cost: 4.8 },
    { name: "Arroz", unit: "kg", stock: 24, min: 8, cost: 4.2 },
    { name: "Pescado fresco", unit: "kg", stock: 8.4, min: 4, cost: 28 },
    { name: "Limón", unit: "kg", stock: 12, min: 5, cost: 6.5 },
    { name: "Cebolla", unit: "kg", stock: 9.2, min: 3, cost: 3.2 },
    { name: "Pisco", unit: "lt", stock: 6.5, min: 2, cost: 38 }
  ];
  for (const item of ingredients) {
    await db.ingredient.upsert({ where: { name: item.name }, update: {}, create: { name: item.name, unit: item.unit, stock: item.stock, minStock: item.min, averageCost: item.cost } });
  }

  const lomo = await db.product.findUniqueOrThrow({ where: { slug: "lomo-saltado" } });
  const ceviche = await db.product.findUniqueOrThrow({ where: { slug: "ceviche-clasico" } });
  for (const recipe of [
    { productId: lomo.id, ingredient: "Carne de res", quantity: 0.2 },
    { productId: lomo.id, ingredient: "Papa amarilla", quantity: 0.15 },
    { productId: lomo.id, ingredient: "Arroz", quantity: 0.1 },
    { productId: ceviche.id, ingredient: "Pescado fresco", quantity: 0.2 },
    { productId: ceviche.id, ingredient: "Limón", quantity: 0.12 },
    { productId: ceviche.id, ingredient: "Cebolla", quantity: 0.05 }
  ]) {
    const ingredient = await db.ingredient.findUniqueOrThrow({ where: { name: recipe.ingredient } });
    await db.recipeItem.upsert({ where: { productId_ingredientId: { productId: recipe.productId, ingredientId: ingredient.id } }, update: { quantity: recipe.quantity }, create: { productId: recipe.productId, ingredientId: ingredient.id, quantity: recipe.quantity } });
  }

  await db.cashRegister.upsert({ where: { name: "Caja principal" }, update: {}, create: { name: "Caja principal" } });
}

main().then(() => console.info("Datos iniciales creados correctamente.")).finally(() => db.$disconnect());
