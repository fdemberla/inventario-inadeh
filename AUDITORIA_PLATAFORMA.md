# Auditoría de la plataforma — Inventario INADEH (WMS)

Fecha: 2026-11-23 · Rama: `basepath-support` · Stack: Next.js 15 (App Router), NextAuth v5 (JWT), MSSQL, Tailwind v4 + flowbite-react, PWA.

Esta auditoría solo revisó código. No se cambió código de la aplicación.

---

## 0. Skills instaladas (`.claude/skills/`)

| Skill | Fuente | Para qué |
|---|---|---|
| `owasp-security` | hoodini/ai-agents-skills | Prácticas OWASP Top 10 |
| `wcag-audit-patterns` | wshobson/agents | Auditoría WCAG 2.x AA (cubre 2.1 AA) |
| `impeccable` | pbakaus/impeccable | Crítica, pulido y endurecimiento de UI |
| `ui-ux-pro-max` | nextlevelbuilder/ui-ux-pro-max-skill | Sistema de diseño, paletas, UX |
| `responsive-design` | wshobson/agents | Layouts mobile-first |

Ya existían en `.agents/skills/`, pero Claude Code no las leía desde ahí.

> El script CLI de `impeccable` descarga un binario desde GitHub releases (verificado por checksum) la primera vez que se ejecuta.

---

## 1. Seguridad y autorización (OWASP A01 – Broken Access Control)

**Modelo actual**
- El middleware exige sesión para `/api/*` y `/dashboard*`, pero **no verifica el rol**.
- Casi toda la autorización depende de que cada ruta llame a `isAdmin()` / `canAccessWarehouse()`.
- Muchas rutas no lo hacen.

### 🔴 Crítico

| # | Hallazgo | Archivo | Impacto |
|---|---|---|---|
| S1 | **Escalada de privilegios.** Cualquier usuario autenticado puede editar *cualquier* usuario: `RoleID`, `PasswordHash`, `IsActive`. | `app/api/users/[id]/update/route.ts` | Un usuario GENERAL se vuelve ADMIN o cambia la contraseña del admin |
| S2 | Cualquier usuario autenticado puede **crear usuarios** (incluido un admin). | `app/api/users/create/route.ts` | Igual que S1 |
| S3 | Listado y detalle de todos los usuarios sin verificar rol. | `app/api/users/route.ts`, `users/[id]/route.ts` | Fuga de datos personales |

### 🟠 Alto

| # | Hallazgo | Archivo |
|---|---|---|
| S4 | Crear y editar almacenes sin auth en la ruta ni verificación de rol. Además, `update` no valida nada ni tiene `try/catch`. | `warehouses/create`, `warehouses/[id]/update` |
| S5 | Editar categoría sin rol. Además usa `params.id` sin `await`, lo que es incorrecto en Next 15. | `categories/[id]/update/route.ts` |
| S6 | **Eliminar producto** (`DELETE`) sin auth en la ruta ni rol. | `products/[id]/route.ts` |
| S7 | **IDOR entre almacenes:** ajustes de inventario sin `canAccessWarehouse`. Un usuario puede modificar stock de un almacén que no le corresponde. | `inventory/update`, `inventory/scanner/*`, `inventory/scanner/mobile/scan`, `mobile/sync` |
| S8 | `createdBy` viene del cliente en `inventory/update`, lo que permite falsificar la auditoría. No se valida `newQuantity` (puede ser negativo o no numérico). | `inventory/update/route.ts` |
| S9 | Reportes `alerta`, `exportar`, `movimiento` y `niveles` sin `canAccessWarehouse`, a diferencia de `tarjetas` y `valor`. Esto es una fuga de lectura de otros almacenes. | `reports/[id]/*` |
| S10 | **Usuarios desactivados pueden iniciar sesión:** `loginUser` no filtra `IsActive`. | `lib/login.ts` |
| S11 | El rol vive 7 días en el JWT. Degradar o desactivar a un usuario no tiene efecto hasta que expira el token (web y móvil). | `lib/auth.config.ts`, `lib/mobile-auth.ts` |
| S12 | Las páginas de admin (`/dashboard/users`, `warehouse`, etc.) solo exigen sesión, no rol. | `app/dashboard/layout.tsx` |

