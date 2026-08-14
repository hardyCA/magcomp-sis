---
name: sistema-comercial
description: Contexto principal del Sistema Comercial Multiplataforma (ventas, inventario, productos, cotizaciones, catálogo público, reportes, usuarios/roles y tipo de cambio BOB/USD). Úsala SIEMPRE que se trabaje en este proyecto: "vamos a hacer ventas", "vamos con inventario", "haz el catálogo", "crea productos", "tipo de cambio", "cotizaciones", "reportes", "dashboard", o cualquier cambio en este sistema comercial.
---

# SISTEMA COMERCIAL MULTIPLATAFORMA

## 1. PROPÓSITO DEL PROYECTO

Sistema comercial simple, moderno, multiplataforma y escalable para gestionar:

* Ventas
* Inventario
* Productos
* Cotizaciones
* Catálogo público
* Reportes
* Usuarios y roles
* Tipo de cambio entre Boliviano (BOB/Bs) y Dólar estadounidense (USD)

Debe comenzar simple, pero su arquitectura debe permitir agregar módulos posteriormente sin reconstruir el proyecto.

NO agregar funcionalidades que no hayan sido solicitadas.

## 2. PRINCIPIO FUNDAMENTAL

Simple de utilizar, rápido, responsive, multiplataforma, escalable, fácil de mantener, modular, seguro y preparado para crecer.

Debe funcionar correctamente en PC, laptop, tablet y celular. La interfaz debe adaptarse automáticamente al tamaño de pantalla.

## 3. STACK TECNOLÓGICO

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- DaisyUI

### Backend
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage

### Hosting
- Vercel

No cambiar de tecnología sin una razón técnica importante y sin explicarlo previamente.

## 4. ARQUITECTURA

Arquitectura modular, organizar el proyecto por funcionalidades:

```text
src/
├── app/
├── components/
├── modules/
│   ├── auth/
│   ├── dashboard/
│   ├── productos/
│   ├── inventario/
│   ├── ventas/
│   ├── cotizaciones/
│   ├── catalogo/
│   └── reportes/
├── lib/
├── hooks/
├── types/
└── utils/
```

La estructura puede adaptarse si Next.js recomienda otra organización mejor. Evitar tener toda la lógica mezclada.

## 5. ROLES

Inicialmente dos roles:

### ADMINISTRADOR
Puede: gestionar productos, categorías, marcas, inventario, registrar ventas, gestionar cotizaciones, catálogo, ver reportes, gestionar usuarios, configurar tipo de cambio y configuraciones.

### VENDEDOR
Puede: consultar productos, consultar stock, registrar ventas, crear cotizaciones, consultar sus ventas, consultar sus cotizaciones, utilizar el catálogo.

El vendedor NO debe tener acceso a configuraciones administrativas. La seguridad de roles debe aplicarse tanto en frontend como en backend/base de datos.

## 6. PRODUCTOS

Campos mínimos:
```text
id, codigo_barras, nombre, categoria_id, marca_id, stock, stock_minimo,
imagen, precio_venta, moneda, activo, created_at, updated_at
```

### IMPORTANTE
NO manejar precio de compra. Solo precio de venta y moneda del precio. NO crear campos de precio_compra, costo ni margen de utilidad, salvo que se soliciten explícitamente.

## 7. CATEGORÍAS

Productos pertenecen a categorías. Ejemplo: Electrónica, Ropa, Calzado, Accesorios, Hogar. Debe existir CRUD de categorías.

## 8. MARCAS

Productos pueden tener una marca. Ejemplo: Samsung, LG, Nike, Adidas, Sony. Debe existir CRUD de marcas.

## 9. INVENTARIO

Controla: stock actual, entradas, salidas, ajustes, historial de movimientos, stock mínimo y alertas de stock bajo.

Cada movimiento guarda: producto, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, usuario, fecha, motivo.

Tipos de movimiento iniciales: ENTRADA, SALIDA, AJUSTE, VENTA.

Al registrar una venta: stock actual - cantidad vendida. Actualizar inventario automáticamente. No permitir stock negativo salvo configuración explícita posterior.

## 10. VENTAS

El módulo debe permitir: buscar producto (por código de barras o nombre), seleccionar cantidad, agregar al carrito, modificar cantidad, aplicar descuento, calcular subtotal/total, seleccionar moneda y registrar venta.

Estructura:
```text
venta: usuario, fecha, moneda, tipo_cambio, subtotal, descuento, total
detalle_venta: producto, cantidad, precio_unitario, subtotal
```

## 11. TIPO DE CAMBIO

Trabajar con BOB/Bs y USD. Configuración global `tipo_cambio`. Ejemplo: 1 USD = 6.96 Bs. El administrador puede modificarlo.

### REGLA MUY IMPORTANTE
Al registrar venta o cotización se guarda el tipo de cambio usado en ese momento. NO depender solo del tipo de cambio actual. Ejemplo: cotización creada con 1 USD = 6.96 Bs debe conservar ese valor aunque mañana sea 7.10 Bs.

## 12. COTIZACIONES

Contiene: numero, cliente, usuario, fecha, moneda, tipo_cambio, subtotal, descuento, total, estado.

