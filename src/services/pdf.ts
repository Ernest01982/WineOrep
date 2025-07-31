import jsPDF from 'jspdf';
import { Order, OrderItem, Client, Product } from '../types';

export class PDFService {
  static async generateOrderPDF(
    order: Order, 
    orderItems: (OrderItem & { product: Product })[], 
    client: Client
  ): Promise<Blob> {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('ORDER CONFIRMATION', 20, 30);
    
    // Order details
    doc.setFontSize(12);
    doc.text(`Order ID: ${order.id}`, 20, 50);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 20, 60);
    
    // Client details
    doc.text('BILL TO:', 20, 80);
    doc.text(client.name, 20, 90);
    if (client.location) doc.text(client.location, 20, 100);
    if (client.contact_phone) doc.text(`Phone: ${client.contact_phone}`, 20, 110);
    
    // Order items table header
    doc.text('PRODUCT', 20, 140);
    doc.text('QTY', 100, 140);
    doc.text('PRICE', 130, 140);
    doc.text('TOTAL', 160, 140);
    
    // Draw line under header
    doc.line(20, 145, 190, 145);
    
    // Order items
    let yPosition = 155;
    let subtotal = 0;
    
    orderItems.forEach((item) => {
      doc.text(item.product.name, 20, yPosition);
      doc.text(item.quantity.toString(), 100, yPosition);
      doc.text(`$${item.unit_price.toFixed(2)}`, 130, yPosition);
      const lineTotal = item.quantity * item.unit_price;
      doc.text(`$${lineTotal.toFixed(2)}`, 160, yPosition);
      
      subtotal += lineTotal;
      yPosition += 10;
    });
    
    // Totals
    yPosition += 10;
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;
    
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 130, yPosition);
    
    if (order.discount_percent && order.discount_percent > 0) {
      yPosition += 10;
      doc.text(`Discount (${order.discount_percent}%): -$${order.discount_value?.toFixed(2) || '0.00'}`, 130, yPosition);
    }
    
    yPosition += 10;
    doc.setFontSize(14);
    const total = subtotal - (order.discount_value || 0);
    doc.text(`TOTAL: $${total.toFixed(2)}`, 130, yPosition);
    
    if (order.is_free_stock) {
      yPosition += 15;
      doc.setFontSize(12);
      doc.text('** FREE STOCK ORDER **', 20, yPosition);
      if (order.free_stock_reason) {
        yPosition += 10;
        doc.text(`Reason: ${order.free_stock_reason}`, 20, yPosition);
      }
    }
    
    if (order.notes) {
      yPosition += 15;
      doc.setFontSize(10);
      doc.text('Notes:', 20, yPosition);
      yPosition += 8;
      doc.text(order.notes, 20, yPosition);
    }
    
    return doc.output('blob');
  }

  static downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}