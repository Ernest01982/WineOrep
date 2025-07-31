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
    doc.text(client.address, 20, 100);
    if (client.phone) doc.text(`Phone: ${client.phone}`, 20, 110);
    
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
      doc.text(`$${item.line_total.toFixed(2)}`, 160, yPosition);
      
      subtotal += item.line_total;
      yPosition += 10;
    });
    
    // Totals
    yPosition += 10;
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;
    
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 130, yPosition);
    
    if (order.discount_percentage) {
      yPosition += 10;
      const discountAmount = subtotal * (order.discount_percentage / 100);
      doc.text(`Discount (${order.discount_percentage}%): -$${discountAmount.toFixed(2)}`, 130, yPosition);
    }
    
    yPosition += 10;
    doc.setFontSize(14);
    doc.text(`TOTAL: $${order.total_amount.toFixed(2)}`, 130, yPosition);
    
    if (order.is_free_stock) {
      yPosition += 15;
      doc.setFontSize(12);
      doc.text('** FREE STOCK ORDER **', 20, yPosition);
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