### 🟡 Medio / bajo
- Sin rate limiting ni bloqueo por intentos en `/api/auth/*` y `/api/auth/mobile/login` (fuerza bruta).
- Middleware: cualquier header `Bearer …` en una ruta con `/mobile/` omite NextAuth. Hoy las 5 rutas móviles verifican el token, pero es frágil: una ruta nueva bajo `/mobile/` que olvide `getMobileSession` quedaría pública.
- Respuestas 500 con `details: error.message` (3 rutas) exponen detalles internos.
- Sin cabeceras de seguridad (CSP, HSTS, X-Frame-Options, etc.) en `nginx.conf` ni en `next.config.ts`.
- ✅ SQL parametrizado en todas partes. El `whereClause` interpolado solo contiene fragmentos fijos.
- ✅ bcrypt para contraseñas. `NEXTAUTH_SECRET` es obligatorio.

### ✅ Fase 1 aplicada (2026-11-23, sin commit)

**Guardas de autorización**
- Nuevas guardas en `lib/authz.ts` (`requireUser`, `requireAdmin`, `requireWarehouse`), usadas en cada ruta afectada.
- **Solo admin:**
  - `users/*`, `roles`, `warehouses` (lista, crear, editar)
  - `categories/:id/update` (además se corrigió `params` sin `await`)
  - `DELETE products/:id`
  - `inventory/transactions`
- **Por almacén:**
  - `inventory/update`, `inventory/:id`, `warehouses/:id`
  - el escáner web y su sincronización, y las tres rutas `mobile/*`
  - los reportes `alerta`, `exportar`, `movimiento` y `niveles`

**Integridad de los datos**
- `createdBy` sale siempre de la sesión.
- Las cantidades deben ser enteros: ≥ 0 en ajustes, y entre 1 y 10000 en escaneos.
- La sincronización ya no acepta `entrada` con cantidades negativas.

**Sesión y login**
- `getApiAuth` vuelve a consultar en la BD `IsActive` y `RoleID` (caché de 30 s). Si la consulta falla, deniega el acceso.
- Al editar un usuario se limpia su entrada en la caché, así el cambio aplica de inmediato.
- El login rechaza usuarios inactivos. Usa un tiempo de respuesta constante para no revelar qué usuarios existen.
- Límite de intentos fallidos (`lib/rate-limit.ts`): 5 por usuario+IP, 30 por IP y 20 por usuario en 15 minutos. La app móvil recibe un 429.

**Middleware, páginas y cabeceras**
- En rutas `/mobile/`, el middleware solo omite la sesión web si el token Bearer es válido.
- Las páginas de admin (users, warehouse, categories, units, suppliers, products create/edit) redirigen a `/dashboard` a quien no es admin.
- La página de productos oculta Crear, Editar y Eliminar a los usuarios GENERAL.
- Cabeceras de seguridad en `next.config.ts`. `removeConsole` ya no elimina `console.error` ni `console.warn`.
- `nginx.conf` ahora fija `X-Real-IP`, que usa el limitador.
- Se quitó `details` / `error_details` de las respuestas de error.

**Tests:** `tests/authz.test.ts` y `tests/auth-hardening.test.ts` (36 tests).

**Pendiente**
- Probar con servidor y BD reales: los tests de `tests/api/` necesitan `localhost:3000`.
- Desplegar `nginx.conf`.
- CSP (requiere revisar los estilos inline de flowbite).
- `typescript.ignoreBuildErrors: true` oculta unos 200 errores de tipos. Gran parte viene de la firma de `sql()` en `lib/db.ts`.

