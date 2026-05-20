import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/entities/auth';
import { selectCartCount } from '../store/entities/cart';

function Header() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const cartCount = useSelector(selectCartCount);
  const favoritesCount = useSelector((state) => state.favorites.items.length);

  return (
    <header className="header" role="banner">
      <div className="container">
        <Link to="/products" className="header__logo" aria-label="ShopApp — на главную">
          ShopApp
        </Link>
        <nav className="header__nav" aria-label="Основная навигация">
          <Link to="/products">Товары</Link>
          <Link to="/cart" aria-label={`Корзина${cartCount > 0 ? `, товаров: ${cartCount}` : ', пуста'}`}>
            Корзина
            {cartCount > 0 && (
              <span className="header__cart-badge" aria-hidden="true">{cartCount}</span>
            )}
          </Link>
          {user ? (
            <div className="header__user">
              <Link to="/favorites" aria-label={`Избранное${favoritesCount > 0 ? `, товаров: ${favoritesCount}` : ', пусто'}`}>
                Избранное
                {favoritesCount > 0 && (
                  <span className="header__fav-badge" aria-hidden="true">{favoritesCount}</span>
                )}
              </Link>
              <Link to="/orders">Заказы</Link>
              <span className="header__user-name" aria-label={`Пользователь: ${user.name}`}>{user.name}</span>
              <button
                className="header__btn"
                onClick={() => dispatch(logout())}
                aria-label="Выйти из аккаунта"
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
