import React, { useState, useEffect } from 'react';
import { Plus, Minus, Download, Trash2 } from 'lucide-react';
import { OfflineService } from '../services/offline';
import { DatabaseService } from '../services/database';
import { PDFService } from '../services/pdf';
import { Product, Order, OrderItem, Client, StockDiscountReason } from '../types';

export function OrderForm() {
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
  const [currentRep, setCurrentRep] = useState<any>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

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
        id: crypto.randomUUID(),
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
    if (isFreeStock && !freeStockReason) return alert('Provide reason for free stock.');
    if (discountPercentage > 0 && !selectedDiscountReason) return alert('Select discount reason.');

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
      <h2 className="text-xl font-bold text-gray-900">Create Order</h2>

      {/* Client Search Combobox */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Client</label>
        <div className="relative">
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={clientSearch}
            onChange={(e) => {
              setClientSearch(e.target.value);
              setShowClientDropdown(true);
            }}
            onFocus={() => setShowClientDropdown(true)}
            placeholder="Search client..."
          />
          {showClientDropdown && filteredClients.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-600 hover:text-white text-gray-900"
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setClientSearch(client.name);
                    setShowClientDropdown(false);
                  }}
                >
                  <span className="block truncate">
                    {client.name} – {client.location || 'No location'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Products</h3>
        <div className="grid grid-cols-1 gap-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{product.name}</h4>
                <p className="text-sm text-gray-500">{product.category}</p>
                <p className="text-sm font-medium text-gray-900">£{(product.price || 0).toFixed(2)}</p>
              </div>
              <button
                onClick={() => addProduct(product)}
                className="ml-4 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Order Items */}
      {orderItems.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.product?.name}</h4>
                  <p className="text-sm text-gray-500">£{(item.unit_price || 0).toFixed(2)} each</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-medium text-gray-900 min-w-[2rem] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="font-medium text-gray-900 min-w-[4rem] text-right">
                    £{(item.quantity * (item.unit_price || 0)).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Options</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="freeStock"
                checked={isFreeStock}
                onChange={(e) => setIsFreeStock(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="freeStock" className="ml-2 text-sm font-medium text-gray-700">
                Free Stock
              </label>
            </div>

            {isFreeStock && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Free Stock Reason
                </label>
                <textarea
                  value={freeStockReason}
                  onChange={(e) => setFreeStockReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Enter reason for free stock..."
                />
              </div>
            )}

            {!isFreeStock && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            )}

            {discountPercentage > 0 && !isFreeStock && (
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
                  {discountReasons.filter(r => r.reason_type === 'discount').map((reason) => (
                    <option key={reason.id} value={reason.label}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Notes
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Add any notes for this order..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Order Summary */}
      {orderItems.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">£{calculateSubtotal().toFixed(2)}</span>
            </div>
            {(discountPercentage > 0 || isFreeStock) && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Discount ({isFreeStock ? '100' : discountPercentage}%):
                </span>
                <span className="font-medium text-red-600">-£{calculateDiscount().toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>£{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {orderItems.length > 0 && (
        <button
          onClick={submitOrder}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Create Order & Download PDF</span>
        </button>
      )}

      {/* Click outside to close dropdown */}
      {showClientDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowClientDropdown(false)}
        />
      </div>
    </div>
  );
}
