import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { selectItems, selectCartTotal } from '../store/entities/cart';
import { selectUser } from '../store/entities/auth';
import CartItem from '../components/CartItem';

function CartPage() {
  const items = useSelector(selectItems);
  const total = useSelector(selectCartTotal);
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <section className="page" aria-labelledby="cart-heading">
        <h1 className="page__title" id="cart-heading">Корзина</h1>
        <div className="cart-empty" role="status">
          <p>Корзина пуста</p>
          <Link to="/products" className="btn btn--primary" style={{ marginTop: '16px', display: 'inline-block' }}>
            Перейти к товарам
          </Link>
        </div>
      </section>
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
    <section className="page" aria-labelledby="cart-heading">
      <h1 className="page__title" id="cart-heading">Корзина</h1>
      <div role="list" aria-label="Товары в корзине">
        {items.map((item) => (
          <div role="listitem" key={item.product.id}>
            <CartItem item={item} />
          </div>
        ))}
      </div>
      <div className="cart-summary" aria-live="polite">
        <span className="cart-summary__total" aria-label={`Итого: ${total.toLocaleString('ru-RU')} рублей`}>
          Итого: {total.toLocaleString('ru-RU')} ₽
        </span>
        <button className="btn btn--success" onClick={handleCheckout}>
          Оформить заказ
        </button>
      </div>
    </section>
  );
}

export default CartPage;
