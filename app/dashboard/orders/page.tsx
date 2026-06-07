"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { fetchOrders, updateOrderRequest, deleteOrderRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types";
import {
  CheckCircle,
  Circle,
  CreditCard,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  XCircle,
} from "lucide-react";

interface CategorySummary {
  category: string;
  totalQuantity: number;
  orderCount: number;
  orders: Order[];
}

function groupByCategory(orders: Order[]): CategorySummary[] {
  const map = new Map<string, { totalQuantity: number; orderCount: number; orders: Order[] }>();
  for (const order of orders) {
    const existing = map.get(order.category);
    if (existing) {
      existing.totalQuantity += order.quantity;
      existing.orderCount += 1;
      existing.orders.push(order);
    } else {
      map.set(order.category, { totalQuantity: order.quantity, orderCount: 1, orders: [order] });
    }
  }
  return Array.from(map.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);
}

export default function OrdersPage() {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const activeOrders = useMemo(() => orders.filter((o) => o.status === "active"), [orders]);
  const doneOrders = useMemo(() => orders.filter((o) => o.status === "done"), [orders]);
  const doneUnpaid = useMemo(() => doneOrders.filter((o) => !o.paid), [doneOrders]);
  const donePaid = useMemo(() => doneOrders.filter((o) => o.paid), [doneOrders]);

  const activeSummary = useMemo(() => groupByCategory(activeOrders), [activeOrders]);
  const doneUnpaidSummary = useMemo(() => groupByCategory(doneUnpaid), [doneUnpaid]);
  const donePaidSummary = useMemo(() => groupByCategory(donePaid), [donePaid]);

  const isAdmin = userProfile?.role === "admin" || userProfile?.role === "leader";

  const handleMarkDone = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await updateOrderRequest(orderId, { status: "done" });
      await loadOrders();
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await updateOrderRequest(orderId, { paid: true });
      await loadOrders();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await deleteOrderRequest(orderId);
      await loadOrders();
    } finally {
      setActionLoading(null);
    }
  };

  const totalActiveQty = activeOrders.reduce((sum, o) => sum + o.quantity, 0);
  const totalDoneUnpaidQty = doneUnpaid.reduce((sum, o) => sum + o.quantity, 0);
  const totalDonePaidQty = donePaid.reduce((sum, o) => sum + o.quantity, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
            <ShoppingBag className="h-8 w-8 text-primary" />
            Nobatia Orders
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track orders by category — active, done & payment status
          </p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/orders/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </Link>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "..." : orders.length}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-300 dark:border-blue-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Qty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">{loading ? "..." : totalActiveQty}</p>
          </CardContent>
        </Card>
        <Card className="border-red-300 dark:border-red-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Done (Unpaid)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{loading ? "..." : totalDoneUnpaidQty}</p>
          </CardContent>
        </Card>
        <Card className="border-green-300 dark:border-green-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Done (Paid)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{loading ? "..." : totalDonePaidQty}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading orders...</div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">No orders yet</p>
            {isAdmin && (
              <Link href="/dashboard/orders/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Add First Order
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ACTIVE ORDERS */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Circle className="h-5 w-5" />
                Active Orders
              </CardTitle>
              <CardDescription>
                {activeOrders.length} order{activeOrders.length !== 1 ? "s" : ""} — {totalActiveQty} total items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeSummary.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No active orders</p>
              ) : (
                <div className="space-y-3">
                  {activeSummary.map((cat) => (
                    <div key={cat.category} className="rounded-lg border bg-blue-50/50 p-4 dark:bg-blue-950/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold">{cat.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {cat.orderCount} order{cat.orderCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-lg px-3 py-1">
                          {cat.totalQuantity}
                        </Badge>
                      </div>
                      {/* Individual orders in this category */}
                      {isAdmin && (
                        <div className="mt-3 space-y-2">
                          {cat.orders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between rounded border bg-background/60 px-3 py-2 text-sm">
                              <span>
                                {order.quantity}x — {order.note || "No note"}{" "}
                                <span className="text-muted-foreground">
                                  by {order.createdBy}
                                </span>
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  disabled={actionLoading === order.id}
                                  onClick={() => handleMarkDone(order.id)}
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" /> Done
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-red-500 hover:text-red-700"
                                  disabled={actionLoading === order.id}
                                  onClick={() => handleDelete(order.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* DONE ORDERS - UNPAID */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
                Done — Not Paid
              </CardTitle>
              <CardDescription>
                {doneUnpaid.length} order{doneUnpaid.length !== 1 ? "s" : ""} — {totalDoneUnpaidQty} total items unpaid
              </CardDescription>
            </CardHeader>
            <CardContent>
              {doneUnpaidSummary.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">All done orders are paid</p>
              ) : (
                <div className="space-y-3">
                  {doneUnpaidSummary.map((cat) => (
                    <div key={cat.category} className="rounded-lg border bg-red-50/50 p-4 dark:bg-red-950/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold">{cat.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {cat.orderCount} order{cat.orderCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-lg px-3 py-1">
                          {cat.totalQuantity}
                        </Badge>
                      </div>
                      {isAdmin && (
                        <div className="mt-3 space-y-2">
                          {cat.orders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between rounded border bg-background/60 px-3 py-2 text-sm">
                              <span>
                                {order.quantity}x — {order.note || "No note"}{" "}
                                <span className="text-muted-foreground">
                                  by {order.createdBy}
                                </span>
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  disabled={actionLoading === order.id}
                                  onClick={() => handleMarkPaid(order.id)}
                                >
                                  <CreditCard className="mr-1 h-3 w-3" /> Mark Paid
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-red-500 hover:text-red-700"
                                  disabled={actionLoading === order.id}
                                  onClick={() => handleDelete(order.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* DONE ORDERS - PAID */}
          {donePaidSummary.length > 0 && (
            <Card className="border-green-200 dark:border-green-800 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  Done — Paid
                </CardTitle>
                <CardDescription>
                  {donePaid.length} order{donePaid.length !== 1 ? "s" : ""} — {totalDonePaidQty} total items paid
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {donePaidSummary.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between rounded-lg border bg-green-50/50 p-4 dark:bg-green-950/20">
                      <div>
                        <p className="font-semibold">{cat.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {cat.orderCount} order{cat.orderCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-lg px-3 py-1">
                        {cat.totalQuantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
