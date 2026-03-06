import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';

const VisualScanner = ({ isOpen, onClose, onScan }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
        /* verbose= */ false
            );

            scanner.render((decodedText) => {
                onScan(decodedText);
                scanner.clear();
                onClose();
            }, (error) => {
                // quiet error
            });

            return () => {
                scanner.clear().catch(error => {
                    console.error("Scanner clear failed:", error);
                });
            };
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-[60]">
            <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-primary-600 text-white">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <CameraIcon className="w-5 h-5" />
                            Scan QR or Barcode
                        </h3>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div id="reader" className="overflow-hidden rounded-lg"></div>
                        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            Center the code within the box to scan
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default VisualScanner;
