import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./lib/supabase";
import imageCompression from "browser-image-compression"; // Import image compression library
import BarcodeScanner from "./components/BarcodeScanner"; // Import the BarcodeScanner component
import {
    ShoppingCart,
    Search,
    Plus,
    Minus,
    Trash2,
    Package,
    Users,
    TrendingDown,
    DollarSign,
    Edit,
    X,
    Camera,
} from "lucide-react";

// --- Reusable ProductModal Component ---
function ProductModal({ product, categories, suppliers, onSave, onClose }) {
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        barcode: "",
        category_id: "",
        buy_price: "",
        sell_price: "",
        stock: "",
        min_stock: "",
        supplier_id: "",
        is_active: true,
        image_url: "", // Added for product image URL
    });
    const [errors, setErrors] = useState({});
    const [imageFile, setImageFile] = useState(null); // State to hold the selected image file
    const [uploadingImage, setUploadingImage] = useState(false); // State for image upload loading
    const fileInputRef = useRef(null); // Ref for file input to trigger click

    // Populate form data when product prop changes (for editing)
    useEffect(() => {
        if (process.env.NODE_ENV !== "production")
            console.log("ProductModal: Product prop changed", product);
        if (product) {
            setFormData({
                name: product.name || "",
                sku: product.sku || "",
                barcode: product.barcode || "",
                category_id: product.category_id || "",
                buy_price: product.buy_price || 0,
                sell_price: product.sell_price || 0,
                stock: product.stock || 0,
                min_stock: product.min_stock || 0,
                supplier_id: product.supplier_id || "",
                is_active: product.is_active,
                image_url: product.image_url || "", // Set existing image URL
            });
        } else {
            // Reset form for new product
            setFormData({
                name: "",
                sku: "",
                barcode: "",
                category_id: "",
                buy_price: 0,
                sell_price: 0,
                stock: 0,
                min_stock: 0,
                supplier_id: "",
                is_active: true,
                image_url: "",
            });
        }
        setErrors({}); // Clear errors when modal opens/changes product
        setImageFile(null); // Clear image file
    }, [product]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // Handle image file selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setFormData((prev) => ({
                ...prev,
                image_url: URL.createObjectURL(file),
            })); // Show local preview
        }
    };

    // Upload image to Supabase Storage
    const uploadProductImage = async () => {
        if (!imageFile) {
            alert("Pilih gambar terlebih dahulu!");
            return null;
        }

        setUploadingImage(true);
        let uploadedUrl = null;
        try {
            // --- DEBUGGING: Check imageCompression type ---
            if (process.env.NODE_ENV !== "production") {
                console.log(
                    "DEBUG: Type of imageCompression before call:",
                    typeof imageCompression,
                );
                console.log(
                    "DEBUG: imageCompression itself:",
                    imageCompression,
                );
            }
            // --- END DEBUGGING ---

            // CRITICAL CHECK: Ensure imageCompression is a function
            if (typeof imageCompression !== "function") {
                console.error(
                    "Error: imageCompression library not loaded correctly or is not a function.",
                );
                alert(
                    "Terjadi masalah dengan library pengolah gambar. Mohon coba lagi atau hubungi dukungan.",
                );
                setUploadingImage(false);
                return null;
            }

            // Compress image before uploading
            const options = {
                maxSizeMB: 0.5, // Max file size in MB (e.g., 500KB)
                maxWidthOrHeight: 800, // Max width/height
                useWebWorker: true, // Use web worker for better performance (if supported)
            };

            const compressedFile = await imageCompression(imageFile, options); // This is the call that was erroring

            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `product-images/${fileName}`; // Define path in Supabase Storage

            const { data, error } = await supabase.storage
                .from("product-images") // Your storage bucket name
                .upload(filePath, compressedFile, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (error) throw error;

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from("product-images")
                .getPublicUrl(filePath);

            uploadedUrl = publicUrlData.publicUrl;
            setFormData((prev) => ({ ...prev, image_url: uploadedUrl })); // Update form with new URL
            alert("Gambar berhasil diunggah!");
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Gagal mengunggah gambar: " + error.message);
        } finally {
            setUploadingImage(false);
        }
        return uploadedUrl;
    };

    // Handle button click to trigger file input
    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    // Validate form fields
    const validateForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = "Nama produk wajib diisi.";
        if (!formData.sku) newErrors.sku = "SKU produk wajib diisi.";
        if (!formData.category_id)
            newErrors.category_id = "Kategori wajib dipilih.";

        const buyPrice = parseFloat(formData.buy_price);
        if (isNaN(buyPrice) || buyPrice < 0)
            newErrors.buy_price = "Harga beli tidak valid.";

        const sellPrice = parseFloat(formData.sell_price);
        if (isNaN(sellPrice) || sellPrice < 0)
            newErrors.sell_price = "Harga jual tidak valid.";

        const stock = parseInt(formData.stock, 10);
        if (isNaN(stock) || stock < 0) newErrors.stock = "Stok tidak valid.";

        const minStock = parseInt(formData.min_stock, 10);
        if (isNaN(minStock) || minStock < 0)
            newErrors.min_stock = "Minimum stok tidak valid.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        // Made async to await image upload
        e.preventDefault();
        if (!validateForm()) {
            alert("Silakan perbaiki kesalahan pada form.");
            return;
        }

        let finalImageUrl = formData.image_url;
        if (imageFile) {
            // If a new file is selected, upload it
            const uploaded = await uploadProductImage();
            if (uploaded) {
                finalImageUrl = uploaded;
            } else {
                // If upload fails, prevent saving product (optional)
                // alert('Gagal mengunggah gambar, produk tidak disimpan.');
                // return;
            }
        }

        const parsedData = {
            ...formData,
            buy_price: parseFloat(formData.buy_price),
            sell_price: parseFloat(formData.sell_price),
            stock: parseInt(formData.stock, 10),
            min_stock: parseInt(formData.min_stock, 10),
            barcode: formData.barcode === "" ? null : formData.barcode,
            supplier_id:
                formData.supplier_id === "" ? null : formData.supplier_id,
            image_url: finalImageUrl || null, // Save the final image URL
        };

        onSave(parsedData, product ? product.id : null);
    };

    return (
        // Fixed overlay for the modal
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100] flex justify-center items-center">
            {/* Modal content area */}
            <div className="relative p-8 bg-white rounded-lg shadow-xl max-w-lg w-full m-4 opacity-100 transition-opacity duration-300">
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    <X className="h-6 w-6" />
                </button>
                <h3 className="text-2xl font-bold mb-6 text-gray-900">
                    {product ? "Edit Produk" : "Tambah Produk Baru"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Upload Field */}
                    <div>
                        <label
                            htmlFor="image_upload"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Gambar Produk
                        </label>
                        <div className="mt-1 flex items-center space-x-4">
                            {formData.image_url ? (
                                <img
                                    src={formData.image_url}
                                    alt="Product Preview"
                                    className="w-24 h-24 object-cover rounded-md border border-gray-300"
                                />
                            ) : (
                                <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs border border-gray-300">
                                    Tidak Ada Gambar
                                </div>
                            )}
                            <input
                                type="file"
                                id="image_upload"
                                accept="image/*"
                                onChange={handleImageChange}
                                ref={fileInputRef}
                                className="hidden" // Hide the default file input
                            />
                            <button
                                type="button"
                                onClick={triggerFileInput}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                disabled={uploadingImage}
                            >
                                {uploadingImage
                                    ? "Mengunggah..."
                                    : "Pilih Gambar"}
                            </button>
                        </div>
                    </div>
                    {/* End Image Upload Field */}

                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Nama Produk
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor="sku"
                            className="block text-sm font-medium text-gray-700"
                        >
                            SKU
                        </label>
                        <input
                            type="text"
                            name="sku"
                            id="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        />
                        {errors.sku && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.sku}
                            </p>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor="barcode"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Barcode (Opsional)
                        </label>
                        <input
                            type="text"
                            name="barcode"
                            id="barcode"
                            value={formData.barcode}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="category_id"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Kategori
                        </label>
                        <select
                            name="category_id"
                            id="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        >
                            <option value="">Pilih Kategori</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.category_id}
                            </p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="buy_price"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Harga Beli
                            </label>
                            <input
                                type="number"
                                name="buy_price"
                                id="buy_price"
                                value={formData.buy_price}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                step="0.01"
                            />
                            {errors.buy_price && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.buy_price}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="sell_price"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Harga Jual
                            </label>
                            <input
                                type="number"
                                name="sell_price"
                                id="sell_price"
                                value={formData.sell_price}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                step="0.01"
                            />
                            {errors.sell_price && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.sell_price}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="stock"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Stok
                            </label>
                            <input
                                type="number"
                                name="stock"
                                id="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                            />
                            {errors.stock && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.stock}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="min_stock"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Minimum Stok
                            </label>
                            <input
                                type="number"
                                name="min_stock"
                                id="min_stock"
                                value={formData.min_stock}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                            />
                            {errors.min_stock && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.min_stock}
                                </p>
                            )}
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="supplier_id"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Supplier (Opsional)
                        </label>
                        <select
                            name="supplier_id"
                            id="supplier_id"
                            value={formData.supplier_id}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        >
                            <option value="">Pilih Supplier</option>
                            {suppliers.map((sup) => (
                                <option key={sup.id} value={sup.id}>
                                    {sup.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="is_active"
                            name="is_active"
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label
                            htmlFor="is_active"
                            className="ml-2 block text-sm text-gray-900"
                        >
                            Aktif
                        </label>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                            {product ? "Simpan Perubahan" : "Tambah Produk"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Main App Component ---
function App() {
    // --- States ---
    const [activeTab, setActiveTab] = useState("dashboard");
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [cart, setCart] = useState([]); // Inisialisasi cart
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalCategories: 0,
        lowStock: 0,
        cartItems: 0,
    });
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false); // State for barcode scanner modal

    // --- Effects ---

    // Effect to manage body scroll and background dimming based on modal state
    useEffect(() => {
        if (isProductFormOpen || isBarcodeScannerOpen) {
            // Check both modals
            document.body.classList.add("modal-open");
            document.body.style.overflow = "hidden";
        } else {
            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
        }
        return () => {
            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
        };
    }, [isProductFormOpen, isBarcodeScannerOpen]); // Added isBarcodeScannerOpen dependency

    // Data Fetching Functions (NOT wrapped in useCallback anymore to simplify dependencies for fetchAndSetAllInitialData)
    // They now return data directly and don't set state
    const fetchProductsData = async () => {
        if (process.env.NODE_ENV !== "production")
            console.log("--- DEBUG: fetchProductsData called ---");
        try {
            const { data, error } = await supabase
                .from("products")
                .select(
                    `
                    id, name, sku, sell_price, stock, min_stock, buy_price, is_active, barcode, category_id, image_url,
                    categories(name),
                    supplier_id,
                    suppliers(name)
                `,
                )
                .order("name");

            if (error) throw error;
            if (process.env.NODE_ENV !== "production")
                console.log("--- DEBUG: Products Data fetched. ---");
            return data;
        } catch (error) {
            console.error("--- DEBUG: Error fetching products data:", error);
            throw error;
        }
    };

    const fetchCategoriesData = async () => {
        if (process.env.NODE_ENV !== "production")
            console.log("--- DEBUG: fetchCategoriesData called ---");
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name")
                .eq("is_active", true)
                .order("name");

            if (error) throw error;
            if (process.env.NODE_ENV !== "production")
                console.log("--- DEBUG: Categories Data fetched ---");
            return data;
        } catch (error) {
            console.error("--- DEBUG: Error fetching categories data:", error);
            throw error;
        }
    };

    const fetchSuppliersData = async () => {
        if (process.env.NODE_ENV !== "production")
            console.log("--- DEBUG: fetchSuppliersData called ---");
        try {
            const { data, error } = await supabase
                .from("suppliers")
                .select("id, name")
                .eq("is_active", true)
                .order("name");

            if (error) throw error;
            if (process.env.NODE_ENV !== "production")
                console.log("--- DEBUG: Suppliers Data fetched ---");
            return data;
        } catch (error) {
            console.error("--- DEBUG: Error fetching suppliers data:", error);
            throw error;
        }
    };

    // fetchStatsData now takes fetched raw data as arguments and computes stats
    const fetchStatsData = async (productsResult, categoriesResult) => {
        if (process.env.NODE_ENV !== "production")
            console.log("--- DEBUG: fetchStatsData called ---");
        try {
            const allActiveProducts =
                productsResult?.filter((product) => product.is_active) || [];
            const allActiveCategories =
                categoriesResult?.filter((category) => category.is_active) ||
                [];

            const lowStockItems =
                allActiveProducts.filter(
                    (product) => product.stock <= product.min_stock,
                ) || [];

            setStats((prev) => ({
                ...prev,
                totalProducts: allActiveProducts.length || 0,
                totalCategories: allActiveCategories.length || 0,
                lowStock: lowStockItems.length,
            }));

            setLowStockProducts(lowStockItems);
            if (process.env.NODE_ENV !== "production")
                console.log("--- DEBUG: Stats updated. ---");
        } catch (error) {
            console.error("--- DEBUG: Error fetching stats data:", error);
            throw error;
        }
    };

    // Combined initial data fetching and state setting function (memoized with useCallback)
    // This is the main function called by useEffect only once on mount
    const fetchAndSetAllInitialData = useCallback(async () => {
        if (process.env.NODE_ENV !== "production")
            console.log("--- DEBUG: fetchAndSetAllInitialData called ---");
        setLoading(true);
        try {
            // Fetch all raw data in parallel
            const [productsResult, categoriesResult, suppliersResult] =
                await Promise.all([
                    fetchProductsData(), // Call the async functions directly
                    fetchCategoriesData(),
                    fetchSuppliersData(),
                ]);

            // Set states ONLY ONCE after all data is fetched
            setProducts(productsResult || []);
            setCategories(categoriesResult || []);
            setSuppliers(suppliersResult || []);

            // Then calculate and set stats using the fresh data
            await fetchStatsData(productsResult, categoriesResult); // Pass results to fetchStatsData

            if (process.env.NODE_ENV !== "production")
                console.log(
                    "--- DEBUG: All initial data fetched and states set successfully. ---",
                );
        } catch (error) {
            console.error(
                "--- DEBUG: Error in fetchAndSetAllInitialData:",
                error,
            );
        } finally {
            setLoading(false);
            if (process.env.NODE_ENV !== "production")
                console.log(
                    "--- DEBUG: Initial data fetch complete. Loading set to false. ---",
                );
        }
    }, []); // CRITICAL: This useCallback now has an empty dependency array, making it stable.

    // Initial data fetch on app load - this useEffect should only run once
    useEffect(() => {
        if (process.env.NODE_ENV !== "production")
            console.log(
                "--- DEBUG: Main App useEffect running (calling fetchAndSetAllInitialData) ---",
            );
        fetchAndSetAllInitialData();
    }, [fetchAndSetAllInitialData]); // Dependency is the memoized fetchAndSetAllInitialData function

    // Effect to update cart items count in header stats
    useEffect(() => {
        setStats((prev) => ({ ...prev, cartItems: cart.length }));
    }, [cart]);

    // --- Cart Functions (POS) ---
    const addToCart = (product) => {
        if (!product.is_active) {
            alert(
                "Produk " +
                    product.name +
                    " tidak aktif dan tidak bisa ditambahkan ke keranjang.",
            );
            return;
        }
        const existingItemIndex = cart.findIndex(
            (item) => item.id === product.id,
        );

        if (existingItemIndex !== -1) {
            const existingItem = cart[existingItemIndex];
            if (existingItem.quantity + 1 > product.stock) {
                alert(
                    "Stok untuk " +
                        product.name +
                        " tidak mencukupi. Hanya tersedia " +
                        product.stock +
                        " unit.",
                );
                return;
            }
            const updatedCart = [...cart];
            updatedCart[existingItemIndex] = {
                ...existingItem,
                quantity: existingItem.quantity + 1,
            };
            setCart(updatedCart);
        } else {
            if (product.stock === 0) {
                alert("Stok untuk " + product.name + " habis.");
                return;
            }
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const updateCartQuantity = (productId, newQuantity) => {
        const productInCartIndex = cart.findIndex(
            (item) => item.id === productId,
        );

        if (productInCartIndex === -1) return;

        const productInCart = cart[productInCartIndex];
        const originalProduct = products.find((p) => p.id === productId);

        if (!originalProduct) return;

        if (newQuantity <= 0) {
            setCart(cart.filter((item) => item.id !== productId));
        } else if (newQuantity > originalProduct.stock) {
            alert(
                "Stok untuk " +
                    originalProduct.name +
                    " hanya " +
                    originalProduct.stock +
                    ".",
            );
            const updatedCart = [...cart];
            updatedCart[productInCartIndex] = {
                ...productInCart,
                quantity: originalProduct.stock,
            };
            setCart(updatedCart);
        } else {
            const updatedCart = [...cart];
            updatedCart[productInCartIndex] = {
                ...productInCart,
                quantity: newQuantity,
            };
            setCart(updatedCart);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter((item) => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const getTotalAmount = () => {
        return cart.reduce(
            (total, item) => total + item.sell_price * item.quantity,
            0,
        );
    };

    // --- POS Filter and Search Logic ---
    const filteredProducts = products.filter((product) => {
        const matchesSearch = searchTerm
            ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.sku.toLowerCase().includes(searchTerm.toLowerCase())
            : true;
        const matchesCategory =
            selectedCategory === "" ||
            product.category_id.toString() === selectedCategory;

        return product.is_active && matchesSearch && matchesCategory;
    });

    // --- Utility Functions ---
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // --- Transaction Processing ---
    const processPayment = async (paymentData) => {
        if (cart.length === 0) {
            alert("Keranjang belanja kosong. Silakan tambahkan produk.");
            return false;
        }

        try {
            const { data: transaction, error: transactionError } =
                await supabase
                    .from("transaction")
                    .insert([
                        {
                            transaction_code: "TRX-" + Date.now(),
                            customer_name: paymentData.customerName || "Guest",
                            total_amount: getTotalAmount(),
                            payment_method: paymentData.method,
                            payment_amount: paymentData.amount,
                            change_amount: paymentData.change,
                            discount_amount: 0,
                            status: "completed",
                        },
                    ])
                    .select()
                    .single();

            if (transactionError) throw transactionError;

            const transactionItems = cart.map((item) => ({
                transaction_id: transaction.id,
                product_id: item.id,
                quantity: item.quantity,
                price: item.sell_price,
                subtotal: item.sell_price * item.quantity,
            }));

            const { error: itemsError } = await supabase
                .from("transaction_items")
                .insert(transactionItems);

            if (itemsError) throw itemsError;

            for (const item of cart) {
                const { error: stockError } = await supabase
                    .from("products")
                    .update({ stock: item.stock - item.quantity })
                    .eq("id", item.id);

                if (stockError) throw stockError;
            }

            clearCart(); // Clear cart after successful transaction
            await fetchAndSetAllInitialData(); // Re-fetch all data to update stats and product list

            alert("Transaksi berhasil diproses!");
            return true;
        } catch (error) {
            console.error("Error processing payment:", error);
            alert("Gagal memproses transaksi: " + error.message);
            return false;
        }
    };

    // --- Product Management Handlers ---
    const openProductForm = (product = null) => {
        setEditingProduct(product);
        setIsProductFormOpen(true);
    };

    const closeProductForm = () => {
        setIsProductFormOpen(false);
        setEditingProduct(null);
    };

    const saveProduct = async (productData, id = null) => {
        setLoading(true);
        try {
            let error;
            if (id) {
                const { error: updateError } = await supabase
                    .from("products")
                    .update(productData)
                    .eq("id", id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("products")
                    .insert([productData]);
                error = insertError;
            }

            if (error) throw error;

            alert(
                "Produk berhasil " + (id ? "diperbarui" : "ditambahkan") + "!",
            );
            closeProductForm();
            await fetchAndSetAllInitialData();
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Gagal menyimpan produk: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (productId, productName) => {
        if (
            window.confirm(
                'Apakah Anda yakin ingin menghapus produk "' +
                    productName +
                    '"? (Ini akan menonaktifkan produk, tidak menghapusnya secara permanen)',
            )
        ) {
            setLoading(true);
            try {
                const { error } = await supabase
                    .from("products")
                    .update({ is_active: false })
                    .eq("id", productId);

                if (error) throw error;

                alert('Produk "' + productName + '" berhasil dinonaktifkan.');
                await fetchAndSetAllInitialData();
            } catch (error) {
                console.error("Error deleting product:", error);
                alert("Gagal menghapus produk: " + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    // --- Barcode Scanner Handlers ---
    const openBarcodeScanner = () => {
        setIsBarcodeScannerOpen(true);
    };

    const closeBarcodeScanner = () => {
        setIsBarcodeScannerOpen(false);
    };

    const handleBarcodeScan = (scannedData) => {
        if (process.env.NODE_ENV !== "production")
            console.log("DEBUG: Barcode Scanned:", scannedData);
        // Automatically search for the scanned product
        setSearchTerm(scannedData);
        // Optionally, add the product to cart directly if found (advanced)
    };

    // --- Main App Render ---
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat BJS RACING POS...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-orange-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <Package className="h-8 w-8 text-orange-600 mr-3" />
                        <h1 className="text-2xl font-extrabold text-gray-900">
                            BJS RACING POS
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center bg-orange-100 px-3 py-1 rounded-full">
                            <ShoppingCart className="h-4 w-4 text-orange-600 mr-1" />
                            <span className="text-sm font-semibold text-orange-600">
                                {stats.cartItems}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {["dashboard", "pos", "produk"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-3 px-1 border-b-3 font-medium text-base capitalize transition-colors duration-200 ease-in-out ${
                                    activeTab === tab
                                        ? "border-orange-500 text-orange-600"
                                        : "border-transparent text-gray-600 hover:text-orange-700 hover:border-orange-300"
                                }`}
                            >
                                {tab === "pos" ? "Point of Sale" : tab}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            {/* Apply styling to dim and disable interaction with background when modal is open */}
            <main
                className={`flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8 ${isProductFormOpen && activeTab === "produk" ? "opacity-30 pointer-events-none" : ""}`}
            >
                {activeTab === "dashboard" && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">
                            Dashboard
                        </h2>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4">
                                <Package className="h-10 w-10 text-orange-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Total Produk
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.totalProducts}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4">
                                <Users className="h-10 w-10 text-orange-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Total Kategori
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.totalCategories}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4">
                                <TrendingDown className="h-10 w-10 text-red-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Produk Stok Rendah
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.lowStock}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4">
                                <ShoppingCart className="h-10 w-10 text-orange-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Item di Keranjang
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.cartItems}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Low Stock Products List */}
                        {lowStockProducts.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Produk Stok Rendah
                                    </h3>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {lowStockProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="border border-red-200 rounded-lg p-4 bg-red-50"
                                        >
                                            <h4 className="font-medium text-gray-900">
                                                {product.name}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                SKU: {product.sku}
                                            </p>
                                            <p className="text-sm text-red-600">
                                                Stok: {product.stock} | Min:{" "}
                                                {product.min_stock}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {lowStockProducts.length === 0 &&
                            stats.totalProducts > 0 && (
                                <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                                    <p>Tidak ada produk dengan stok rendah.</p>
                                </div>
                            )}
                    </div>
                )}

                {activeTab === "pos" && (
                    <div className="space-y-6">
                        {/* Search and Category Filter Section */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        name="search"
                                        placeholder="Cari produk atau SKU..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                        value={searchTerm} // Wired up
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        } // Wired up
                                    />
                                    {/* Barcode Scanner Button */}
                                    <button
                                        onClick={openBarcodeScanner}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-600 p-1"
                                        title="Scan Barcode"
                                    >
                                        <Camera className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <select
                                name="categoryFilter"
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                value={selectedCategory} // Wired up
                                onChange={(e) =>
                                    setSelectedCategory(e.target.value)
                                } // Wired up
                            >
                                <option value="">Semua Kategori</option>
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Cart Section - Moved to below filters */}
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Keranjang
                                </h3>
                                {cart.length > 0 && (
                                    // Proses Pembayaran button moved here
                                    <button
                                        onClick={() =>
                                            processPayment({
                                                method: "Tunai",
                                                amount: getTotalAmount(),
                                                change: 0,
                                                customerName: "Guest",
                                            })
                                        } // Wired up
                                        className="bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 mr-2"
                                    >
                                        Proses Pembayaran
                                    </button>
                                )}
                                {cart.length > 0 && (
                                    <button
                                        onClick={clearCart} // Wired up
                                        className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {cart.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p>
                                        Keranjang kosong. Silakan tambahkan
                                        produk.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 text-sm">
                                                    {item.name}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {formatCurrency(
                                                        item.sell_price,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() =>
                                                        updateCartQuantity(
                                                            item.id,
                                                            item.quantity - 1,
                                                        )
                                                    }
                                                    className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-8 text-center text-sm">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateCartQuantity(
                                                            item.id,
                                                            item.quantity + 1,
                                                        )
                                                    }
                                                    className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        removeFromCart(item.id)
                                                    }
                                                    className="p-1 rounded-full bg-red-200 hover:bg-red-300 ml-2"
                                                >
                                                    <Trash2 className="h-3 w-3 text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-lg font-semibold text-gray-900">
                                                Total:
                                            </span>
                                            <span className="text-2xl font-bold text-orange-600">
                                                {formatCurrency(
                                                    getTotalAmount(),
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Product Grid Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.length === 0 ? (
                                <div className="col-span-full text-center py-8 text-gray-500">
                                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p>
                                        Tidak ada produk ditemukan sesuai
                                        pencarian/filter.
                                    </p>
                                </div>
                            ) : (
                                filteredProducts.map((product) => {
                                    const itemInCart = cart.find(
                                        (item) => item.id === product.id,
                                    );
                                    return (
                                        <div
                                            key={product.id}
                                            className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="flex flex-col items-start mb-2">
                                                {/* Product Image */}
                                                <div className="w-full h-24 bg-gray-200 rounded-md mb-2 flex items-center justify-center text-gray-400 text-xs overflow-hidden">
                                                    {product.image_url ? (
                                                        <img
                                                            src={
                                                                product.image_url
                                                            }
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>
                                                            Gambar Produk
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1">
                                                    {product.name}
                                                </h3>
                                                <span className="text-xs text-gray-500 mb-1">
                                                    SKU: {product.sku}
                                                </span>
                                                <span className="text-xs text-gray-600">
                                                    {product.categories?.name ||
                                                        "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-lg font-bold text-green-600">
                                                    {formatCurrency(
                                                        product.sell_price,
                                                    )}
                                                </span>
                                                <span
                                                    className={`text-xs font-medium ${product.stock <= product.min_stock ? "text-red-500" : "text-gray-500"}`}
                                                >
                                                    Stok: {product.stock}
                                                </span>
                                            </div>
                                            {product.is_active ? (
                                                itemInCart ? (
                                                    <div className="flex items-center justify-center space-x-2 w-full mt-2">
                                                        <button
                                                            onClick={() =>
                                                                updateCartQuantity(
                                                                    product.id,
                                                                    itemInCart.quantity -
                                                                        1,
                                                                )
                                                            }
                                                            className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            disabled={
                                                                itemInCart.quantity <=
                                                                0
                                                            }
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                        <span className="w-12 text-center font-bold text-lg text-gray-800">
                                                            {
                                                                itemInCart.quantity
                                                            }
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                updateCartQuantity(
                                                                    product.id,
                                                                    itemInCart.quantity +
                                                                        1,
                                                                )
                                                            }
                                                            className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            disabled={
                                                                itemInCart.quantity >=
                                                                product.stock
                                                            }
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            addToCart(product)
                                                        }
                                                        disabled={
                                                            product.stock === 0
                                                        }
                                                        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                                            product.stock === 0
                                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                                : "bg-orange-600 text-white hover:bg-orange-700"
                                                        }`}
                                                    >
                                                        {product.stock === 0
                                                            ? "Stok Habis"
                                                            : "Tambah ke Keranjang"}
                                                    </button>
                                                )
                                            ) : (
                                                <div className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-gray-300 text-gray-500 text-center cursor-not-allowed">
                                                    Produk Tidak Aktif
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "produk" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-gray-800">
                                Manajemen Produk
                            </h2>
                            <button
                                onClick={() => openProductForm()}
                                className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 flex items-center transition-colors duration-200"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Produk
                            </button>
                        </div>

                        {/* Product Table */}
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Produk
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Gambar
                                            </th>{" "}
                                            {/* New Image Column */}
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                SKU
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kategori
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Supplier
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Harga Beli
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Harga Jual
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stok
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {products.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="10"
                                                    className="px-6 py-4 whitespace-nowrap text-center text-gray-500"
                                                >
                                                    Tidak ada produk ditemukan.
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((product) => (
                                                <tr
                                                    key={product.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {product.image_url ? (
                                                            <img
                                                                src={
                                                                    product.image_url
                                                                }
                                                                alt={
                                                                    product.name
                                                                }
                                                                className="w-16 h-16 object-cover rounded-md"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs">
                                                                No Img
                                                            </div>
                                                        )}
                                                    </td>{" "}
                                                    {/* Image Column */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {product.sku}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {product.categories
                                                            ?.name || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {product.suppliers
                                                            ?.name || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatCurrency(
                                                            product.buy_price,
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatCurrency(
                                                            product.sell_price,
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                product.stock <=
                                                                product.min_stock
                                                                    ? "bg-red-100 text-red-800"
                                                                    : "bg-green-100 text-green-800"
                                                            }`}
                                                        >
                                                            {product.stock}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                product.is_active
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-gray-100 text-gray-800"
                                                            }`}
                                                        >
                                                            {product.is_active
                                                                ? "Aktif"
                                                                : "Tidak Aktif"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() =>
                                                                openProductForm(
                                                                    product,
                                                                )
                                                            }
                                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                        >
                                                            <Edit className="h-5 w-5 inline-block" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                deleteProduct(
                                                                    product.id,
                                                                    product.name,
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 className="h-5 w-5 inline-block" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Product Modal (rendered via createPortal) */}
            {isProductFormOpen &&
                activeTab === "produk" &&
                createPortal(
                    <ProductModal
                        product={editingProduct}
                        categories={categories}
                        suppliers={suppliers}
                        onSave={saveProduct}
                        onClose={closeProductForm}
                    />,
                    document.body,
                )}

            {/* Barcode Scanner Modal */}
            {isBarcodeScannerOpen &&
                createPortal(
                    <BarcodeScanner
                        onScan={handleBarcodeScan}
                        onClose={closeBarcodeScanner}
                    />,
                    document.body,
                )}
        </div>
    );
}

export default App;
