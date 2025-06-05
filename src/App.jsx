import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
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
} from "lucide-react";

// --- ProductFormModal Component (DEFINED OUTSIDE the main App component) ---
function ProductFormModal({ product, categories, suppliers, onSave, onClose }) {
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
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (product) {
            // Set form data when editing an existing product
            setFormData({
                name: product.name || "",
                sku: product.sku || "",
                barcode: product.barcode || "",
                category_id: product.category_id || "", // Ensure it's ID
                buy_price: product.buy_price || 0, // Default to 0 for numbers
                sell_price: product.sell_price || 0,
                stock: product.stock || 0,
                min_stock: product.min_stock || 0,
                supplier_id: product.supplier_id || "", // Ensure it's ID
                is_active: product.is_active, // boolean, directly assign or default to false
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
            });
        }
        setErrors({}); // Clear errors when modal opens/changes product
    }, [product]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            alert("Silakan perbaiki kesalahan pada form.");
            return;
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
        };

        onSave(parsedData, product ? product.id : null);
    };

    return (
        // Menggunakan Tailwind classes untuk fixed position dan z-index tinggi
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100] flex justify-center items-center">
            <div className="relative p-8 bg-white rounded-lg shadow-xl max-w-lg w-full m-4">
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                            htmlFor="is_active"
                            className="ml-2 block text-sm text-gray-900"
                        >
                            Aktif
                        </label>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        {" "}
                        {/* Margin top for buttons */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
    const [activeTab, setActiveTab] = useState("dashboard");
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]); // New state for suppliers
    const [cart, setCart] = useState([]);
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

    const [isProductFormOpen, setIsProductFormOpen] = useState(false); // New state for modal visibility
    const [editingProduct, setEditingProduct] = useState(null); // New state for product being edited

    // Fetch all data on initial load
    useEffect(() => {
        fetchAllData();
    }, []);

    // Effect to update cart items stat
    useEffect(() => {
        setStats((prev) => ({ ...prev, cartItems: cart.length }));
    }, [cart]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchProducts(),
                fetchCategories(),
                fetchSuppliers(), // Fetch suppliers
                fetchStats(),
            ]);
        } catch (error) {
            console.error("Error fetching all data:", error);
            // Optionally, show a user-friendly error message
        }
        setLoading(false);
    };

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from("products")
                .select(
                    `
                    id,
                    name,
                    sku,
                    sell_price,
                    stock,
                    min_stock,
                    buy_price,
                    is_active,
                    barcode,
                    category_id,
                    categories(name),
                    supplier_id,
                    suppliers(name)
                `,
                )
                .order("name");

            if (error) throw error;
            setProducts(data || []);
            console.log("Products loaded:", data?.length || 0);
        } catch (error) {
            console.error("Error fetching products:", error);
            // Handle error, e.g., display a message to the user
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name")
                .eq("is_active", true)
                .order("name");

            if (error) throw error;
            setCategories(data || []);
            console.log("Categories loaded:", data?.length || 0);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const { data, error } = await supabase
                .from("suppliers")
                .select("id, name")
                .eq("is_active", true)
                .order("name");

            if (error) throw error;
            setSuppliers(data || []);
            console.log("Suppliers loaded:", data?.length || 0);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    const fetchStats = async () => {
        try {
            // Get all ACTIVE products for statistics
            const { data: allActiveProducts, error: productsError } =
                await supabase
                    .from("products")
                    .select("id, stock, min_stock")
                    .eq("is_active", true); // Only count active products for dashboard stats

            if (productsError) throw productsError;

            // Get all ACTIVE categories for statistics
            const { data: allActiveCategories, error: categoriesError } =
                await supabase
                    .from("categories")
                    .select("id")
                    .eq("is_active", true); // Only count active categories

            if (categoriesError) throw categoriesError;

            // Filter low stock products from active products
            const lowStockItems =
                allActiveProducts?.filter(
                    (product) => product.stock <= product.min_stock,
                ) || [];

            setStats((prev) => ({
                ...prev, // Keep cartItems from previous state
                totalProducts: allActiveProducts?.length || 0,
                totalCategories: allActiveCategories?.length || 0,
                lowStock: lowStockItems.length,
            }));

            setLowStockProducts(lowStockItems);
            console.log("Stats updated:", {
                products: allActiveProducts?.length || 0,
                categories: allActiveCategories?.length || 0,
                lowStock: lowStockItems.length,
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    // Cart functions
    const addToCart = (product) => {
        // Ensure product is active before adding to cart
        if (!product.is_active) {
            alert(
                `Produk ${product.name} tidak aktif dan tidak bisa ditambahkan ke keranjang.`,
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
                    `Stok untuk ${product.name} tidak mencukupi. Hanya tersedia ${product.stock} unit.`,
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
                alert(`Stok untuk ${product.name} habis.`);
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
                `Stok untuk ${originalProduct.name} hanya ${originalProduct.stock}.`,
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

    // Filter products for POS display (only active products)
    const filteredProducts = products.filter((product) => {
        const matchesSearch = searchTerm
            ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.sku.toLowerCase().includes(searchTerm.toLowerCase())
            : true;
        const matchesCategory =
            selectedCategory === "" ||
            product.category_id.toString() === selectedCategory;

        return product.is_active && matchesSearch && matchesCategory; // Only show active products in POS
    });

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Process payment
    const processPayment = async (paymentData) => {
        if (cart.length === 0) {
            alert("Keranjang belanja kosong. Silakan tambahkan produk.");
            return false;
        }

        try {
            // Create transaction
            const { data: transaction, error: transactionError } =
                await supabase
                    .from("transaction")
                    .insert([
                        {
                            transaction_code: `TRX-${Date.now()}`,
                            customer_name: paymentData.customerName || "Guest",
                            total_amount: getTotalAmount(),
                            payment_method: paymentData.method,
                            payment_amount: paymentData.amount,
                            change_amount: paymentData.change,
                            discount_amount: 0, // Placeholder for now, will be dynamic
                            status: "completed",
                        },
                    ])
                    .select()
                    .single();

            if (transactionError) throw transactionError;

            // Create transaction items
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

            // Update product stock
            for (const item of cart) {
                const { error: stockError } = await supabase
                    .from("products")
                    .update({ stock: item.stock - item.quantity })
                    .eq("id", item.id);

                if (stockError) throw stockError;
            }

            // Clear cart and refresh data
            clearCart();
            await fetchAllData(); // Re-fetch all data to update stats and product list

            alert("Transaksi berhasil diproses!");
            return true;
        } catch (error) {
            console.error("Error processing payment:", error);
            alert("Gagal memproses transaksi: " + error.message);
            return false;
        }
    };

    // --- Product Form Handlers ---
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
                // Update existing product
                const { error: updateError } = await supabase
                    .from("products")
                    .update(productData)
                    .eq("id", id);
                error = updateError;
            } else {
                // Insert new product
                const { error: insertError } = await supabase
                    .from("products")
                    .insert([productData]);
                error = insertError;
            }

            if (error) throw error;

            alert(`Produk berhasil ${id ? "diperbarui" : "ditambahkan"}!`);
            closeProductForm();
            await fetchAllData(); // Refresh all data including products
        } catch (error) {
            console.error("Error saving product:", error);
            alert(`Gagal menyimpan produk: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (productId, productName) => {
        if (
            window.confirm(
                `Apakah Anda yakin ingin menghapus produk "${productName}"? (Ini akan menonaktifkan produk, tidak menghapusnya secara permanen)`,
            )
        ) {
            setLoading(true);
            try {
                // Soft delete: update is_active to false
                const { error } = await supabase
                    .from("products")
                    .update({ is_active: false })
                    .eq("id", productId);

                if (error) throw error;

                alert(`Produk "${productName}" berhasil dinonaktifkan.`);
                await fetchAllData(); // Refresh list
            } catch (error) {
                console.error("Error deleting product:", error);
                alert(`Gagal menghapus produk: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading BJS RACING POS...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <Package className="h-8 w-8 text-blue-600 mr-3" />
                            <h1 className="text-2xl font-bold text-gray-900">
                                BJS RACING POS
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center bg-blue-100 px-3 py-1 rounded-full">
                                <ShoppingCart className="h-4 w-4 text-blue-600 mr-1" />
                                <span className="text-sm font-medium text-blue-600">
                                    {stats.cartItems}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {["dashboard", "pos", "produk"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                                    activeTab === tab
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                {tab === "pos" ? "Point of Sale" : tab}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {activeTab === "dashboard" && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Dashboard
                        </h2>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <Package className="h-8 w-8 text-blue-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            Total Produk
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats.totalProducts}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <Users className="h-8 w-8 text-green-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            Kategori
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats.totalCategories}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <TrendingDown className="h-8 w-8 text-red-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            Stok Rendah
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats.lowStock}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <ShoppingCart className="h-8 w-8 text-purple-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            Item di Keranjang
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats.cartItems}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Low Stock Products */}
                        {lowStockProducts.length > 0 && (
                            <div className="bg-white rounded-lg shadow">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Produk Stok Rendah
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "pos" && (
                    <div className="space-y-6">
                        {" "}
                        {/* Removed grid cols to make it vertical stack */}
                        {/* Search and Category Filter Section */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        name="search"
                                        placeholder="Cari produk atau SKU..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <select
                                name="categoryFilter"
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={selectedCategory}
                                onChange={(e) =>
                                    setSelectedCategory(e.target.value)
                                }
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
                        {/* Product Grid Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {" "}
                            {/* Added margin bottom */}
                            {filteredProducts.map((product) => {
                                const itemInCart = cart.find(
                                    (item) => item.id === product.id,
                                );
                                return (
                                    <div
                                        key={product.id}
                                        className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-gray-900 text-sm">
                                                {product.name}
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {product.sku}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 mb-2">
                                            {product.categories?.name ||
                                                "Kategori tidak ditemukan"}
                                        </p>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-lg font-bold text-green-600">
                                                {formatCurrency(
                                                    product.sell_price,
                                                )}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Stok: {product.stock}
                                            </span>
                                        </div>
                                        {itemInCart ? (
                                            <div className="flex items-center justify-center space-x-2 w-full">
                                                <button
                                                    onClick={() =>
                                                        updateCartQuantity(
                                                            product.id,
                                                            itemInCart.quantity -
                                                                1,
                                                        )
                                                    }
                                                    className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={
                                                        itemInCart.quantity <= 0
                                                    }
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="w-12 text-center font-bold text-lg">
                                                    {itemInCart.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateCartQuantity(
                                                            product.id,
                                                            itemInCart.quantity +
                                                                1,
                                                        )
                                                    }
                                                    className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                disabled={product.stock === 0}
                                                className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                                                    product.stock === 0
                                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                                }`}
                                            >
                                                {product.stock === 0
                                                    ? "Stok Habis"
                                                    : "Tambah ke Keranjang"}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-8">
                                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    Tidak ada produk ditemukan
                                </p>
                            </div>
                        )}
                        {/* Cart Section - Moved to below products */}
                        <div className="bg-white rounded-lg shadow p-6 mt-6">
                            {" "}
                            {/* Added margin top */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Keranjang
                                </h3>
                                {cart.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            {cart.length === 0 ? (
                                <div className="text-center py-8">
                                    <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">
                                        Keranjang kosong
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
                                            <span className="text-lg font-medium text-gray-900">
                                                Total:
                                            </span>
                                            <span className="text-xl font-bold text-green-600">
                                                {formatCurrency(
                                                    getTotalAmount(),
                                                )}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const paymentData = {
                                                    method: "Tunai",
                                                    amount: getTotalAmount(),
                                                    change: 0,
                                                    customerName: "Guest",
                                                };
                                                processPayment(paymentData);
                                            }}
                                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700"
                                        >
                                            Proses Pembayaran
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "produk" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-gray-900">
                                Manajemen Produk
                            </h2>
                            <button
                                onClick={() => openProductForm()} // Open form for new product
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Produk
                            </button>
                        </div>

                        {/* Product Table */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Produk
                                            </th>
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
                                        {products.map((product) => (
                                            <tr
                                                key={product.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {product.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.sku}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.categories?.name ||
                                                        "Kategori tidak ditemukan"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.suppliers?.name ||
                                                        "Tidak ada supplier"}
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {products.length === 0 && (
                            <div className="text-center py-8">
                                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    Tidak ada produk ditemukan
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {isProductFormOpen && (
                <ProductFormModal
                    product={editingProduct}
                    categories={categories}
                    suppliers={suppliers}
                    onSave={saveProduct}
                    onClose={closeProductForm}
                />
            )}
        </div>
    );
}

export default App;