Estados iniciales: PENDIENTE, ACEPTADA, RECHAZADA, VENCIDA.

Debe permitir agregar productos y cantidades. Una cotización aceptada puede convertirse en venta. La conversión debe evitar duplicar información o descontar stock dos veces.

## 13. CATÁLOGO

Catálogo público sin necesidad de entrar al panel administrativo. Cada producto puede mostrar: imagen, nombre, categoría, marca, precio, moneda y disponibilidad.

Incluye: buscador, filtros por categoría, filtros por marca, estado de disponibilidad. Optimizado para celulares, visual y sencillo.

## 14. REPORTES

### Ventas
Ventas del día, ventas por período, total vendido, cantidad de ventas, productos vendidos, productos más vendidos.

### Inventario
Stock actual, productos con stock bajo, movimientos, entradas, salidas.

### Cotizaciones
Total, pendientes, aceptadas, rechazadas.

Los reportes deben filtrarse por fechas.

## 15. DASHBOARD

Información resumida: ventas hoy, ventas del mes, productos, stock bajo, cotizaciones pendientes. Agregar gráficos solo cuando aporten valor. No sobrecargar la interfaz.

## 16. BASE DE DATOS

Tablas iniciales recomendadas:
```text
profiles, roles, productos, categorias, marcas, movimientos_inventario,
ventas, detalle_ventas, cotizaciones, detalle_cotizaciones, tipo_cambio, configuracion
```

Relaciones mediante claves foráneas. UUID cuando sea conveniente. Agregar created_at y updated_at donde corresponda.

## 17. SEGURIDAD

Supabase Auth, Row Level Security (RLS), permisos por rol, validación de datos, protección de rutas, validación en servidor. Nunca confiar solo en el frontend. Un usuario no autorizado no debe ejecutar acciones administrativas manipulando peticiones.

## 18. IMÁGENES

Guardar en Supabase Storage, no en PostgreSQL. Solo la referencia/URL en la tabla productos. Optimizar imágenes.

## 19. INTERFAZ

Moderno, limpio, profesional, simple, responsive. Funcionar con mouse/teclado en PC y toque en celulares/tablets. Componentes reutilizables. Evitar complejidad excesiva.

## 20. REGLAS DE DESARROLLO CON IA

1. NO modificar funcionalidades existentes sin explicarlo.
2. NO eliminar código funcional solo para simplificar.
3. NO crear funcionalidades no solicitadas.
4. Antes de cambios importantes, analizar impacto en: BD, autenticación, roles, inventario, ventas, cotizaciones, tipo de cambio, catálogo.
5. Si existe mejor solución técnica, explicarla brevemente antes de aplicarla.
6. Priorizar soluciones simples. No usar arquitectura excesivamente compleja para funciones sencillas.
7. Reutilizar componentes. No crear duplicados.
8. Mantener TypeScript correctamente tipado. Evitar `any` cuando exista alternativa.
9. No duplicar lógica. Centralizar en servicios, hooks o utilidades.
10. Cada cambio debe mantener funcionando funcionalidades anteriores.

## 21. FORMA DE TRABAJO

Trabajar por etapas. NO desarrollar todo de una sola vez. Orden:

### FASE 1: Configuración del proyecto
### FASE 2: Autenticación y roles
### FASE 3: Base de datos
### FASE 4: Productos
### FASE 5: Categorías y marcas
### FASE 6: Inventario
### FASE 7: Ventas
### FASE 8: Cotizaciones
### FASE 9: Tipo de cambio
### FASE 10: Catálogo
### FASE 11: Reportes
### FASE 12: Dashboard
### FASE 13: Optimización y seguridad

## 22. REGLA DE CONTEXTO

Antes de cualquier cambio: revisar estas reglas, identificar módulo modificado, revisar dependencias con otros módulos, mantener compatibilidad, no cambiar decisiones arquitectónicas sin justificarlo.

Cuando el usuario diga "vamos a hacer ventas" se refiere al módulo de ventas. "vamos con inventario" al módulo de inventario. "haz el catálogo" al catálogo público.

## 23. REGLA PARA CAMBIOS FUTUROS

Módulos futuros (NO desarrollar hasta ser solicitados): clientes, proveedores, compras, caja, gastos, sucursales, devoluciones, promociones, pagos, facturación, reportes avanzados, app móvil, API, integraciones. La arquitectura debe evitar bloquear su futura incorporación.

## 24. COMPORTAMIENTO ESPERADO DE LA IA

Al solicitar una funcionalidad: entender el objetivo, revisar este contexto, identificar archivos afectados, revisar dependencias, proponer solución si el cambio es importante, implementar de forma modular, mantener funcionalidades existentes, explicar brevemente qué se modificó, indicar si existe migración de BD, indicar cómo probar.

No hacer cambios innecesarios. No complicar el sistema. No asumir requisitos no solicitados.

## 25. OBJETIVO FINAL

Sistema comercial inicial: VENTAS + INVENTARIO + COTIZACIONES + CATÁLOGO + REPORTES + TIPO DE CAMBIO + USUARIOS Y ROLES, con arquitectura que permita evolucionar hacia un sistema empresarial completo.

Prioridad: SIMPLE → FUNCIONAL → SEGURO → ESCALABLE → MANTENIBLE
