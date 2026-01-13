# Sistema de Diseño Estandarizado

Sistema integral de tokens de diseño y componentes UI reutilizables para el app de Inventario INADEH.

## 📦 Componentes Disponibles

### 1. **Button** - Componente de Botón
Botón reutilizable con múltiples variantes y tamaños.

```tsx
import { Button } from "@/app/components/ui";

// Variante primaria (verde)
<Button variant="primary" size="md">
  Guardar
</Button>

// Variante secundaria (naranja)
<Button variant="secondary" onClick={handleEdit}>
  Editar
</Button>

// Variante peligro (rojo)
<Button variant="danger" onClick={handleDelete}>
  Eliminar
</Button>

// Variante ghost (transparente)
<Button variant="ghost">
  Cancelar
</Button>

// Con iconos
<Button leftIcon={<SaveIcon />} variant="primary">
  Guardar
</Button>

// Loading state
<Button isLoading variant="primary">
  Procesando...
</Button>
```

**Props:**
- `variant`: "primary" | "secondary" | "danger" | "ghost" | "outline" (default: "primary")
- `size`: "sm" | "md" | "lg" (default: "md")
- `isLoading`: boolean
- `disabled`: boolean
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode

---

### 2. **Input** - Componente de Campo de Entrada
Input con soporte para errores, labels, y helper text.

```tsx
import { Input } from "@/app/components/ui";

// Input básico
<Input
  type="text"
  placeholder="Nombre"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// Con label y error
<Input
  label="Correo electrónico"
  type="email"
  placeholder="tu@correo.com"
  error={error}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Con helper text
<Input
  label="Contraseña"
  type="password"
  placeholder="Mínimo 8 caracteres"
  helperText="Usa mayúsculas, minúsculas y números"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

// Con icono
<Input
  type="search"
  placeholder="Buscar..."
  icon={<SearchIcon />}
/>
```

**Props:**
- `type`: string (default: "text")
- `placeholder`: string
- `label`: string
- `error`: string
- `helperText`: string
- `disabled`: boolean
- `icon`: ReactNode

---

### 3. **FormField** - Campo de Formulario
Wrapper que combina Input + Label + Error message.

```tsx
import { FormField } from "@/app/components/ui";

// Formulario simple
<FormField
  label="Nombre"
  placeholder="Ingrese su nombre"
  required
  error={errors.name}
  value={formData.name}
  onChange={(e) => updateForm("name", e.target.value)}
  description="Nombre completo del usuario"
/>

// Con validación
<FormField
  label="Correo"
  type="email"
  placeholder="correo@ejemplo.com"
  required
  error={errors.email}
  value={formData.email}
  onChange={(e) => updateForm("email", e.target.value)}
  helperText="Usaremos este correo para verificar tu cuenta"
/>
```

**Props:**
- `label`: string (requerido)
- `required`: boolean
- `error`: string
- `helperText`: string
- `description`: string
- ... todas las props de Input

---

### 4. **Card** - Componente de Tarjeta
Contenedor flexible con opciones de bordes, sombras, y efectos hover.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from "@/app/components/ui";

// Card simple
<Card>
  <h3 className="font-bold">Título</h3>
  <p>Contenido</p>
</Card>

// Card con estructura
<Card>
  <CardHeader>
    <h2>Encabezado</h2>
  </CardHeader>
  <CardBody>
    <p>Contenido principal</p>
  </CardBody>
  <CardFooter>
    <Button variant="primary">Aceptar</Button>
  </CardFooter>
</Card>

// Card sin borde ni sombra
<Card noBorder noShadow>
  Contenido sin estilos
</Card>

// Card con efecto hover
<Card hoverable>
  <p>Haz clic en esta tarjeta</p>
</Card>
```

**Props:**
- `noPadding`: boolean
- `noBorder`: boolean
- `noShadow`: boolean
- `hoverable`: boolean

---

### 5. **Modal** - Modal Personalizado
Modal wrapper con overlay, animaciones y control total.

```tsx
import { Modal, ModalFooter } from "@/app/components/ui";
import { Button } from "@/app/components/ui";
import { useState } from "react";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Abrir Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirmar acción"
        description="¿Estás seguro de que deseas continuar?"
        size="md"
        footer={
          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              Confirmar
            </Button>
          </ModalFooter>
        }
      >
        <p>¿Deseas proceder con esta acción?</p>
      </Modal>
    </>
  );
}
```

**Props:**
- `isOpen`: boolean (requerido)
- `onClose`: () => void (requerido)
- `title`: string
- `description`: string
- `children`: ReactNode (requerido)
- `footer`: ReactNode
- `closeButton`: boolean (default: true)
- `size`: "sm" | "md" | "lg" | "xl" (default: "md")
- `isDismissable`: boolean (default: true)

---

### 6. **PageLayout** - Layout de Página
Estructura reutilizable para todas las páginas con breadcrumbs, título, y acciones.

```tsx
import { PageLayout } from "@/app/components/PageLayout";
import { Button } from "@/app/components/ui";
import { Card } from "@/app/components/ui";

