import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { HiShoppingCart, HiUser, HiLogout, HiMenu, HiX } from "react-icons/hi";
import { useState } from "react";
import "./Navbar.css";

const Navbar = () => {
  const { user, isAuthenticated, isCustomer, isShopkeeper, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar glass">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🛒</span>
          <span className="brand-text">
            Local<span className="brand-highlight">Link</span>
          </span>
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <HiX /> : <HiMenu />}
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          {isAuthenticated ? (
            <>
              {isCustomer && (
                <>
                  <Link
                    to="/customer/browse"
                    className={`nav-link ${isActive("/customer/browse") ? "active" : ""}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiShoppingCart /> Browse
                  </Link>
                  <Link
                    to="/customer/orders"
                    className={`nav-link ${isActive("/customer/orders") ? "active" : ""}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                </>
              )}
              {isShopkeeper && (
                <>
                  <Link
                    to="/shopkeeper/dashboard"
                    className={`nav-link ${isActive("/shopkeeper/dashboard") ? "active" : ""}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/shopkeeper/inventory"
                    className={`nav-link ${isActive("/shopkeeper/inventory") ? "active" : ""}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Inventory
                  </Link>
                  <Link
                    to="/shopkeeper/orders"
                    className={`nav-link ${isActive("/shopkeeper/orders") ? "active" : ""}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Orders
                  </Link>
                </>
              )}

              <div className="nav-user-section">
                <div
                  className={`connection-dot ${isConnected ? "connected" : ""}`}
                  title={
                    isConnected
                      ? "Real-time: Connected"
                      : "Real-time: Disconnected"
                  }
                />
                <span className="nav-user">
                  <HiUser /> {user?.name}
                </span>
                <span className="nav-role-badge">{user?.role}</span>
                <button
                  className="btn btn-secondary btn-sm nav-logout"
                  onClick={handleLogout}
                >
                  <HiLogout /> Logout
                </button>
              </div>
            </>
          ) : (
            <div className="nav-auth-links">
              <Link
                to="/login"
                className="btn btn-secondary btn-sm"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
