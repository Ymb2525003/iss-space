"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { createOrderRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShoppingBag } from "lucide-react";

const SUGGESTED_CATEGORIES = [
  "Pure Rice with Milk",
  "Rice with Zabeeb",
  "Chocolate",
  "Kisra with Milk",
  "Asida",
  "Foul",
  "Tamiya",
];

export default function NewOrderPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    quantity: "",
    note: "",
  });

  const isAdmin = userProfile?.role === "admin" || userProfile?.role === "leader";

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Only admins and leaders can create orders.
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.category || !formData.quantity) {
      toast.error("Fill category name and quantity.");
      return;
    }

    const qty = Number(formData.quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      toast.error("Quantity must be at least 1.");
      return;
    }

    setIsLoading(true);
    try {
      await createOrderRequest({
        category: formData.category.trim(),
        quantity: qty,
        note: formData.note.trim() || undefined,
      });
      toast.success("Order created successfully.");
      router.push("/dashboard/orders");
    } catch (error) {
      console.error(error);
      toast.error("Could not create order.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Order</h1>
          <p className="text-muted-foreground">Add a new Nobatia order with category and quantity.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Order Details
          </CardTitle>
          <CardDescription>Pick or type the food category and enter how many.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category / Food Name</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}
                placeholder="e.g. Pure Rice with Milk"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTED_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`h-7 text-xs ${formData.category === cat ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => setFormData((current) => ({ ...current, category: cat }))}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(event) => setFormData((current) => ({ ...current, quantity: event.target.value }))}
                placeholder="e.g. 30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(event) => setFormData((current) => ({ ...current, note: event.target.value }))}
                placeholder="Any extra details about this order..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
                Create Order
              </Button>
              <Link href="/dashboard/orders">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
