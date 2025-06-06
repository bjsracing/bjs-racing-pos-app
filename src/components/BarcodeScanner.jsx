import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import { X, CameraOff } from "lucide-react";

function BarcodeScanner({ onScan, onClose }) {
    const webcamRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);

    const videoConstraints = {
        facingMode: "environment", // Use rear camera
    };

    const scanBarcode = useCallback(() => {
        if (webcamRef.current && scanning) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    const imageData = ctx.getImageData(
                        0,
                        0,
                        canvas.width,
                        canvas.height,
                    );

                    const code = jsQR(
                        imageData.data,
                        imageData.width,
                        imageData.height,
                        {
                            inversionAttempts: "dontInvert",
                        },
                    );

                    if (code) {
                        onScan(code.data);
                        setScanning(false); // Stop scanning after successful scan
                        onClose(); // Close the scanner
                    } else {
                        // If no QR/barcode found, keep scanning
                        requestAnimationFrame(scanBarcode);
                    }
                };
                img.src = imageSrc;
            } else {
                requestAnimationFrame(scanBarcode);
            }
        }
    }, [scanning, onScan, onClose]);

    useEffect(() => {
        if (scanning) {
            requestAnimationFrame(scanBarcode);
        }
    }, [scanning, scanBarcode]);

    const handleUserMedia = useCallback(() => {
        setScanning(true);
        setError(null);
    }, []);

    const handleUserMediaError = useCallback((error) => {
        console.error("Camera access error:", error);
        setError(
            "Gagal mengakses kamera. Pastikan browser mengizinkan akses kamera.",
        );
        setScanning(false);
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[110] flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-lg p-4 shadow-xl">
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
                    onClick={onClose}
                >
                    <X className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                    Scan Barcode
                </h3>

                {error && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                )}

                {!scanning && !error && (
                    <div className="text-center text-gray-600 mb-4">
                        <p>Memulai kamera...</p>
                        <CameraOff className="h-10 w-10 mx-auto mt-2 text-gray-400" />
                    </div>
                )}

                <div className="relative w-full h-64 bg-gray-300 rounded-md overflow-hidden">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        onUserMedia={handleUserMedia}
                        onUserMediaError={handleUserMediaError}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    {scanning && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-48 h-48 border-4 border-orange-500 animate-pulse"></div>
                        </div>
                    )}
                </div>
                <p className="text-center text-gray-500 text-sm mt-4">
                    Posisikan barcode di dalam kotak pemindaian.
                </p>
            </div>
        </div>
    );
}

export default BarcodeScanner;
