import React, { useState, useEffect } from 'react';
import { Plus, Minus, Download, Trash2 } from 'lucide-react';
import { OfflineService } from '../services/offline';
import { DatabaseService } from '../services/database';
import { PDFService } from '../services/pdf';
import { useAuth } from '../contexts/AuthContext';
import { Product, Order, OrderItem, Client, StockDiscountReason } from '../types';

export function OrderForm() {
  const { currentRep } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discountReasons, setDiscountReasons] = useState<StockDiscountReason[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isFreeStock, setIsFreeStock] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [selectedDiscountReason, setSelectedDiscountReason] = useState('');
  const [freeStockReason, setFreeStockReason] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      let clientList, productList, reasonsList;
      try {
        [clientList, productList, reasonsList] = await Promise.all([
          DatabaseService.getClients(),
          DatabaseService.getProducts(),
          DatabaseService.getDiscountReasons()
        ]);
        await OfflineService.saveClients(clientList);
        await OfflineService.saveProducts(productList);
      } catch (error) {
        [clientList, productList] = await Promise.all([
          OfflineService.getClients(),
          OfflineService.getProducts()
        ]);
        reasonsList = [];
      }
      setClients(clientList);
      setProducts(productList);
      setDiscountReasons(reasonsList || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (client.location && client.location.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const addProduct = (product: Product) => {
    const existingItem = orderItems.find(item => item.product_id === product.id);
    if (existingItem) {
      updateQuantity(existingItem.product_id, existingItem.quantity + 1);
    } else {
      const newItem: OrderItem = {
        id: Math.random().toString(36).substring(2),
        order_id: '',
        product_id: product.id,
        quantity: 1,
        unit_price: product.price,
        sync_status: 'pending',
        created_at: new Date().toISOString(),
        product
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setOrderItems(items => items.map(item =>
      item.product_id === productId ? { ...item, quantity } : item
    ));
  };

  const removeItem = (id: string) => {
    setOrderItems(items => items.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateDiscount = () => {
    if (isFreeStock) return calculateSubtotal();
    return calculateSubtotal() * (discountPercentage / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const submitOrder = async () => {
    if (!selectedClientId || orderItems.length === 0) return alert('Please select client and add products.');
    if (!currentRep?.id) {
      alert("Rep not authenticated. Please log in again.");
      return;
    }
    if (isFreeStock && !freeStockReason) return alert('Provide reason for free stock.');
    if (discountPercentage > 0 && !selectedDiscountReason) return alert('Select discount reason.');

    const orderId = Math.random().toString(36).substring(2);
    const repId = currentRep.id;

    const order: Order = {
      id: orderId,
      rep_id: repId,
      client_id: selectedClientId,
      order_date: new Date().toISOString(),
      is_free_stock: isFreeStock,
      discount_percent: isFreeStock ? 100 : discountPercentage,
      discount_value: calculateDiscount(),
      discount_reason: selectedDiscountReason || undefined,
      free_stock_reason: isFreeStock ? freeStockReason : undefined,
      notes: orderNotes.trim() || undefined,
      sync_status: 'pending',
      created_at: new Date().toISOString()
    };

    const orderItemsToSave = orderItems.map(item => ({ ...item, order_id: orderId }));

    try {
      await OfflineService.saveOrder(order, orderItemsToSave);
      const pdf = await PDFService.generateOrderPDF(order, orderItems, selectedClient);
      PDFService.downloadPDF(pdf, `order-${orderId}.pdf`);
      setSelectedClientId('');
      setOrderItems([]);
      setIsFreeStock(false);
      setDiscountPercentage(0);
      setSelectedDiscountReason('');
      setFreeStockReason('');
      setOrderNotes('');
      alert('Order saved!');
    } catch (err) {
      console.error(err);
      alert('Order failed to save.');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* ... UI elements unchanged except currency display ... */}
    </div>
  );
}
