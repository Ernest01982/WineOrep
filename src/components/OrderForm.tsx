import React, { useState, useEffect } from 'react';
import { Plus, Minus, Download, Trash2 } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { OfflineService } from '../services/offline';
import { DatabaseService } from '../services/database';
import { PDFService } from '../services/pdf';
import { Product, Order, OrderItem, Client, StockDiscountReason } from '../types';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

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
        <Combobox value={selectedClientId} onChange={setSelectedClientId}>
          <div className="relative">
            <Combobox.Input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => {
                const search = e.target.value.toLowerCase();
                const match = clients.find(c => c.name.toLowerCase().includes(search));
                if (match) setSelectedClientId(match.id);
              }}
              displayValue={(id) => clients.find(c => c.id === id)?.name || ''}
              placeholder="Search client..."
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </Combobox.Button>
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {clients.map((client) => (
                <Combobox.Option
                  key={client.id}
                  value={client.id}
                  className={({ active }) =>
                    classNames(
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                      active ? 'bg-blue-600 text-white' : 'text-gray-900'
                    )
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <span className={classNames('block truncate', selected ? 'font-semibold' : '')}>
                        {client.name} – {client.region}
                      </span>
                      {selected ? (
                        <span className={classNames('absolute inset-y-0 right-0 flex items-center pr-4', active ? 'text-white' : 'text-blue-600')}>
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </div>
        </Combobox>
      </div>

      {/* Remaining sections remain unchanged */}
      {/* You can keep the product list, order summary, and button logic exactly as in your current file */}
    </div>
  );
}