### Corrección propuesta (original)
1. Crear helpers `requireUser(req)`, `requireAdmin(req)` y `requireWarehouse(req, id)` en `lib/api-auth.ts` que devuelvan 401/403. Usarlos en **todas** las rutas, sin depender del middleware.
2. Cubrir con `requireAdmin`: users (todas), warehouses create/update, categories/units/suppliers/products create/update/delete.
3. Aplicar `requireWarehouse` en todo endpoint que reciba `warehouseId`: inventario, scanner, móviles y reportes.
4. `createdBy` siempre desde la sesión. Validar cantidades (entero ≥ 0).
5. Filtrar `IsActive = 1` en el login. Revalidar rol e `IsActive` desde la BD en el callback `jwt` (p. ej. cada 5 min) y en `verifyMobileToken`.
6. Proteger por rol en `dashboard/layout.tsx` o en el middleware las secciones de admin.
7. Añadir rate limit al login, cabeceras de seguridad y quitar `details` de las respuestas.
8. Añadir tests Jest por ruta: usuario GENERAL → 403, almacén ajeno → 403.

---

## 2. Enrutamiento

| Sev. | Hallazgo |
|---|---|
| 🔴 | `units/page.tsx:69` navega a `/dashboard/units/[id]/edit`, pero la página es `/update`. Resultado: **404**. |
| 🔴 | `app/dashboard/products/edit/page.tsx` está **vacío (0 bytes)**, así que la ruta falla. |
| 🟠 | `redirect(withBasePath(...))` en `dashboard/layout.tsx:17` y `user-dashboard/layout.tsx:15,17`. `redirect()` ya añade el basePath, por lo que probablemente queda **duplicado** (`/base/base/login`). Hay que verificarlo con `NEXT_PUBLIC_BASE_PATH` activo. `app/page.tsx` usa `redirect("/login")` sin prefijo, lo que es inconsistente. |
| 🟠 | `/user-dashboard` está huérfano. El login siempre envía a `/dashboard` y nada enruta al rol GENERAL. Además tiene textos en inglés ("Hello,", "Inventory"). |
| 🟡 | La navegación está definida dos veces (`Sidebar.tsx` y `BottomMenu.tsx`) y no coincide: Reportes no aparece en el Sidebar. `BottomMenu` usa `<button onClick=router.push>` en lugar de `<Link>`. |

### ✅ Fase 2 aplicada (2026-11-23, sin commit)

**Rutas que no funcionaban**
- **Editar unidad** daba 404, y la página `units/[id]/update/page.tsx` también estaba vacía, así que la edición de unidades no existía.
  - Se creó `/dashboard/units/[id]/edit` con su API (`GET /api/units/:id` y `PUT /api/units/:id/update`, solo admin).
  - Solo se pueden editar unidades personalizadas. Las estándar están protegidas en la API y no muestran el botón "Editar".
- Se eliminó `products/edit/page.tsx` (vacío). La edición real está en `products/edit/[id]`.

**basePath duplicado** (verificado en el código de Next 15.3.1: `redirect()` y `router.push()` ya añaden el basePath)
- Se corrigió en `dashboard/layout.tsx` y en el respaldo del logout en `Sidebar.tsx`.
- `signOut({ callbackUrl })` sí necesita `withBasePath`; se corrigió su comentario, que decía lo contrario.

**Un solo dashboard**
- Se eliminaron `app/user-dashboard` y la página huérfana `/dashboard/inventory/update`. El escáner, en `update/scanner/[id]`, se mantiene.
- `/user-dashboard/*` ahora redirige a `/dashboard` (o a `/login` si no hay sesión).

**Build**
- Se corrigieron 14 errores de ESLint que bloqueaban `next build`.
- Con `NEXT_PUBLIC_BASE_PATH=/inventario` el build genera las 48 páginas sin errores (verificado en un worktree aislado).
- Un escaneo de todos los enlaces y navegaciones contra las páginas existentes no encuentra rutas rotas.

**Decisión (2026-11-23):** se usa **solo `/dashboard`**, con navegación y acceso filtrados por rol. Se elimina `app/user-dashboard`.

