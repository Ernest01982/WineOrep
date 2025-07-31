import React, { useState, useEffect } from 'react';
import { Plus, Minus, Download, Trash2 } from 'lucide-react';
import { OfflineService } from '../services/offline';
import { DatabaseService } from '../services/database';
import { PDFService } from '../services/pdf';
import { Product, Order, OrderItem, Client, StockDiscountReason } from '../types';

interface OrderLineItem extends OrderItem {
  product: Product;
}

export function OrderForm() {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discountReasons, setDiscountReasons] = useState<StockDiscountReason[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [orderItems, setOrderItems] = useState<OrderLineItem[]>([]);
  const [isFreeStock, setIsFreeStock] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [selectedDiscountReason, setSelectedDiscountReason] = useState('');
  const [freeStockReason, setFreeStockReason] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentRep, setCurrentRep] = useState<any>(null);

  useEffect(() => {
    loadCurrentRep();
    loadData();
  }, []);

  const loadCurrentRep = async () => {
    try {
      const rep = await DatabaseService.getCurrentRep();
      setCurrentRep(rep);
    } catch (error) {
      console.error('Failed to load current rep:', error);
    }
  };

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
        console.log('Loading from offline storage...');
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

  const addProduct = (product: Product) => {
    const existingItem = orderItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: OrderLineItem = {
        id: crypto.randomUUID(),
        order_id: '',
        product_id: product.id,
        quantity: 1,
        price: product.price,
        sync_status: 'pending',
        created_at: new Date().toISOString(),
        product
      };
      
      setOrderItems([...orderItems, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setOrderItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setOrderItems(items => items.filter(item => item.id !== itemId));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateDiscount = () => {
    if (isFreeStock) return calculateSubtotal();
    return calculateSubtotal() * (discountPercentage / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const submitOrder = async () => {
    if (!selectedClientId || orderItems.length === 0) {
      alert('Please select a client and add at least one product.');
      return;
    }

    if (isFreeStock && !freeStockReason.trim()) {
      alert('Please provide a reason for free stock.');
      return;
    }

    if (discountPercentage > 0 && !selectedDiscountReason) {
      alert('Please select a discount reason.');
      return;
    }

    const orderId = crypto.randomUUID();
    const repId = currentRep?.id || 'demo-rep-id';

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

    const orderItemsToSave = orderItems.map(item => ({
      ...item,
      order_id: orderId
    }));

    try {
      await OfflineService.saveOrder(order, orderItemsToSave);

      // Generate PDF
      const selectedClient = clients.find(c => c.id === selectedClientId)!;
      const pdfBlob = await PDFService.generateOrderPDF(order, orderItems, selectedClient);
      PDFService.downloadPDF(pdfBlob, `order-${orderId}.pdf`);

      // Reset form
      setSelectedClientId('');
      setOrderItems([]);
      setIsFreeStock(false);
      setDiscountPercentage(0);
      setSelectedDiscountReason('');
      setFreeStockReason('');
      setOrderNotes('');
      
      alert('Order saved successfully!');
    } catch (error) {
      console.error('Failed to save order:', error);
      alert('Failed to save order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Create Order</h2>

      {/* Client Selection */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Client
        </label>
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a client...</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name} - {client.region}
            </option>
          ))}
        </select>

        {selectedClient && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium">{selectedClient.name}</p>
            <p className="text-sm text-gray-600">{selectedClient.location || 'No location specified'}</p>
          </div>
        )}
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Add Products</h3>
        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
          {products.map(product => (
            <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600">{product.sku}</p>
                <p className="text-sm font-medium text-green-600">${product.price.toFixed(2)}</p>
              </div>
              <button
                onClick={() => addProduct(product)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Order Items */}
      {orderItems.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Order Items</h3>
          <div className="space-y-3">
            {orderItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product.name}</p>
                  <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 text-gray-600 hover:text-gray-900"
                  >
                    <Minus size={16} />
                  </button>
                  
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 text-gray-600 hover:text-gray-900"
                  >
                    <Plus size={16} />
                  </button>
                  
                  <div className="w-20 text-right">
                    <span className="font-medium">${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Options */}
      {orderItems.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Order Options</h3>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isFreeStock}
                onChange={(e) => setIsFreeStock(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-900">Free Stock Order</span>
            </label>

            {isFreeStock && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Free Stock Reason
                </label>
                <input
                  type="text"
                  value={freeStockReason}
                  onChange={(e) => setFreeStockReason(e.target.value)}
                  placeholder="Enter reason for free stock..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {!isFreeStock && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {discountPercentage > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Reason
                    </label>
                    <select
                      value={selectedDiscountReason}
                      onChange={(e) => setSelectedDiscountReason(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select reason...</option>
                      {discountReasons.filter(r => r.reason_type === 'discount').map(reason => (
                        <option key={reason.id} value={reason.id}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Notes (Optional)
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Add any notes about this order..."
                rows={2}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Order Summary */}
      {orderItems.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            
            {(discountPercentage > 0 || isFreeStock) && (
              <div className="flex justify-between text-red-600">
                <span>Discount ({isFreeStock ? 100 : discountPercentage}%):</span>
                <span>-${calculateDiscount().toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={submitOrder}
            disabled={!selectedClientId}
            className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
          >
            <Download size={16} />
            <span>Create Order & Generate PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}