import { useState, useEffect, useCallback } from 'react';
import { productAPI } from '../../services/api';
import { HiPlus, HiPencil, HiTrash, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './Shopkeeper.css';

const UNITS = ['piece', 'kg', 'litre', 'dozen', 'pack', 'box', 'metre'];
const emptyForm = { name: '', description: '', price: '', stock: '', category: 'General', unit: 'piece' };

const InventoryManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await productAPI.getMyInventory();
      setProducts(data.products);
    } catch (err) { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p) => {
    setEditId(p._id);
    setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, category: p.category || 'General', unit: p.unit || 'piece' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (editId) {
        await productAPI.update(editId, payload);
        toast.success('Product updated');
      } else {
        await productAPI.create(payload);
        toast.success('Product added');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) { toast.error('Failed to delete'); }
  };

  return (
    <div className="shopkeeper-page container fade-in">
      <div className="page-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><HiPlus /> Add Product</button>
      </div>

      {loading ? (
        <div className="inventory-grid">{[1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 160 }} />)}</div>
      ) : products.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📦</div><h3>No products</h3><p>Add your first product</p></div>
      ) : (
        <div className="inventory-grid">
          {products.map((p) => (
            <div key={p._id} className="inventory-card card">
              <div className="inv-top">
                <h3 className="inv-name">{p.name}</h3>
                <div className="inv-actions">
                  <button className="inv-btn edit" onClick={() => openEdit(p)}><HiPencil /></button>
                  <button className="inv-btn delete" onClick={() => handleDelete(p._id)}><HiTrash /></button>
                </div>
              </div>
              {p.description && <p className="inv-desc">{p.description}</p>}
              <div className="inv-meta">
                <span className="inv-price">₹{p.price.toFixed(2)}</span>
                <span className="inv-unit">per {p.unit}</span>
              </div>
              <div className="inv-bottom">
                <span className={`inv-stock ${p.stock < 5 ? 'low' : ''}`}>Stock: {p.stock}</span>
                <span className="inv-category">{p.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Product' : 'Add Product'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}><HiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Name</label><input name="name" className="form-control" value={form.name} onChange={handleChange} required /></div>
              <div className="form-group"><label>Description</label><textarea name="description" className="form-control" rows={2} value={form.description} onChange={handleChange} /></div>
              <div className="form-row">
                <div className="form-group"><label>Price (₹)</label><input name="price" type="number" step="0.01" min="0" className="form-control" value={form.price} onChange={handleChange} required /></div>
                <div className="form-group"><label>Stock</label><input name="stock" type="number" min="0" className="form-control" value={form.stock} onChange={handleChange} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Category</label><input name="category" className="form-control" value={form.category} onChange={handleChange} /></div>
                <div className="form-group"><label>Unit</label><select name="unit" className="form-control" value={form.unit} onChange={handleChange}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select></div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
                {submitting ? 'Saving...' : editId ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
