# Rinconcito del Sabor

Sistema operativo integral para restaurante construido con Next.js 16, React 19, TypeScript, PostgreSQL, Prisma 7 y TanStack Query.

## Módulos disponibles

- Acceso seguro con Argon2id, sesiones HTTPOnly, RBAC y recuperación de contraseña.
- Salón táctil por zonas, apertura implícita de mesa y toma rápida de pedidos.
- Productos con variantes, extras, observaciones, fotos Cloudinary y disponibilidad en vivo.
- KDS por estaciones, prioridad, temporizador y preparación por producto.
- Entrega, solicitud de cuenta, apertura/cierre de caja y pagos mixtos.
- Descuento automático de recetas, movimientos y alertas de inventario.
- Dashboard, reportes de ventas, usuarios, configuración y auditoría.
- Menú QR público en `/menu/mesa/:numero`.
- Sincronización SSE con PostgreSQL LISTEN/NOTIFY y caché selectiva de TanStack Query.
- PWA instalable; el service worker nunca almacena respuestas de API.

## Desarrollo local

1. Copia `.env.example` a `.env` y completa las variables.
2. Inicia PostgreSQL con `docker compose up -d db` o `npx prisma dev --detach --name rinconcito`.
3. Ejecuta:

```bash
npm install
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

El seed requiere `SEED_DEMO_PASSWORD` (mínimo 12 caracteres) y crea cuentas para los roles `ADMINISTRADOR`, `MESERO`, `COCINA` y `CAJERO`.

## Verificación

```bash
npm run prisma:validate
npm run typecheck
npm run lint
npm test
npm run build
```

Con la aplicación y base de datos activas, el recorrido transaccional completo puede comprobarse con:

```bash
E2E_BASE_URL=http://localhost:3000 E2E_PASSWORD=tu-clave npm run test:e2e
```

## Servicios externos

Brevo y Cloudinary están encapsulados en `src/services`. Si sus variables no están configuradas, el sistema mantiene las operaciones principales y registra el estado de la integración sin exponer secretos al navegador.
