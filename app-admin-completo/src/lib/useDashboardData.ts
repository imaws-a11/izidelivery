import { useMemo } from 'react';
import type { Order, Driver, Merchant } from './types';

export function useDashboardData(
  allOrders: Order[],
  driversList: Driver[],
  merchantsList: Merchant[],
  appSettings: { appCommission: number },
  categoriesState: any[],
) {
  const dashboardData = useMemo(() => {
    if (!allOrders || allOrders.length === 0) return {
      dailyRevenue: [0, 0, 0, 0, 0, 0, 0],
      dayLabels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
      categories: [] as any[],
      topMerchants: [] as any[],
      avgTicket: 0,
      totalCommission: 0,
      deliverySuccessRate: 0,
      revenuePath: "M0,120 L400,120"
    };

    // 1. Daily Revenue (Last 7 Days)
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      return {
        dateStr: d.toISOString().split('T')[0],
        dayLabel: days[d.getDay()]
      };
    });

    const revenueByDay = last7Days.map(day => {
      const dayTotal = allOrders
        .filter(o => o.created_at.startsWith(day.dateStr) && o.status === 'concluido')
        .reduce((sum, o) => sum + (o.total_price || 0), 0);
      return dayTotal;
    });

    // Generate SVG path for revenue
    const maxRev = Math.max(...revenueByDay, 1);
    const points = revenueByDay.map((rev, i) => {
      const x = (i / 6) * 400;
      const y = 140 - (rev / maxRev) * 120; // 140 is bottom, 20 is top margin
      return `${x},${y}`;
    });
    const revenuePath = `M${points.join(' L')}`;

    // 2. Categories breakdown
    const categoryStats = allOrders.reduce((acc: Record<string, { count: number; revenue: number }>, o) => {
      const type = o.service_type || 'delivery';
      if (!acc[type]) acc[type] = { count: 0, revenue: 0 };
      acc[type].count++;
      if (o.status === 'concluido') {
        acc[type].revenue += (o.total_amount || o.total_price || 0);
      }
      return acc;
    }, {});
    
// Mapeamento dinâmico baseado nas categorias reais e service_type
    const categoriesBreakdown = Object.entries(categoryStats).map(([type, stats]: [string, any]) => {
      // Tenta encontrar o nome amigável na lista de categorias do estado
      const categoryInfo = categoriesState.find(c => c.id === type || c.name.toLowerCase() === type.toLowerCase());
      return {
        label: categoryInfo?.name || type.charAt(0).toUpperCase() + type.slice(1),
        val: stats.count,
        revenue: stats.revenue,
        percent: (Number(stats.count) / (allOrders.length || 1)) * 100
      };
    }).sort((a, b) => b.val - a.val);

    const totalOrdersToday = allOrders.filter(o => {
      const orderDate = new Date(o.created_at).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      return orderDate === todayStr;
    }).length;

    // 3. Top Merchants
    const merchantPerformance = allOrders.reduce((acc: Record<string, { id: string; name: string; orders: number; revenue: number }>, o) => {
      if (o.merchant_id) {
        if (!acc[o.merchant_id]) acc[o.merchant_id] = { id: o.merchant_id, name: o.merchant_name || 'Lojista', orders: 0, revenue: 0 };
        acc[o.merchant_id].orders++;
        if (o.status === 'concluido') acc[o.merchant_id].revenue += (o.total_price || 0);
      }
      return acc;
    }, {});

    const topMerchants: { id: string; name: string; orders: number; revenue: number }[] = Object.values(merchantPerformance)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    // 4. Global KPIs
    const completedOrders = allOrders.filter(o => o.status === 'concluido');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const avgTicket = totalRevenue / (completedOrders.length || 1);
    const totalCommission = totalRevenue * (appSettings.appCommission / 100);
    const deliverySuccessRate = (completedOrders.length / (allOrders.filter(o => o.status !== 'cancelado').length || 1)) * 100;

    // 5. 30-Day Revenue Trend (for Financial Tab)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    const revenue30Days = last30Days.map(dateStr => {
      return allOrders
        .filter(o => o.created_at.startsWith(dateStr) && o.status === 'concluido')
        .reduce((sum, o) => sum + (o.total_price || 0), 0);
    });

    const totalOrders = allOrders.length;
    const canceledOrders = allOrders.filter(o => o.status === 'cancelado').length;
    const netProfit = totalCommission; // Simplification: platform profit is commission

    return {
      dailyRevenue: revenueByDay,
      dayLabels: last7Days.map(d => d.dayLabel),
      categories: categoriesBreakdown,
      topMerchants,
      avgTicket,
      totalCommission,
      deliverySuccessRate,
      revenuePath,
      revenue30Days,
      totalRevenue,
      totalOrders,
      canceledOrders,
      netProfit,
      completedOrdersCount: completedOrders.length,
      totalOrdersToday
    };
  }, [allOrders, appSettings.appCommission, categoriesState]);

  return dashboardData;
}
