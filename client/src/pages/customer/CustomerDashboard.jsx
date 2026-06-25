import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shopAPI } from '../../services/api';
import { HiSearch, HiLocationMarker, HiStar } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './Customer.css';

const CATEGORIES = ['All', 'Grocery', 'Electronics', 'Clothing', 'Pharmacy', 'Bakery', 'Stationery', 'Hardware', 'Other'];

const CATEGORY_EMOJIS = {
  Grocery: '🥬',
  Electronics: '📱',
  Clothing: '👕',
  Pharmacy: '💊',
  Bakery: '🍞',
  Stationery: '📝',
  Hardware: '🔧',
  Other: '📦',
};

const CustomerDashboard = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const fetchShops = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category !== 'All') params.category = category;
      if (search.trim()) params.search = search.trim();

      const { data } = await shopAPI.getAll(params);
      setShops(data.shops);
    } catch (err) {
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchShops();
  };

  return (
    <div className="customer-page container fade-in">
      <div className="page-hero">
        <h1 className="page-title">
          Discover <span className="highlight">Local Shops</span>
        </h1>
        <p className="page-subtitle">
          Browse shops near you and order products with real-time tracking
        </p>
      </div>

      {/* Search Bar */}
      <form className="search-bar glass" onSubmit={handleSearch}>
        <HiSearch className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search shops..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Search
        </button>
      </form>

      {/* Category Filter */}
      <div className="category-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-tab ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat !== 'All' && <span className="cat-emoji">{CATEGORY_EMOJIS[cat]}</span>}
            {cat}
          </button>
        ))}
      </div>

      {/* Shops Grid */}
      {loading ? (
        <div className="shops-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="shop-card-skeleton skeleton" />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏪</div>
          <h3>No shops found</h3>
          <p>Try a different search or category</p>
        </div>
      ) : (
        <div className="shops-grid">
          {shops.map((shop, idx) => (
            <Link
              to={`/customer/shop/${shop._id}`}
              key={shop._id}
              className="shop-card card"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="shop-card-banner">
                <span className="shop-category-emoji">
                  {CATEGORY_EMOJIS[shop.category] || '📦'}
                </span>
              </div>
              <div className="shop-card-body">
                <h3 className="shop-card-name">{shop.name}</h3>
                <p className="shop-card-desc">
                  {shop.description || 'Welcome to our shop!'}
                </p>
                <div className="shop-card-meta-row">
                  <span className="shop-card-category">
                    {shop.category}
                  </span>
                  {shop.rating > 0 && (
                    <span className="shop-card-rating">
                      <HiStar /> {shop.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                {shop.address?.city && (
                  <div className="shop-card-location">
                    <HiLocationMarker /> {shop.address.city}
                    {shop.address.state ? `, ${shop.address.state}` : ''}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
