import React from "react";
import Link from "next/link";
import { stripBasePath } from "@/lib/utils";

export interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  backButton?: {
    href: string;
    label?: string;
  };
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

/**
 * Componente PageLayout para estructura consistente de páginas
 *
 * @example
 * <PageLayout
 *   title="Gestión de Usuarios"
 *   subtitle="Administre los usuarios del sistema"
 *   actions={<Button variant="primary">Crear usuario</Button>}
 * >
 *   <Card>Contenido de la página</Card>
 * </PageLayout>
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  actions,
  children,
  backButton,
  breadcrumbs,
}) => {
  return (
    <div className="relative min-h-full space-y-6 py-2">
      {/* Animated Mesh Gradient Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[50%] w-[50%] rounded-full bg-brand-azul/15 dark:bg-brand-azul/10 blur-[120px] animate-pulse duration-[8000ms]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-brand-verde/15 dark:bg-brand-verde/10 blur-[120px] animate-pulse duration-[10000ms] delay-700" />
        <div className="absolute -bottom-[10%] left-[20%] h-[60%] w-[60%] rounded-full bg-brand-naranja/10 dark:bg-brand-naranja/5 blur-[120px] animate-pulse duration-[12000ms] delay-1000" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="text-fg-muted">/</span>
              )}
              {crumb.href ? (
                <Link
                  href={stripBasePath(crumb.href)}
                  className="text-accent focus-visible:outline-focus rounded font-medium underline-offset-4 hover:underline focus-visible:outline-2"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-fg">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Header con título y acciones */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          {/* Botón de atrás */}
          {backButton && (
            <Link
              href={stripBasePath(backButton.href)}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-fg"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {backButton.label || "Atrás"}
            </Link>
          )}

          {/* Título */}
          <h1 className="text-3xl font-bold text-fg md:text-4xl">
            {title}
          </h1>

          {/* Subtítulo */}
          {subtitle && (
            <p className="mt-2 text-lg text-fg-muted">
              {subtitle}
            </p>
          )}
        </div>

        {/* Acciones */}
        {actions && (
          <div className="flex flex-wrap gap-3 sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
};

PageLayout.displayName = "PageLayout";

export { PageLayout };
