import React, { useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { EnvelopeIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { transactionService } from '../../services/transactionService';

const Receipt = ({ isOpen, onClose, transaction }) => {
  const receiptRef = useRef(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt { max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .items { margin: 20px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          ${receiptRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadPDF = async () => {
    const element = receiptRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`receipt-${transaction.id}.pdf`);

    toast.success('Receipt downloaded');
  };

  const handleEmail = async () => {
    try {
      if (!transaction?.customer?.email && !transaction?.id) {
        toast.error('Email not available');
        return;
      }
      const email = transaction.customer?.email || prompt("Enter email address:");
      if (!email) return;

      await toast.promise(
        transactionService.sendReceipt(transaction.id, email),
        {
          loading: 'Sending receipt...',
          success: 'Receipt sent successfully',
          error: 'Failed to send receipt'
        }
      );
    } catch (error) {
      console.error('Email error:', error);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6"
          >
            <Dialog.Title className="text-xl font-bold mb-4 flex justify-between items-center">
              <span>Receipt</span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Print"
                >
                  <PrinterIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Download PDF"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleEmail}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Email"
                >
                  <EnvelopeIcon className="w-5 h-5" />
                </button>
              </div>
            </Dialog.Title>

            <div ref={receiptRef} className="bg-white text-black p-6 rounded-lg">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Supermarket POS</h2>
                <p className="text-sm text-gray-600">123 Main Street, City</p>
                <p className="text-sm text-gray-600">Tel: (555) 123-4567</p>
              </div>

              <div className="mb-4 text-sm">
                <p>Receipt #: {transaction.id || transaction.transactionNumber}</p>
                <p>Date: {(() => {
                  try {
                    const date = transaction.createdAt ? new Date(transaction.createdAt) :
                      transaction.timestamp ? new Date(transaction.timestamp) :
                        new Date();
                    return isNaN(date.getTime()) ? format(new Date(), 'dd/MM/yyyy HH:mm') : format(date, 'dd/MM/yyyy HH:mm');
                  } catch (e) {
                    return format(new Date(), 'dd/MM/yyyy HH:mm');
                  }
                })()}</p>
                <p>Cashier: {transaction.cashier?.name || transaction.cashierName || 'N/A'}</p>
                {transaction.customer && (
                  <p>Customer: {transaction.customer.name}</p>
                )}
              </div>

              <div className="border-t border-b border-gray-300 py-2 mb-4">
                <div className="flex justify-between font-bold">
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Price</span>
                </div>
              </div>

              <div className="mb-4">
                {transaction.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm mb-2">
                    <span className="flex-1">{item.productName || item.name}</span>
                    <span className="w-16 text-center">{item.quantity}</span>
                    <span className="w-20 text-right">
                      ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${transaction.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>${transaction.tax.toFixed(2)}</span>
                </div>
                {transaction.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${transaction.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total:</span>
                  <span>${transaction.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span>Payment Method:</span>
                  <span className="capitalize">{transaction.paymentMethod}</span>
                </div>
                {transaction.paidAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Paid:</span>
                      <span>${transaction.paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Change:</span>
                      <span>${transaction.change.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center mt-6 text-sm text-gray-600">
                <p>Thank you for shopping with us!</p>
                <p>Please come again</p>
                {transaction.offline && (
                  <p className="text-yellow-600 mt-2">* Offline Transaction *</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </motion.div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default Receipt;