function ProductsPage() {
  return (
    <PageLayout
      title="Gestión de Productos"
      subtitle="Administre el catálogo de productos"
      backButton={{
        href: "/dashboard",
        label: "Volver",
      }}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Productos" },
      ]}
      actions={
        <Button variant="primary" onClick={handleCreate}>
          Crear Producto
        </Button>
      }
    >
      <Card>
        {/* Contenido de la página */}
      </Card>
    </PageLayout>
  );
}
```

**Props:**
- `title`: string (requerido)
- `subtitle`: string
- `actions`: ReactNode
- `children`: ReactNode (requerido)
- `backButton`: { href: string; label?: string }
- `breadcrumbs`: Array<{ label: string; href?: string }>

---

## 🎨 Tokens de Diseño

Acceso a tokens de diseño centralizados:

```tsx
import { colors, spacing, typography, shadows, borders } from "@/lib/design-tokens";

// Colores
colors.brand.azul;      // #004A98
colors.brand.naranja;   // #ED7625
colors.brand.verde;     // #44A147
colors.brand.gris;      // #D1D3D4
colors.success;         // #44A147
colors.warning;         // #FFB81C
colors.error;           // #DC2626
colors.info;            // #0EA5E9

// Espaciado
spacing.xs;             // 0.5rem (8px)
spacing.sm;             // 0.75rem (12px)
spacing.md;             // 1rem (16px)
spacing.lg;             // 1.5rem (24px)
spacing.xl;             // 2rem (32px)

// Tipografía
typography.sizes.base.size;        // 1rem
typography.sizes.lg.lineHeight;    // 1.75rem
typography.weights.bold;           // 700

// Sombras
shadows.md;  // "0 4px 6px -1px rgba(0, 0, 0, 0.1)..."

// Bordes
borders.radius.lg;      // 0.5rem
borders.width.sm;       // 1px
```

---

## 🌙 Dark Mode

Todos los componentes soportan dark mode automáticamente. Para habilitarlo, agrega la clase `dark` al elemento `<html>`:

```tsx
// En un componente que controle el tema
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <Button onClick={() => setIsDark(!isDark)}>
      {isDark ? "☀️ Claro" : "🌙 Oscuro"}
    </Button>
  );
}
```

---

## 📱 Responsive Design

Los componentes son totalmente responsivos desde WVGA (800x480):

```tsx
// Usa clases Tailwind estándar
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>

// O crea componentes específicos
<PageLayout title="Responsive Example">
  <div className="flex flex-col gap-4 md:flex-row">
    <div className="flex-1">Columna 1</div>
    <div className="flex-1">Columna 2</div>
  </div>
</PageLayout>
```

**Breakpoints disponibles:**
- `base` (0px) - Móvil
- `sm` (640px) - Tablet pequeña
- `md` (768px) - Tablet
- `lg` (1024px) - Desktop
- `xl` (1280px) - Desktop grande
- `2xl` (1536px) - Ultra wide

---

## 🛠️ Utilidades

Funciones auxiliares en `@/lib/utils`:

```tsx
import { cn, formatDate, formatCurrency, getErrorMessage } from "@/lib/utils";

// Combinar clases CSS
cn("px-4", error && "border-red-500", className);

// Formatear fecha
formatDate(new Date());  // "13 de enero de 2026"

// Formatear moneda
formatCurrency(1500);    // "$1,500.00 MXN"

// Obtener mensaje de error
getErrorMessage(error);  // "Error message"
```

---

## 📋 Ejemplo Completo de Página

```tsx
"use client";

import { useState } from "react";
import { PageLayout } from "@/app/components/PageLayout";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FormField,
  Modal,
  ModalFooter,
} from "@/app/components/ui";

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    // Validar
    if (!formData.name) setErrors({ ...errors, name: "El nombre es requerido" });
    // Guardar
    setIsModalOpen(false);
  };

  return (
    <PageLayout
      title="Gestión de Productos"
      subtitle="Administre el catálogo"
      actions={
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Crear Producto
        </Button>
      }
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Productos" },
      ]}
    >
      {/* Contenido */}
      <Card>
        <CardHeader>
          <h3 className="font-bold">Productos Disponibles</h3>
        </CardHeader>
        <CardBody>
          <p className="text-gray-600 dark:text-gray-400">
            Lista de productos del sistema
          </p>
        </CardBody>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Producto"
        footer={
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Guardar
            </Button>
          </ModalFooter>
        }
      >
        <FormField
          label="Nombre del Producto"
          placeholder="Ingrese el nombre"
          required
          error={errors.name}
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
        />
        <FormField
          label="Descripción"
          placeholder="Descripción del producto"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
        <FormField
          label="Precio"
          type="number"
          placeholder="0.00"
          value={formData.price}
          onChange={(e) =>
            setFormData({ ...formData, price: e.target.value })
          }
        />
      </Modal>
    </PageLayout>
  );
}
```

---

## ✅ Checklist de Implementación

- [x] Design tokens creados (lib/design-tokens.ts)
- [x] Componentes UI implementados (Button, Input, Card, FormField, Modal)
- [x] PageLayout para estructura de páginas
- [x] Dark mode soportado en todos los componentes
- [x] Responsive desde 800x480 (WVGA)
- [x] Tailwind config personalizado
- [x] Utilidades centralizadas (utils.ts)
- [ ] Aplicar componentes a páginas de dashboard
- [ ] Aplicar componentes a user-dashboard
- [ ] Aplicar componentes a login

---

## 🚀 Próximos Pasos

1. **Actualizar páginas del dashboard** para usar los nuevos componentes
2. **Reemplazar Flowbite directo** por componentes wrapper en formularios
3. **Aplicar PageLayout** a todas las páginas
4. **Completar dark mode** en todas las páginas
5. **Validar responsive design** en dispositivos reales