---

## 2b. Investigación: "producto en inventario 0 no se borra"

**Cómo se verificó.** Se revisaron por código todos los caminos que cambian el stock. Todos permiten llegar a 0:
- el modal "Actualizar cantidad"
- el escáner web
- la sincronización offline
- las rutas móviles

No hay `min=1` en ningún campo. La vista de inventario (`inventory/[id]/view`) oculta los productos en 0 por defecto desde `c27b125` (18-mar-2026), con el checkbox "Ver productos sin stock".

**Causas encontradas y corregidas:**

1. **Filas duplicadas de inventario (causa más probable).** "Agregar a inventario" siempre insertaba una fila nueva, aunque el producto ya existiera en ese almacén. Al poner una fila en 0, la duplicada seguía mostrando stock.
   - Ahora la API responde **409** con un mensaje claro.
   - Hay que limpiar los duplicados que ya existan en la base de datos (consulta abajo).
2. **El escáner encolaba como "offline" los rechazos del servidor.** Un 400/409 ("cantidad actual es 0", "no registrado") se trataba como falla de red y se guardaba para sincronizar más tarde. Después fallaba al sincronizar y bloqueaba el escáner.
   - Ahora los errores 4xx se muestran al usuario. Solo los errores 5xx o de red se encolan.
3. **El modal aceptaba cantidades negativas o decimales.** Ahora se valida que sea un entero ≥ 0, tanto en el cliente como en la API.

**Pendiente de verificar en producción:**
- Que el build desplegado incluya `c27b125`.
- Si hay duplicados:

```sql
SELECT ProductID, WarehouseID, COUNT(*) AS Filas, SUM(QuantityOnHand) AS Total
FROM dbo.Inventory GROUP BY ProductID, WarehouseID HAVING COUNT(*) > 1;
```

Después de consolidar, conviene agregar `UNIQUE (ProductID, WarehouseID)` en `dbo.Inventory`.

Notas:
- El catálogo `/dashboard/products` lista todos los productos activos sin importar el stock. Es correcto, porque es un catálogo y no inventario.
- `/dashboard/inventory/update` es una página huérfana (no aparece en ningún menú) que muestra los productos en 0. Se eliminará en la fase 2.

---

## 3b. ✅ Fase 3 aplicada: navegación móvil (2026-11-23, sin commit)

**Menú compartido**
- `lib/navigation.ts` es la única fuente del menú y lo filtra por rol.
- Se agregó **Reportes**, que es seguro para el rol GENERAL porque la API filtra por almacén.

**Celular** (`BottomMenu`)
- La barra muestra Inicio, Inventario, Productos, Reportes y **Más**.
- "Más" abre un panel desde abajo con el resto de secciones, sus accesos "Crear …", el usuario y "Cerrar sesión".
- El panel se cierra con Escape o al navegar, retiene el foco del teclado y bloquea el desplazamiento de la página de fondo.
- Usa `<Link>` y áreas táctiles de 56 px o más.

**Escritorio** (`Sidebar`)
- Usa el mismo menú y no depende de flowbite.
- Los encabezados de sección son `<button>` reales.
- Los enlaces de secciones cerradas ya no son alcanzables con Tab.
- La sección de la página actual se abre sola.
- Se eliminó el código móvil que nunca se mostraba.

**Layout**
- Enlace "Saltar al contenido".
- Espacio inferior que contempla el área segura del iPhone.

**Verificación**
- En el navegador a 375 px con el usuario admin: se llega a Usuarios desde "Más", el panel cierra al navegar, el foco vuelve a "Más" y no hay desplazamiento horizontal.
- A 1280 px: el Sidebar muestra las 9 secciones.
- `tests/navigation.test.ts` (7 tests).
- No se probó con un usuario GENERAL real: el filtro está cubierto por los tests.

**Encontrado de paso (para la fase 5):** en `/login`, el campo de contraseña no está asociado a su `<label>` y el botón de enviar no tiene nombre accesible.

