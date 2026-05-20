import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/actions/authActions';

function Header() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="header">
      <div className="container">
        <Link to="/products" className="header__logo">
          ShopApp
        </Link>
        <nav className="header__nav">
          <Link to="/products">Товары</Link>
          <Link to="/cart">
            Корзина
            {cartCount > 0 && (
              <span className="header__cart-badge">{cartCount}</span>
            )}
          </Link>
          {user ? (
            <div className="header__user">
              <Link to="/orders">Заказы</Link>
              <span className="header__user-name">{user.name}</span>
              <button
                className="header__btn"
                onClick={() => dispatch(logout())}
              >
                Выйти
              </button>
            </div>
          ) : (
            <Link to="/login">Войти</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
