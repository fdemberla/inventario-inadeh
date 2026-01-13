import React from "react";

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
    <div className="min-h-full space-y-6 py-2">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="text-gray-400 dark:text-gray-600">/</span>
              )}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-700 dark:text-gray-300">
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
            <a
              href={backButton.href}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
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
            </a>
          )}

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            {title}
          </h1>

          {/* Subtítulo */}
          {subtitle && (
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
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
  );
};

PageLayout.displayName = "PageLayout";

export { PageLayout };