## 3c. ✅ Fase 4 aplicada: tokens de diseño (2026-11-23, sin commit)

**Tokens en un solo lugar**
- Los tokens viven solo en `app/globals.css`. Se eliminaron `tailwind.config.ts` y `lib/design-tokens.ts`: Tailwind v4 los ignoraba y nadie los importaba.
- Prettier ahora apunta a `globals.css` (`tailwindStylesheet`).

**Tokens semánticos**
- Disponibles como `canvas`, `surface`, `fg`, `fg-muted`, `line`, `line-strong`, `primary`, `secondary`, `danger`, `on-primary`, `accent`, `success`, `warning`, `danger-fg` y `focus`.
- Cambian solos en modo oscuro, que sigue la preferencia del sistema igual que `dark:`.
- Todas las combinaciones se verificaron con la fórmula WCAG: texto ≥ 4.5:1 y foco ≥ 3:1, en claro y en oscuro.

**Tonos de marca accesibles** (los colores del logo se mantienen para íconos y decoración)

| Uso | Antes | Ahora |
|---|---|---|
| Verde | `#44A147` (3.26:1) | `#337935` (5.35:1) |
| Naranja | `#ED7625` (2.91:1) | `#B2591C` (4.84:1) |
| Peligro | red-500 (3.76:1) | red-600 (4.83:1) |
| Azul en modo oscuro | `#004A98` (2.06:1) | `#80A5CC` (6.90:1) |

**Componentes actualizados**
- `Button`, `Card`, `Modal`, `Input`, `FormField`, `Spinner`, el encabezado de `DataTable` y `BottomMenu` usan los tokens.
- Se quitaron los hex fijos, el *glassmorphism* (translúcido + blur) y las sombras de color.
- Foco visible con `outline-focus`.
- Los botones `sm` y `md` miden 44 px en pantallas táctiles.
- Los bordes de los inputs pasaron de invisibles (`white/50`) a `line-strong` (4.83:1, WCAG 1.4.11).

**Otros cambios**
- La fuente **Geist** se cargaba pero no se usaba; ahora es `font-sans`.
- Las animaciones `animate-in`/`zoom-in-95` no existían; ahora existen `animate-fade-in`, `animate-zoom-in` y `animate-slide-up`.
- Se respeta `prefers-reduced-motion`.
- El fondo de la app pasó de `brand-gris` (`#D1D3D4`) a `canvas` (`#F1F2F3`).

**Verificación**
- En el navegador (escritorio claro y oscuro, y celular oscuro), los colores calculados coinciden con los tokens.
- ESLint pasa sin errores en todo el proyecto y los 161 tests pasan.

**Pendiente para la fase 6**
- Quedan 618 clases de paleta cruda (antes 709).
- Hay 32 usos de `text-gray-500`, que no alcanza 4.5:1 sobre `canvas`.

**Fuera de esta fase**
- En desarrollo el *service worker* no se registra (*"unknown error when fetching the script"*), aunque `/sw.js` responde 200.
- `public/sw.js` es un artefacto de build versionado: cada `next build` lo modifica.

## 3d. ✅ Fase 5 aplicada: componentes accesibles (2026-11-23, sin commit)

**Formularios**
- `Input` y `FormField`: etiqueta asociada (`useId` + `htmlFor`); error y ayuda vinculados con `aria-describedby`; `required` nativo con el asterisco oculto para lectores de pantalla.
- El campo **Usuario** del login no tenía etiqueta asociada; ahora sí.
- Corrección a la auditoría: la contraseña y el botón "Iniciar Sesión" sí tenían nombre accesible. La herramienta de inspección mostraba el *placeholder* y no se verificó en el DOM.
- Login: el botón para mostrar la contraseña ahora mide 44 px y tiene foco visible; se agregó `autocomplete`.

