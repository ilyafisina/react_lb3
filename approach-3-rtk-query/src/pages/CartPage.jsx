import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import CartItem from '../components/CartItem';

function CartPage() {
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <div className="page">
        <h1 className="page__title">Корзина</h1>
        <div className="cart-empty">
          <p>Корзина пуста</p>
          <Link to="/products" className="btn btn--primary" style={{ marginTop: '16px', display: 'inline-block' }}>
            Перейти к товарам
          </Link>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="page">
      <h1 className="page__title">Корзина</h1>
      {items.map((item) => (
        <CartItem key={item.product.id} item={item} />
      ))}
      <div className="cart-summary">
        <span className="cart-summary__total">
          Итого: {total.toLocaleString('ru-RU')} ₽
        </span>
        <button className="btn btn--success" onClick={handleCheckout}>
          Оформить заказ
        </button>
      </div>
    </div>
  );
}

export default CartPage;
