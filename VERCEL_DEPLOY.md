# Despliegue en Vercel

Esta rama está preparada para desplegar el sistema con Next.js 16 + Prisma 7 + PostgreSQL.

## 1. Importar el repositorio

En Vercel, importa:

- Repositorio: `LuisSandovalD/rinconcito_del_sabor`
- Rama de producción: `deploy/vercel-ready`
- Framework: Next.js
- Install Command: `npm install`
- Build Command: `npm run vercel-build`

`vercel.json` ya contiene esos valores.

## 2. Variables obligatorias

Configura en **Project Settings → Environment Variables**:

- `DATABASE_URL`
- `DIRECT_URL`
- `SESSION_SECRET`

Recomendadas:

- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### APP_URL

Si usas un dominio propio:

```env
APP_URL=https://restaurante.midominio.com
NEXT_PUBLIC_APP_URL=https://restaurante.midominio.com
```

Si no defines `APP_URL`, el servidor intenta usar automáticamente las variables de URL suministradas por Vercel.

## 3. Base de datos

`DATABASE_URL` se usa en runtime.

`DIRECT_URL` se usa en `prisma.config.ts` para `prisma migrate deploy`. Esto permite usar una conexión directa para migraciones aunque el runtime use una conexión con pooling.

En producción, el build ejecuta:

```text
prisma generate
prisma migrate deploy
next build
```

En Preview no se ejecutan migraciones automáticamente para evitar modificar accidentalmente la base de producción. Si una preview usa una base de datos separada y quieres aplicar migraciones:

```env
VERCEL_RUN_MIGRATIONS=1
```

## 4. Brevo

Para correos reales configura:

```env
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
BREVO_SENDER_NAME=Rinconcito del Sabor
```

El dominio de `APP_URL` se usa para enlaces de recuperación de contraseña.

## 5. Cloudinary

Configura:

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## 6. Realtime

El sistema mantiene SSE + PostgreSQL LISTEN/NOTIFY y el pool realtime está limitado para un entorno serverless.

El KDS tiene además refetch automático de respaldo, por lo que una reconexión o finalización de una función SSE no exige F5.

## 7. Seed

No ejecutar `npm run prisma:seed` en Vercel Production.

El seed está destinado al entorno local/inicial y está protegido contra ejecución en producción.

## 8. Después del primer deploy

Verifica:

1. Inicio de sesión.
2. Crear pedido desde tablet.
3. Aparición automática en Cocina/KDS.
4. Cambio de estados cocina → salón.
5. Caja y pago.
6. Subida de imagen a Cloudinary.
7. Recuperación de contraseña vía Brevo.
8. Reportes y rango de fechas.
9. Descarga PDF de QR de mesas.
