import { useState, useEffect, useCallback, useRef } from 'react';
import { HiLockClosed, HiShieldCheck } from 'react-icons/hi';
import './PaymentGateway.css';

// ─── Constants ──────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'netbanking', label: 'Bank', icon: '🏦' },
  { id: 'wallet', label: 'Wallet', icon: '👛' },
];

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: '🟢' },
  { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
  { id: 'paytm', name: 'Paytm', icon: '🔵' },
];

const BANKS = [
  { id: 'sbi', name: 'State Bank of India', color: '#1a5276', initial: 'SBI' },
  { id: 'hdfc', name: 'HDFC Bank', color: '#004c8c', initial: 'HD' },
  { id: 'icici', name: 'ICICI Bank', color: '#f58220', initial: 'IC' },
  { id: 'axis', name: 'Axis Bank', color: '#97144d', initial: 'AX' },
  { id: 'kotak', name: 'Kotak Mahindra', color: '#ed1c24', initial: 'KM' },
];

const WALLETS = [
  { id: 'paytm', name: 'Paytm', icon: '🔵' },
  { id: 'mobikwik', name: 'MobiKwik', icon: '🔴' },
  { id: 'freecharge', name: 'FreeCharge', icon: '🟢' },
  { id: 'amazonpay', name: 'Amazon Pay', icon: '🟠' },
];

const PROCESSING_STEPS = [
  'Connecting to payment network...',
  'Authenticating transaction...',
  'Processing payment...',
  'Confirming with bank...',
];