**Diálogos**
- Nuevo `hooks/useDialog.ts`: retiene el foco, cierra con Escape, devuelve el foco y bloquea el scroll. Lo comparten `Modal` y el menú "Más".
- `Modal` se renderiza en un *portal* sobre `<body>`, tiene ids únicos y es un panel inferior en celular. Enfoca el primer campo al abrirse.
- **Corregido:** en celular la barra inferior tapaba el botón "Cancelar" de los modales. El contenedor `relative z-10` de `PageLayout` atrapaba el `z-index`.

**Tabla (`DataTable`)**
- Es un panel único con búsqueda y paginación internas: *padding* de 16/20 px en la barra y 20 px en los bordes de la tabla. Antes la búsqueda tocaba el borde.
- Encabezados y celdas con la misma alineación.
- Usa `<table>` nativa en lugar de flowbite, sin sobrescrituras `!important`.
- Encabezados ordenables como botones con `aria-sort`; `caption` para lectores de pantalla.
- Contador de resultados con `aria-live`. Paginación con `IconButton` y el texto "Mostrando X–Y de Z".
- Orden alfabético en español (`Intl.Collator`).

**Otros**
- Nuevo `IconButton`, con `aria-label` obligatorio.
- `inventory/[id]/view`: se quitó la tarjeta doble y el *checkbox* "Ver productos sin stock" pasó a la barra de la tabla.
- **Corregido:** el botón "Agregar Producto" nunca aparecía, porque usaba una *prop* inexistente (`actionButton`).
- **Corregido:** en Usuarios no se podía ordenar ni buscar por nombre, porque la columna usaba un campo `FullName` que la API no devuelve.
- `caption` agregado a las 7 tablas.

**Verificación**
- En el navegador (escritorio y celular, sin guardar datos): etiquetas, `required`, `aria-sort`, orden real de las filas, búsqueda por nombre completo, foco atrapado y devuelto, Escape, y que ningún elemento tape los botones del modal.
- ESLint pasa en todo el proyecto y los 161 tests pasan.
- **Sin tests de componentes:** requieren agregar `jsdom` y `@testing-library/react`.

## 3. Lenguaje visual e identidad

- 🔴 **Los tokens de diseño no están conectados.** Tailwind v4 ignora `tailwind.config.ts` porque no hay `@config`. Por eso no existen `success/warning/error`, el espaciado, las fuentes ni las animaciones (`animate-gradient-shift`, `animate-in`). `lib/design-tokens.ts` se importa **0 veces**. `globals.css` solo define 4 colores `brand-*`.
- 🔴 Hay **709 clases de paleta cruda** (`blue-600`, `red-500`…) frente a ~128 usos de `brand-*`. Hay 18 hex sueltos en TSX, incluido `ui/Button.tsx` (`bg-[#3ca340]`, `bg-[#de6615]`).
- 🟠 Se mezclan **tres sistemas de componentes**:
  - flowbite (Sidebar, DataTable, WarehouseCard, scanner)
  - `ui/` propio
  - elementos crudos: 24 `<button>`, 9 `<input>`, 11 `<select>`. No existe `ui/Select`.
- 🟠 Hay componentes duplicados:
  - un modal hecho a mano en `inventory/[id]/add`
  - dos *password toggles* distintos
  - iconos SVG inline
- 🟡 Se usan **dos librerías de iconos**: react-icons (7 sub-paquetes) y lucide.
- 🟡 11 de 30 páginas no usan `PageLayout`. Los `h1` tienen 5 estilos distintos (de `text-xl` a `text-5xl`).
- 🟡 `Button` usa `backdrop-blur` y sombras grandes en todas sus variantes. Su anillo de foco `ring-white/50` es invisible sobre fondo claro.

---

## 4. Responsive / móvil

- 🔴 **En el celular no hay acceso a la mitad de la app.** `dashboard/layout.tsx:25` oculta el Sidebar completo (`hidden md:block`), lo que deja sin uso su menú hamburguesa móvil. `BottomMenu` solo ofrece Inicio, Productos, Inventario y Unidades. Desde el teléfono no se llega a Usuarios, Categorías, Proveedores, Almacenes ni Reportes.
- 🟠 Hay áreas táctiles menores de 44 px:
  - `Button size="sm"` (32 px), usado en toda la paginación
  - los *password toggles* (~28 px)
  - links `text-xs`
  - etiquetas del BottomMenu en `text-[10px]`
