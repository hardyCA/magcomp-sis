# MAG COMP · Sistema Comercial

Sistema comercial simple, moderno y multiplataforma para gestionar ventas, inventario, productos, cotizaciones, catálogo público, reportes, usuarios/roles y tipo de cambio BOB/USD.

## Stack

- **Frontend:** Next.js · React · TypeScript · Tailwind CSS · DaisyUI
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Hosting:** Vercel

## Módulos

- Ventas
- Inventario
- Productos, categorías y marcas
- Cotizaciones
- Catálogo público
- Reportes y dashboard
- Usuarios y roles (admin / vendedor)
- Tipo de cambio BOB/USD

## Configuración

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env.local` y completa las credenciales de Supabase:

   ```bash
   cp .env.example .env.local
   ```

3. Ejecuta las migraciones de `supabase/` en tu proyecto Supabase.

4. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Despliegue en Vercel

Conecta el repositorio en [Vercel](https://vercel.com/new) y configura las mismas variables de entorno de `.env.local` en el panel del proyecto.