const CONFETTI_COLORS = ['#6c5ce7', '#a855f7', '#ec4899', '#00cec9', '#00b894', '#fdcb6e', '#0984e3'];

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatCardNumber(val) {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

function detectCardType(num) {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return { type: 'Visa', icon: '💳' };
  if (/^5[1-5]/.test(n)) return { type: 'Mastercard', icon: '🔶' };
  if (/^6/.test(n)) return { type: 'RuPay', icon: '🇮🇳' };
  return { type: '', icon: '💳' };
}

function generateTxnId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'TXN';
  for (let i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ─── Component ──────────────────────────────────────────────────────────────
const PaymentGateway = ({ amount, currency = 'INR', shopName, items = [], userName, userEmail, userPhone, onSuccess, onFailure, onClose }) => {
  const [method, setMethod] = useState('upi');
  const [screen, setScreen] = useState('checkout'); // checkout | processing | success | failure

  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(userName || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI state
  const [upiApp, setUpiApp] = useState('');
  const [upiId, setUpiId] = useState('');

  // Bank & Wallet
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');

  // Processing
  const [currentStep, setCurrentStep] = useState(0);
  const [txnId, setTxnId] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 min timer

  const timerRef = useRef(null);

  // ─── Countdown Timer ───────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatCountdown = useCallback((s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }, []);

  // ─── Validation ────────────────────────────────────────────────────────
  const isFormValid = () => {
    switch (method) {
      case 'card':
        return (
          cardNumber.replace(/\s/g, '').length === 16 &&
          cardHolder.trim().length >= 2 &&
          cardExpiry.length === 5 &&
          cardCvv.length >= 3
        );
      case 'upi':
        return upiApp !== '' || (upiId.includes('@') && upiId.length >= 5);
      case 'netbanking':
        return selectedBank !== '';
      case 'wallet':
        return selectedWallet !== '';
      default:
        return false;
    }
  };

  // ─── Process Payment (simulated) ───────────────────────────────────────
  const handlePay = () => {
    const id = generateTxnId();
    setTxnId(id);
    setScreen('processing');
    setCurrentStep(0);

    // Simulate processing steps
    const stepDuration = 900;
    PROCESSING_STEPS.forEach((_, i) => {
      setTimeout(() => setCurrentStep(i + 1), stepDuration * (i + 1));
    });

    // After all steps, show result
    setTimeout(() => {
      clearInterval(timerRef.current);
      setScreen('success');
    }, stepDuration * PROCESSING_STEPS.length + 800);
  };

  // ─── Success callback ─────────────────────────────────────────────────
  const handleSuccessDone = () => {
    if (onSuccess) {
      onSuccess({
        razorpay_order_id: `sim_order_${Date.now()}`,
        razorpay_payment_id: `sim_pay_${txnId}_${Date.now()}`,
        razorpay_signature: `sim_sig_${Date.now()}`,
        txnId,
        method,
      });
    }
  };

  // ─── Render Methods ───────────────────────────────────────────────────
  const renderCardForm = () => {
    const cardType = detectCardType(cardNumber);
    return (
      <div className="pg-form" key="card">
        <div className="pg-card-visual">
          <div className="pg-card-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="pg-card-chip" />
              <span className="pg-card-type">{cardType.icon}</span>
            </div>
            <div className="pg-card-number">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>
            <div className="pg-card-bottom">
              <div className="pg-card-holder">
                CARD HOLDER
                <span>{cardHolder || 'YOUR NAME'}</span>
              </div>
              <div className="pg-card-expiry">
                EXPIRES
                <span>{cardExpiry || 'MM/YY'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pg-input-group">
          <label className="pg-input-label">Card Number</label>
          <input
            className="pg-input"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            maxLength={19}
            inputMode="numeric"
          />
        </div>

        <div className="pg-input-group">
          <label className="pg-input-label">Card Holder Name</label>
          <input
            className="pg-input"
            type="text"
            placeholder="John Doe"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
          />
        </div>

        <div className="pg-input-row">
          <div className="pg-input-group">
            <label className="pg-input-label">Expiry</label>
            <input
              className="pg-input"
              type="text"
              placeholder="MM/YY"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
              maxLength={5}
              inputMode="numeric"
            />
          </div>
          <div className="pg-input-group">
            <label className="pg-input-label">CVV</label>
            <input
              className="pg-input"
              type="password"
              placeholder="•••"
              value={cardCvv}
              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              inputMode="numeric"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderUPIForm = () => (
    <div className="pg-form" key="upi">
      <div className="pg-upi-apps">
        {UPI_APPS.map((app) => (
          <button
            key={app.id}
            className={`pg-upi-app${upiApp === app.id ? ' active' : ''}`}
            onClick={() => { setUpiApp(app.id); setUpiId(''); }}
          >
            <span className="pg-upi-app-icon">{app.icon}</span>
            <span className="pg-upi-app-name">{app.name}</span>
          </button>
        ))}
      </div>

      <div className="pg-or-divider">or enter UPI ID</div>

      <div className="pg-input-group">
        <label className="pg-input-label">UPI ID</label>
        <input
          className="pg-input"
          type="text"
          placeholder="yourname@upi"
          value={upiId}
          onChange={(e) => { setUpiId(e.target.value); setUpiApp(''); }}
        />
      </div>
    </div>
  );

  const renderNetBankingForm = () => (
    <div className="pg-form" key="netbanking">
      <div className="pg-bank-list">
        {BANKS.map((bank) => (
          <button
            key={bank.id}
            className={`pg-bank-item${selectedBank === bank.id ? ' active' : ''}`}
            onClick={() => setSelectedBank(bank.id)}
          >
            <div className="pg-bank-icon" style={{ background: bank.color, color: '#fff', fontSize: '0.65rem' }}>
              {bank.initial}
            </div>
            <span>{bank.name}</span>
            <div className="pg-bank-radio" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderWalletForm = () => (
    <div className="pg-form" key="wallet">
      <div className="pg-wallet-list">
        {WALLETS.map((w) => (
          <button
            key={w.id}
            className={`pg-wallet-item${selectedWallet === w.id ? ' active' : ''}`}
            onClick={() => setSelectedWallet(w.id)}
          >
            <span className="pg-wallet-icon">{w.icon}</span>
            <span>{w.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderMethodForm = () => {
    switch (method) {
      case 'card': return renderCardForm();
      case 'upi': return renderUPIForm();
      case 'netbanking': return renderNetBankingForm();
      case 'wallet': return renderWalletForm();
      default: return null;
    }
  };

  // ─── Confetti ─────────────────────────────────────────────────────────
  const renderConfetti = () => (
    <div className="pg-confetti">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="pg-confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${Math.random() * 1.5}s`,
            animationDuration: `${2 + Math.random() * 1.5}s`,
            width: `${6 + Math.random() * 6}px`,
            height: `${6 + Math.random() * 6}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );

  // ─── Screens ──────────────────────────────────────────────────────────
  if (screen === 'processing') {
    return (
      <div className="pg-overlay">
        <div className="pg-container">
          <div className="pg-processing">
            <div className="pg-spinner" />
            <h3>Processing Payment</h3>
            <p>₹{amount.toFixed(2)} to {shopName}</p>
            <div className="pg-processing-steps">
              {PROCESSING_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`pg-step${i < currentStep ? ' done' : ''}${i === currentStep ? ' active' : ''}`}
                >
                  <div className="pg-step-dot">
                    {i < currentStep ? '✓' : ''}
                  </div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'success') {
    return (
      <div className="pg-overlay">
        <div className="pg-container" style={{ position: 'relative' }}>
          {renderConfetti()}
          <div className="pg-result">
            <div className="pg-result-icon success">✓</div>
            <h3>Payment Successful!</h3>
            <p>₹{amount.toFixed(2)} paid to {shopName}</p>
            <div className="pg-result-txn">Transaction ID: {txnId}</div>
            <button className="pg-result-btn success" onClick={handleSuccessDone}>
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'failure') {
    return (
      <div className="pg-overlay">
        <div className="pg-container">
          <div className="pg-result">
            <div className="pg-result-icon failure">✕</div>
            <h3>Payment Failed</h3>
            <p>Something went wrong. Please try again.</p>
            <div className="pg-result-txn">Reference: {txnId}</div>
            <button
              className="pg-result-btn failure"
              onClick={() => { setScreen('checkout'); setCurrentStep(0); }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Checkout Screen ──────────────────────────────────────────────────
  return (
    <div className="pg-overlay" onClick={onClose}>
      <div className="pg-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pg-header">
          <div className="pg-brand">
            <div className="pg-brand-icon">
              <HiShieldCheck />
            </div>
            <div className="pg-brand-text">
              <h3>Local Link Pay</h3>
              <span>Secure Checkout</span>
            </div>
          </div>
          <button className="pg-close" onClick={onClose}>✕</button>
        </div>

        {/* Order Summary */}
        <div className="pg-summary">
          {items.slice(0, 3).map((item, i) => (
            <div key={i} className="pg-summary-row">
              <span>{item.name} × {item.quantity}</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {items.length > 3 && (
            <div className="pg-summary-row">
              <span style={{ fontStyle: 'italic' }}>+{items.length - 3} more item(s)</span>
              <span></span>
            </div>
          )}
          <div className="pg-summary-row total">
            <span>Total Payable</span>
            <span>₹{amount.toFixed(2)}</span>
          </div>
          <div className="pg-timer">
            <span className="pg-timer-icon">⏱️</span>
            <span>Complete payment in {formatCountdown(countdown)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="pg-methods">
          <div className="pg-methods-title">Select Payment Method</div>
          <div className="pg-method-tabs">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                className={`pg-method-tab${method === m.id ? ' active' : ''}`}
                onClick={() => setMethod(m.id)}
              >
                <span className="pg-method-tab-icon">{m.icon}</span>
                <span className="pg-method-tab-label">{m.label}</span>
              </button>
            ))}
          </div>

          {renderMethodForm()}
        </div>

        {/* Pay Button */}
        <div className="pg-footer">
          <button
            className="pg-pay-btn"
            disabled={!isFormValid() || countdown === 0}
            onClick={handlePay}
          >
            <span className="pg-btn-shimmer" />
            <HiLockClosed />
            Pay ₹{amount.toFixed(2)}
          </button>
          <div className="pg-secure-badge">
            <HiShieldCheck />
            <span>256-bit SSL Encrypted • Secure Payment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
