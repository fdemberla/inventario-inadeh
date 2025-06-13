'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as Chart from 'chart.js';

interface WarehouseInfo {
  WarehouseID: number;
  WarehouseCode: string;
  WarehouseName: string;
  Name: string;
  ShortName: string;
}

interface ProductCategoryData {
  category: string;
  totalProducts: number;
  totalValue: number;
  avgPrice: number;
}

interface ProductTrendData {
  month: string;
  productsAdded: number;
  productsRemoved: number;
  totalValue: number;
}

interface TopProductsData {
  productName: string;
  category: string;
  quantity: number;
  value: number;
}

export default function WarehouseReportsPage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.warehouseId as string;
  
  const [warehouseInfo, setWarehouseInfo] = useState<WarehouseInfo | null>(null);
  const [categoryData, setCategoryData] = useState<ProductCategoryData[]>([]);
  const [trendData, setTrendData] = useState<ProductTrendData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState('30'); // days

  // Chart references
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartInstance = useRef<Chart.Chart | null>(null);
  const barChartInstance = useRef<Chart.Chart | null>(null);
  const lineChartInstance = useRef<Chart.Chart | null>(null);

  useEffect(() => {
    if (warehouseId) {
      fetchWarehouseData();
    }
  }, [warehouseId, selectedDateRange]);

  useEffect(() => {
    if (!loading && categoryData.length > 0) {
      createCharts();
    }
    
    // Cleanup function
    return () => {
      destroyCharts();
    };
  }, [categoryData, trendData, loading]);

  const destroyCharts = () => {
    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
      pieChartInstance.current = null;
    }
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
      barChartInstance.current = null;
    }
    if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
      lineChartInstance.current = null;
    }
  };

  const createCharts = () => {
    destroyCharts();

    // Pie Chart - Products by Category
    if (pieChartRef.current) {
      const ctx = pieChartRef.current.getContext('2d');
      if (ctx) {
        pieChartInstance.current = new Chart.Chart(ctx, {
          type: 'pie',
          data: {
            labels: categoryData.map(item => item.category),
            datasets: [{
              data: categoryData.map(item => item.totalProducts),
              backgroundColor: [
                '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
                '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
              ],
              borderColor: [
                '#2563EB', '#DC2626', '#059669', '#D97706',
                '#7C3AED', '#DB2777', '#0891B2', '#65A30D'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  usePointStyle: true,
                  padding: 20
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed;
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    }

    // Bar Chart - Value by Category
    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext('2d');
      if (ctx) {
        barChartInstance.current = new Chart.Chart(ctx, {
          type: 'bar',
          data: {
            labels: categoryData.map(item => item.category),
            datasets: [{
              label: 'Valor Total ($)',
              data: categoryData.map(item => item.totalValue),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 2,
              borderRadius: 4,
              borderSkipped: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '

  const fetchWarehouseData = async () => {
    try {
      setLoading(true);
      
      // For now, using mock data - replace with your actual API calls
      // You'll need to create these endpoints:
      // - /api/warehouse/[id]/info
      // - /api/warehouse/[id]/categories
      // - /api/warehouse/[id]/trends
      // - /api/warehouse/[id]/top-products
      
      // Mock data - replace with actual API calls
      setTimeout(() => {
        setWarehouseInfo({
          WarehouseID: parseInt(warehouseId),
          WarehouseCode: 'WH001',
          WarehouseName: 'Centro de Distribución Principal',
          Name: 'Ciudad de Panamá',
          ShortName: 'PTY'
        });

        setCategoryData([
          { category: 'Electrónicos', totalProducts: 450, totalValue: 125000, avgPrice: 277.78 },
          { category: 'Ropa y Accesorios', totalProducts: 850, totalValue: 85000, avgPrice: 100 },
          { category: 'Hogar y Jardín', totalProducts: 320, totalValue: 65000, avgPrice: 203.13 },
          { category: 'Deportes', totalProducts: 280, totalValue: 42000, avgPrice: 150 },
          { category: 'Libros y Medios', totalProducts: 600, totalValue: 18000, avgPrice: 30 },
          { category: 'Salud y Belleza', totalProducts: 380, totalValue: 38000, avgPrice: 100 },
          { category: 'Automotriz', totalProducts: 150, totalValue: 75000, avgPrice: 500 }
        ]);

        setTrendData([
          { month: 'Ene', productsAdded: 120, productsRemoved: 45, totalValue: 125000 },
          { month: 'Feb', productsAdded: 95, productsRemoved: 38, totalValue: 132000 },
          { month: 'Mar', productsAdded: 150, productsRemoved: 52, totalValue: 145000 },
          { month: 'Abr', productsAdded: 180, productsRemoved: 65, totalValue: 158000 },
          { month: 'May', productsAdded: 200, productsRemoved: 70, totalValue: 175000 },
          { month: 'Jun', productsAdded: 165, productsRemoved: 55, totalValue: 168000 }
        ]);

        setTopProducts([
          { productName: 'iPhone 15 Pro', category: 'Electrónicos', quantity: 25, value: 25000 },
          { productName: 'MacBook Air M2', category: 'Electrónicos', quantity: 15, value: 18000 },
          { productName: 'Nike Air Max', category: 'Deportes', quantity: 45, value: 4500 },
          { productName: 'Samsung 55" TV', category: 'Electrónicos', quantity: 12, value: 8400 },
          { productName: 'Sofá Seccional', category: 'Hogar y Jardín', quantity: 8, value: 6400 }
        ]);

        setLoading(false);
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      setLoading(false);
    }
  };

  // Chart configurations
  // (Removed - now handled in createCharts function)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4 w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border h-96"></div>
              <div className="bg-white p-6 rounded-lg shadow-sm border h-96"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchWarehouseData}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/reports')}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              ← Volver a Almacenes
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Reportes - {warehouseInfo?.WarehouseName}
            </h1>
            <p className="text-lg text-gray-600">
              {warehouseInfo?.WarehouseCode} • {warehouseInfo?.Name} ({warehouseInfo?.ShortName})
            </p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Período:</label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 3 meses</option>
              <option value="365">Último año</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {categoryData.reduce((sum, item) => sum + item.totalProducts, 0).toLocaleString()}
            </div>
            <div className="text-gray-600">Total Productos</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600 mb-1">
              ${categoryData.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}
            </div>
            <div className="text-gray-600">Valor Total Inventario</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {categoryData.length}
            </div>
            <div className="text-gray-600">Categorías Activas</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              ${Math.round(categoryData.reduce((sum, item) => sum + item.totalValue, 0) / categoryData.reduce((sum, item) => sum + item.totalProducts, 0)).toLocaleString()}
            </div>
            <div className="text-gray-600">Precio Promedio</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Products by Category - Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Distribución de Productos por Categoría</h3>
            <div className="h-80 relative">
              <canvas ref={pieChartRef}></canvas>
            </div>
          </div>

          {/* Value by Category - Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Valor por Categoría</h3>
            <div className="h-80 relative">
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Trend Chart - Full Width */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-xl font-semibold mb-4">Tendencia de Productos - Últimos 6 Meses</h3>
          <div className="h-80 relative">
            <canvas ref={lineChartRef}></canvas>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold">Top 5 Productos por Valor</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${product.value.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} + value.toLocaleString();
                  }
                },
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    }

    // Line Chart - Product Trends
    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext('2d');
      if (ctx) {
        lineChartInstance.current = new Chart.Chart(ctx, {
          type: 'line',
          data: {
            labels: trendData.map(item => item.month),
            datasets: [
              {
                label: 'Productos Agregados',
                data: trendData.map(item => item.productsAdded),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(16, 185, 129)',
                pointBorderColor: 'rgb(16, 185, 129)',
                pointRadius: 5,
                pointHoverRadius: 7
              },
              {
                label: 'Productos Removidos',
                data: trendData.map(item => item.productsRemoved),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(239, 68, 68)',
                pointBorderColor: 'rgb(239, 68, 68)',
                pointRadius: 5,
                pointHoverRadius: 7
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  usePointStyle: true,
                  padding: 20
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    }
  };

  const fetchWarehouseData = async () => {
    try {
      setLoading(true);
      
      // For now, using mock data - replace with your actual API calls
      // You'll need to create these endpoints:
      // - /api/warehouse/[id]/info
      // - /api/warehouse/[id]/categories
      // - /api/warehouse/[id]/trends
      // - /api/warehouse/[id]/top-products
      
      // Mock data - replace with actual API calls
      setTimeout(() => {
        setWarehouseInfo({
          WarehouseID: parseInt(warehouseId),
          WarehouseCode: 'WH001',
          WarehouseName: 'Centro de Distribución Principal',
          Name: 'Ciudad de Panamá',
          ShortName: 'PTY'
        });

        setCategoryData([
          { category: 'Electrónicos', totalProducts: 450, totalValue: 125000, avgPrice: 277.78 },
          { category: 'Ropa y Accesorios', totalProducts: 850, totalValue: 85000, avgPrice: 100 },
          { category: 'Hogar y Jardín', totalProducts: 320, totalValue: 65000, avgPrice: 203.13 },
          { category: 'Deportes', totalProducts: 280, totalValue: 42000, avgPrice: 150 },
          { category: 'Libros y Medios', totalProducts: 600, totalValue: 18000, avgPrice: 30 },
          { category: 'Salud y Belleza', totalProducts: 380, totalValue: 38000, avgPrice: 100 },
          { category: 'Automotriz', totalProducts: 150, totalValue: 75000, avgPrice: 500 }
        ]);

        setTrendData([
          { month: 'Ene', productsAdded: 120, productsRemoved: 45, totalValue: 125000 },
          { month: 'Feb', productsAdded: 95, productsRemoved: 38, totalValue: 132000 },
          { month: 'Mar', productsAdded: 150, productsRemoved: 52, totalValue: 145000 },
          { month: 'Abr', productsAdded: 180, productsRemoved: 65, totalValue: 158000 },
          { month: 'May', productsAdded: 200, productsRemoved: 70, totalValue: 175000 },
          { month: 'Jun', productsAdded: 165, productsRemoved: 55, totalValue: 168000 }
        ]);

        setTopProducts([
          { productName: 'iPhone 15 Pro', category: 'Electrónicos', quantity: 25, value: 25000 },
          { productName: 'MacBook Air M2', category: 'Electrónicos', quantity: 15, value: 18000 },
          { productName: 'Nike Air Max', category: 'Deportes', quantity: 45, value: 4500 },
          { productName: 'Samsung 55" TV', category: 'Electrónicos', quantity: 12, value: 8400 },
          { productName: 'Sofá Seccional', category: 'Hogar y Jardín', quantity: 8, value: 6400 }
        ]);

        setLoading(false);
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      setLoading(false);
    }
  };

  // Chart configurations
  const categoryChartData = {
    labels: categoryData.map(item => item.category),
    datasets: [
      {
        label: 'Total de Productos',
        data: categoryData.map(item => item.totalProducts),
        backgroundColor: [
          '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
          '#8B5CF6', '#EC4899', '#06B6D4'
        ],
        borderColor: [
          '#2563EB', '#DC2626', '#059669', '#D97706',
          '#7C3AED', '#DB2777', '#0891B2'
        ],
        borderWidth: 2
      }
    ]
  };

  const valueChartData = {
    labels: categoryData.map(item => item.category),
    datasets: [
      {
        label: 'Valor Total ($)',
        data: categoryData.map(item => item.totalValue),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      }
    ]
  };

  const trendChartData = {
    labels: trendData.map(item => item.month),
    datasets: [
      {
        label: 'Productos Agregados',
        data: trendData.map(item => item.productsAdded),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Productos Removidos',
        data: trendData.map(item => item.productsRemoved),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4 w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border h-96"></div>
              <div className="bg-white p-6 rounded-lg shadow-sm border h-96"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchWarehouseData}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/reports')}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              ← Volver a Almacenes
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Reportes - {warehouseInfo?.WarehouseName}
            </h1>
            <p className="text-lg text-gray-600">
              {warehouseInfo?.WarehouseCode} • {warehouseInfo?.Name} ({warehouseInfo?.ShortName})
            </p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Período:</label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 3 meses</option>
              <option value="365">Último año</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {categoryData.reduce((sum, item) => sum + item.totalProducts, 0).toLocaleString()}
            </div>
            <div className="text-gray-600">Total Productos</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600 mb-1">
              ${categoryData.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}
            </div>
            <div className="text-gray-600">Valor Total Inventario</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {categoryData.length}
            </div>
            <div className="text-gray-600">Categorías Activas</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              ${Math.round(categoryData.reduce((sum, item) => sum + item.totalValue, 0) / categoryData.reduce((sum, item) => sum + item.totalProducts, 0)).toLocaleString()}
            </div>
            <div className="text-gray-600">Precio Promedio</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Products by Category - Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Distribución de Productos por Categoría</h3>
            <div className="h-80">
              <Pie data={categoryChartData} options={pieOptions} />
            </div>
          </div>

          {/* Value by Category - Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Valor por Categoría</h3>
            <div className="h-80">
              <Bar data={valueChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Trend Chart - Full Width */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-xl font-semibold mb-4">Tendencia de Productos - Últimos 6 Meses</h3>
          <div className="h-80">
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold">Top 5 Productos por Valor</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${product.value.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}