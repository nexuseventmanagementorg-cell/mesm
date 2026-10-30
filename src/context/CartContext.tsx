"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem } from "@/types";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  freeDeliveryThreshold: number;
  remainingForFreeDelivery: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, variation: string | undefined, qty: number) => void;
  removeItem: (productId: string, variation?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "meems_gems_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const flatDeliveryFee = 250;
  const freeDeliveryThreshold = 3000;

  // Load cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse cart storage", e);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error("Failed to save cart storage", e);
      }
    }
  }, [items, isLoaded]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === item.productId && i.selectedVariation === item.selectedVariation
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const currentQty = next[existingIndex].quantity;
        const max = item.trackInventory ? item.maxStock : 999;
        const newQty = Math.min(currentQty + quantity, max);
        next[existingIndex] = { ...next[existingIndex], quantity: newQty };
        return next;
      } else {
        const initialQty = Math.min(quantity, item.trackInventory ? item.maxStock : 999);
        return [...prev, { ...item, quantity: Math.max(1, initialQty) }];
      }
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, variation: string | undefined, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) {
        return prev.filter(
          (i) => !(i.productId === productId && i.selectedVariation === variation)
        );
      }
      return prev.map((item) => {
        if (item.productId === productId && item.selectedVariation === variation) {
          const max = item.trackInventory ? item.maxStock : 999;
          return { ...item, quantity: Math.min(qty, max) };
        }
        return item;
      });
    });
  };

  const removeItem = (productId: string, variation?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.selectedVariation === variation))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = subtotal === 0 || subtotal >= freeDeliveryThreshold ? 0 : flatDeliveryFee;
  const total = subtotal + deliveryFee;
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        deliveryFee,
        total,
        freeDeliveryThreshold,
        remainingForFreeDelivery,
        isCartOpen,
        setIsCartOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
