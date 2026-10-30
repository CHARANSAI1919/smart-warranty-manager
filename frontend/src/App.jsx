
import { useCallback, useEffect, useState } from "react";
import api from "./api";
import "./App.css";

const emptyProduct = {
  name: "",
  brand: "",
  category: "Electronics",
  price: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  warrantyMonths: "12",
  warrantyExpiry: "",
};

const emptyRepair = {
  repairDate: new Date().toISOString().slice(0, 10),
  description: "",
  cost: "",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getWarrantyStatus(expiryDate) {
  if (!expiryDate) return "Unknown";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate + "T00:00:00");

  if (Number.isNaN(expiry.getTime())) return "Unknown";
  if (expiry < today) return "Expired";

  return "Active";
}

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [products, setProducts] = useState([]);
  const [repairs, setRepairs] = useState([]);

  const [activePage, setActivePage] = useState("Dashboard");
  const [authError, setAuthError] = useState("");
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [authLoading, setAuthLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [repairsLoading, setRepairsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [repairForm, setRepairForm] = useState(emptyRepair);
  const [showRepairForm, setShowRepairForm] = useState(false);

  const logout = useCallback((message) => {
    localStorage.removeItem("token");
    setToken("");
    setProducts([]);
    setRepairs([]);
    setSelectedProduct(null);
    setPageError(message || "");
    setSuccessMessage("");
  }, []);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setPageError("");

    try {
      const response = await api.get("/products");

      setProducts(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 401 ||
          error.response.status === 403)
      ) {
        logout("Your session is invalid or expired. Please log in again.");
      } else {
        setPageError(
          error.response && error.response.data
            ? String(
                typeof error.response.data === "string"
                  ? error.response.data
                  : "Could not load products. Please try again."
              )
            : "Could not connect to the backend. Check that Spring Boot is running."
        );
      }
    } finally {
      setProductsLoading(false);
    }
  }, [logout]);

  const loadRepairs = useCallback(async (product) => {
    if (!product) return;

    setRepairsLoading(true);
    setPageError("");

    try {
      const response = await api.get(
        "/products/" + product.id + "/repairs"
      );

      setRepairs(
        Array.isArray(response.data) ? response.data : []
      );
      setSelectedProduct(product);
      setActivePage("Repair History");
    } catch (error) {
      setPageError(
        error.response && error.response.status === 403
          ? "You are not allowed to view repairs for this product."
          : "Could not load repair history. Please try again."
      );
    } finally {
      setRepairsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadProducts();
    }
  }, [token, loadProducts]);

  async function handleAuth(event) {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (isRegister) {
        await api.post("/users/register", {
          name: name.trim(),
          email: email.trim(),
          password,
        });
      }

      const response = await api.post("/users/login", {
        email: email.trim(),
        password,
      });

      const receivedToken = response.data;

      if (
        typeof receivedToken !== "string" ||
        !receivedToken.trim()
      ) {
        throw new Error(
          "Login did not return a valid token. Check your backend login response."
        );
      }

      localStorage.setItem("token", receivedToken);
      setToken(receivedToken);
      setPassword("");
      setAuthError("");
    } catch (error) {
      setAuthError(
        error.response && error.response.data
          ? String(
              typeof error.response.data === "string"
                ? error.response.data
                : "Authentication failed. Please check your details."
            )
          : error.message || "Authentication failed. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  }

  function startAddProduct() {
    setEditingId(null);
    setProductForm({ ...emptyProduct });
    setShowProductForm(true);
    setPageError("");
    setSuccessMessage("");
  }

  function startEditProduct(product) {
    setEditingId(product.id);
    setProductForm({
      name: product.name || "",
      brand: product.brand || "",
      category: product.category || "Electronics",
      price: String(product.price ?? ""),
      purchaseDate: product.purchaseDate || "",
      warrantyMonths: String(product.warrantyMonths ?? 12),
      warrantyExpiry: product.warrantyExpiry || "",
    });
    setShowProductForm(true);
    setPageError("");
    setSuccessMessage("");
  }

  function updateProductField(event) {
    const field = event.target.name;
    const value = event.target.value;

    setProductForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function calculateWarrantyExpiry(purchaseDate, months) {
    if (!purchaseDate || !months) return "";

    const date = new Date(purchaseDate + "T00:00:00");
    if (Number.isNaN(date.getTime())) return "";

    const originalDay = date.getDate();

    date.setDate(1);
    date.setMonth(date.getMonth() + Number(months));

    const lastDayOfTargetMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

    date.setDate(Math.min(originalDay, lastDayOfTargetMonth));

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  async function handleSaveProduct(event) {
    event.preventDefault();
    setSaving(true);
    setPageError("");
    setSuccessMessage("");

    const productData = {
      name: productForm.name.trim(),
      brand: productForm.brand.trim(),
      category: productForm.category,
      price: Number(productForm.price),
      purchaseDate: productForm.purchaseDate,
      warrantyMonths: Number(productForm.warrantyMonths),
      warrantyExpiry:
        productForm.warrantyExpiry ||
        calculateWarrantyExpiry(
          productForm.purchaseDate,
          productForm.warrantyMonths
        ),
    };

    try {
      if (editingId !== null) {
        await api.put(
          "/products/" + editingId,
          productData
        );
        setSuccessMessage("Product updated successfully.");
      } else {
        await api.post("/products", productData);
        setSuccessMessage("Product added successfully.");
      }

      setShowProductForm(false);
      setEditingId(null);
      setProductForm({ ...emptyProduct });
      await loadProducts();
      setActivePage("My Products");
    } catch (error) {
      setPageError(
        error.response && error.response.data
          ? String(
              typeof error.response.data === "string"
                ? error.response.data
                : "Could not save the product. Please check your entries."
            )
          : "Could not save the product. Check your backend connection."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(
      "Delete " + product.name + "? This action cannot be undone."
    );

    if (!confirmed) return;

    setPageError("");
    setSuccessMessage("");

    try {
      await api.delete("/products/" + product.id);

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );

      if (selectedProduct && selectedProduct.id === product.id) {
        setSelectedProduct(null);
        setRepairs([]);
      }

      setSuccessMessage("Product deleted successfully.");
    } catch (error) {
      setPageError(
        error.response && error.response.status === 403
          ? "You are not allowed to delete this product."
          : "Could not delete the product. Please try again."
      );
    }
  }

  async function handleSaveRepair(event) {
    event.preventDefault();

    if (!selectedProduct) {
      setPageError("Select a product before adding a repair.");
      return;
    }

    setSaving(true);
    setPageError("");
    setSuccessMessage("");

    try {
      await api.post(
        "/products/" + selectedProduct.id + "/repairs",
        {
          repairDate: repairForm.repairDate,
          description: repairForm.description.trim(),
          cost: Number(repairForm.cost),
        }
      );

      setRepairForm({ ...emptyRepair });
      setShowRepairForm(false);

      await loadRepairs(selectedProduct);
      setSuccessMessage("Repair record added successfully.");
    } catch (error) {
      setPageError(
        error.response && error.response.data
          ? String(
              typeof error.response.data === "string"
                ? error.response.data
                : "Could not add the repair record."
            )
          : "Could not add the repair record. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <main className="auth-page">
        <form className="auth-card" onSubmit={handleAuth}>
          <div className="brand-icon">W</div>
          <h1>WarrantyWise</h1>
          <p>Manage your purchases and warranties.</p>

          {isRegister && (
            <label>
              Full name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete={
                isRegister ? "new-password" : "current-password"
              }
            />
          </label>

          {authError && (
            <p className="auth-error">{authError}</p>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={authLoading}
          >
            {authLoading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Log in"}
          </button>

          <p>
            {isRegister
              ? "Already registered?"
              : "New to WarrantyWise?"}{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setIsRegister((current) => !current);
                setAuthError("");
              }}
            >
              {isRegister ? "Log in" : "Create account"}
            </button>
          </p>
        </form>
      </main>
    );
  }

  const totalValue = products.reduce(
    (sum, product) => sum + Number(product.price || 0),
    0
  );

  const activeWarranties = products.filter(
    (product) => getWarrantyStatus(product.warrantyExpiry) === "Active"
  ).length;

  const navigation = [
    "Dashboard",
    "My Products",
    "Repair History",
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">W</div>
          <div>
            <h2>WarrantyWise</h2>
            <span>Purchase manager</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav>
          {navigation.map((page) => (
            <button
              key={page}
              type="button"
              className={
                "nav-item" + (activePage === page ? " active" : "")
              }
              onClick={() => {
                setActivePage(page);
                setPageError("");
                setSuccessMessage("");

                if (page === "Repair History") {
                  setSelectedProduct(null);
                  setRepairs([]);
                }
              }}
            >
              <span className="nav-icon">
                {page === "Dashboard"
                  ? "⌂"
                  : page === "My Products"
                    ? "▣"
                    : "↻"}
              </span>
              {page}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">U</div>
          <div>
            <strong>My Account</strong>
            <span>Warranty manager</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">
              Workspace / {activePage}
            </span>
            <h1>{activePage}</h1>
            <p>Your purchases and warranty overview</p>
          </div>

          <div className="header-actions">
            <button
              className="primary-button"
              type="button"
              onClick={startAddProduct}
            >
              + Add product
            </button>

            <button
              className="secondary-button"
              type="button"
              onClick={() => logout("")}
            >
              Log out
            </button>
          </div>
        </header>

        {pageError && (
          <div className="message error-message" role="alert">
            {pageError}
            <button
              type="button"
              onClick={() => setPageError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div className="message success-message" role="status">
            {successMessage}
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {activePage === "Dashboard" && (
          <>
            <section className="welcome-banner">
              <div>
                <span className="eyebrow">
                  YOUR PURCHASES, ORGANIZED
                </span>
                <h2>Everything you own, in one place.</h2>
                <p>
                  Track purchases, monitor warranty dates, and keep
                  repair records organized.
                </p>
              </div>
              <div className="banner-art">◈</div>
            </section>

            <section className="stats-grid">
              <StatCard
                label="Total products"
                value={products.length}
                note="Registered purchases"
                icon="▣"
              />
              <StatCard
                label="Total purchase value"
                value={formatCurrency(totalValue)}
                note="Across your products"
                icon="₹"
              />
              <StatCard
                label="Active warranties"
                value={activeWarranties}
                note="Not yet expired"
                icon="✓"
              />
            </section>

            <section className="panel page-panel">
              <div className="panel-heading">
                <div>
                  <h2>Recent purchases</h2>
                  <p>Your registered products</p>
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setActivePage("My Products")}
                >
                  View all →
                </button>
              </div>

              {productsLoading ? (
                <p>Loading products...</p>
              ) : products.length === 0 ? (
                <EmptyState
                  text="No products registered yet."
                  action="Add your first product"
                  onAction={startAddProduct}
                />
              ) : (
                <ProductList
                  products={products.slice(0, 3)}
                  onEdit={startEditProduct}
                  onDelete={handleDeleteProduct}
                  onRepairs={loadRepairs}
                />
              )}
            </section>
          </>
        )}

        {activePage === "My Products" && (
          <section className="panel page-panel">
            <div className="panel-heading">
              <div>
                <h2>My products</h2>
                <p>Products registered to your account</p>
              </div>
              <span className="count-pill">
                {products.length} products
              </span>
            </div>

            {productsLoading ? (
              <p>Loading products...</p>
            ) : products.length === 0 ? (
              <EmptyState
                text="No products registered yet."
                action="Add your first product"
                onAction={startAddProduct}
              />
            ) : (
              <ProductList
                products={products}
                onEdit={startEditProduct}
                onDelete={handleDeleteProduct}
                onRepairs={loadRepairs}
              />
            )}
          </section>
        )}

        {activePage === "Repair History" && (
          <section className="panel page-panel">
            <div className="panel-heading">
              <div>
                <h2>Repair history</h2>
                <p>Maintenance and repair records</p>
              </div>

              {selectedProduct && (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => {
                    setRepairForm({ ...emptyRepair });
                    setShowRepairForm((current) => !current);
                  }}
                >
                  + Add repair
                </button>
              )}
            </div>

            {selectedProduct ? (
              <p className="subheading">
                Repairs for: <strong>{selectedProduct.name}</strong>
              </p>
            ) : (
              <div className="field-group">
                <label htmlFor="repair-product">
                  Select a product
                </label>
                <select
                  id="repair-product"
                  value=""
                  onChange={(event) => {
                    const product = products.find(
                      (item) =>
                        String(item.id) === event.target.value
                    );
                    if (product) loadRepairs(product);
                  }}
                >
                  <option value="">Choose a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showRepairForm && selectedProduct && (
              <form
                className="data-form"
                onSubmit={handleSaveRepair}
              >
                <h3>Add repair record</h3>

                <div className="form-grid">
                  <div className="field-group">
                    <label htmlFor="repairDate">Repair date</label>
                    <input
                      id="repairDate"
                      type="date"
                      value={repairForm.repairDate}
                      onChange={(event) =>
                        setRepairForm((current) => ({
                          ...current,
                          repairDate: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="repairCost">Repair cost (₹)</label>
                    <input
                      id="repairCost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={repairForm.cost}
                      onChange={(event) =>
                        setRepairForm((current) => ({
                          ...current,
                          cost: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="field-group full-width">
                    <label htmlFor="repairDescription">
                      Description
                    </label>
                    <textarea
                      id="repairDescription"
                      value={repairForm.description}
                      onChange={(event) =>
                        setRepairForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      required
                      rows="3"
                      placeholder="Describe the repair performed"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save repair"}
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setShowRepairForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {repairsLoading ? (
              <p>Loading repair history...</p>
            ) : !selectedProduct ? (
              <p>Select a product above to view its repairs.</p>
            ) : repairs.length === 0 ? (
              <EmptyState
                text="No repair records for this product yet."
                action="Add repair record"
                onAction={() => setShowRepairForm(true)}
              />
            ) : (
              <RepairList repairs={repairs} />
            )}
          </section>
        )}
      </main>

      {showProductForm && (
        <div className="modal-backdrop">
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
          >
            <div className="panel-heading">
              <div>
                <h2 id="product-form-title">
                  {editingId !== null ? "Edit product" : "Add product"}
                </h2>
                <p>Enter your purchase and warranty details.</p>
              </div>
              <button
                className="close-button"
                type="button"
                onClick={() => setShowProductForm(false)}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form className="data-form" onSubmit={handleSaveProduct}>
              <div className="form-grid">
                <div className="field-group">
                  <label htmlFor="productName">Product name</label>
                  <input
                    id="productName"
                    name="name"
                    value={productForm.name}
                    onChange={updateProductField}
                    required
                    maxLength="150"
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="brand">Brand</label>
                  <input
                    id="brand"
                    name="brand"
                    value={productForm.brand}
                    onChange={updateProductField}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={productForm.category}
                    onChange={updateProductField}
                    required
                  >
                    <option>Electronics</option>
                    <option>Home Appliances</option>
                    <option>Furniture</option>
                    <option>Automotive</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="field-group">
                  <label htmlFor="price">Purchase price (₹)</label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={updateProductField}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="purchaseDate">Purchase date</label>
                  <input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    value={productForm.purchaseDate}
                    onChange={updateProductField}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="warrantyMonths">
                    Warranty duration (months)
                  </label>
                  <input
                    id="warrantyMonths"
                    name="warrantyMonths"
                    type="number"
                    min="0"
                    max="1200"
                    value={productForm.warrantyMonths}
                    onChange={updateProductField}
                    required
                  />
                </div>

                <div className="field-group full-width">
                  <label htmlFor="warrantyExpiry">
                    Warranty expiry date
                  </label>
                  <input
                    id="warrantyExpiry"
                    name="warrantyExpiry"
                    type="date"
                    value={
                      productForm.warrantyExpiry ||
                      calculateWarrantyExpiry(
                        productForm.purchaseDate,
                        productForm.warrantyMonths
                      )
                    }
                    onChange={updateProductField}
                    required
                  />
                  <small>
                    The expiry date is calculated automatically from
                    the purchase date and duration. You can change it.
                  </small>
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save changes"
                      : "Add product"}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowProductForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, note, icon }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-note">{note}</span>
    </article>
  );
}

function EmptyState({ text, action, onAction }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
      {action && (
        <button
          className="primary-button"
          type="button"
          onClick={onAction}
        >
          {action}
        </button>
      )}
    </div>
  );
}

function ProductList({ products, onEdit, onDelete, onRepairs }) {
  return (
    <div className="list-container">
      {products.map((product) => (
        <article className="product-row" key={product.id}>
          <div className="product-icon">▣</div>

          <div className="product-info">
            <strong>{product.name}</strong>
            <span>
              {product.brand || "—"} · {product.category || "—"}
            </span>
            <small>
              Purchased: {product.purchaseDate || "Not specified"}
            </small>
            <small>
              Warranty expires: {product.warrantyExpiry || "Not specified"}
            </small>
            <small>
              Warranty duration: {product.warrantyMonths ?? "—"} months
            </small>
            <span
              className={
                "status-pill " +
                getWarrantyStatus(product.warrantyExpiry).toLowerCase()
              }
            >
              {getWarrantyStatus(product.warrantyExpiry)} warranty
            </span>

            <div className="product-actions">
              <button
                className="text-button"
                type="button"
                onClick={() => onEdit(product)}
              >
                Edit
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => onRepairs(product)}
              >
                Repair history
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={() => onDelete(product)}
              >
                Delete
              </button>
            </div>
          </div>

          <strong className="product-price">
            {formatCurrency(product.price)}
          </strong>
        </article>
      ))}
    </div>
  );
}

function RepairList({ repairs }) {
  return (
    <div className="list-container">
      {repairs.map((repair) => (
        <article
          className="repair-row"
          key={repair.id}
        >
          <div className="repair-icon">↻</div>
          <div className="repair-info">
            <strong>{repair.description}</strong>
            <span>
              {repair.product && repair.product.name
                ? repair.product.name
                : "Product repair"}
            </span>
            <small>{repair.repairDate || "Date not specified"}</small>
          </div>
          <strong className="product-price">
            {formatCurrency(repair.cost)}
          </strong>
        </article>
      ))}
    </div>
  );
}

export default App;
