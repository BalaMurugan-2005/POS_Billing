import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';

const VisualScanner = ({ isOpen, onClose, onScan }) => {
    const scannerRef = useRef(null);
    const isClearedRef = useRef(false);

    useEffect(() => {
        if (!isOpen) return;

        isClearedRef.current = false;

        // Small delay to ensure the Dialog's DOM is fully rendered
        const timeout = setTimeout(() => {
            const element = document.getElementById('reader');
            if (!element) return;

            const scanner = new Html5QrcodeScanner(
                'reader',
                { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                false
            );

            scanner.render(
                (decodedText) => {
                    if (isClearedRef.current) return;
                    isClearedRef.current = true;
                    scanner.clear().catch(() => { });
                    onScan(decodedText);
                    onClose();
                },
                () => { /* suppress scan errors */ }
            );

            scannerRef.current = scanner;
        }, 100);

        return () => {
            clearTimeout(timeout);
            if (scannerRef.current && !isClearedRef.current) {
                isClearedRef.current = true;
                scannerRef.current.clear().catch(() => { });
                scannerRef.current = null;
            }
        };
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