- 🟡 Tamaños fijos: gráficos `h-[500px]` y `h-[400px]`, `WarehouseCard` `h-[250px]`.
- 🟡 El escáner tiene estilos propios y botones de ~36 px.
- ✅ Lo que ya funciona bien:
  - `DataTable` cambia a tarjetas en móvil
  - el viewport es correcto y el zoom no está bloqueado
  - `BottomMenu` respeta el safe-area
  - el modal de agregar se muestra como bottom-sheet

---

## 5. Accesibilidad (WCAG 2.1 AA)

- 🔴 `ui/Input` acepta `label`, `error` y `helperText`, pero **no los renderiza**.
- 🔴 El `<label>` de `ui/FormField` no tiene `htmlFor`. Su `aria-describedby` se arma con el texto de la etiqueta (con espacios), así que es inválido.
- 🔴 Contraste de los colores de marca:

  | Combinación | Contraste | Mínimo AA |
  |---|---|---|
  | Blanco sobre verde #44A147 | ~3.3:1 | 4.5:1 |
  | Blanco sobre naranja #ED7625 | ~2.9:1 | 4.5:1 |
  | Encabezado de tabla `brand-azul/60` | ~3.2:1 | 4.5:1 |
  | `brand-azul` sobre `gray-900` (modo oscuro) | ~2:1 | 4.5:1 |

- 🟠 Los encabezados ordenables de `DataTable` no funcionan con teclado y no tienen `aria-sort`.
- 🟠 `ui/Modal` no atrapa el foco, no cierra con Escape, usa un `id` fijo y no devuelve el foco al cerrar.
- 🟠 Hay `focus:outline-none` sin reemplazo y un botón de cerrar (X) sin `aria-label`.
- ✅ Ya cumplen: `lang="es"`, `alt` en los logos y `aria-label` en BottomMenu y paginación.

---

## 6. Plan priorizado

| Fase | Trabajo | Esfuerzo |
|---|---|---|
| **1. Seguridad (urgente)** | S1–S12: helpers `requireAdmin` y `requireWarehouse` en todas las rutas, `IsActive` en el login, revalidación del rol, guardia de rol en las páginas de admin, tests 403 | 1–2 días |
| **2. Rutas rotas** | units `/edit` → `/update`, `products/edit` vacío, basePath doble en `redirect`, decisión sobre `user-dashboard` | ½ día |
| **3. Navegación móvil** | Un solo `navConfig` filtrado por rol. Sidebar como *drawer* en móvil o "Más" en BottomMenu. `<Link>` en vez de `router.push` | ½–1 día |
| **4. Tokens reales** | Pasar los tokens a `@theme` en `globals.css` (semánticos: primary, danger, surface, muted, radios, espaciado). Tonos de marca oscuros que cumplan AA para fondos con texto blanco (p. ej. verde ~#2E7D32, naranja ~#B85614). Eliminar `tailwind.config.ts` y `design-tokens.ts` | 1 día |
| **5. Primitivas `ui/` accesibles** | Input con label, error y `useId`. FormField con `htmlFor`. Nuevos `Select`, `Textarea`, `IconButton` (aria-label obligatorio, 44 px) y `PasswordInput`. Modal con focus trap y Escape. Button `sm` ≥ 40 px y foco visible | 1–2 días |
| **6. Migración de páginas** | Reemplazar los elementos crudos y el modal hecho a mano. Todas las páginas con `PageLayout`. Una sola librería de iconos (lucide). Quitar flowbite fuera de `DataTable` | 2–3 días |
| **7. Guardas** | Regla de lint contra paleta cruda y hex fuera de `ui/`. Auditoría WCAG con axe/Playwright en móvil | ½ día |
