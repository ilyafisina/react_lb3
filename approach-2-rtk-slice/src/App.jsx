import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from './store/entities/auth';
import { fetchRequest as fetchFavorites } from './store/entities/favorites';
import Header from './components/Header';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import FavoritesPage from './pages/FavoritesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const PAGE_TITLES = {
  '/products': 'Каталог товаров — ShopApp',
  '/cart': 'Корзина — ShopApp',
  '/checkout': 'Оформление заказа — ShopApp',
  '/orders': 'Мои заказы — ShopApp',
  '/favorites': 'Избранное — ShopApp',
  '/login': 'Вход — ShopApp',
  '/register': 'Регистрация — ShopApp',
};

function PrivateRoute({ children }) {
  const user = useSelector(selectUser);
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      dispatch(fetchFavorites(user.id));
    }
  }, [dispatch, user]);

  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] || 'ShopApp — Интернет-магазин';
    document.title = title;
  }, [location.pathname]);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Перейти к основному содержимому
      </a>
      <Header />
      <main id="main-content" className="container" role="main" aria-label="Основное содержимое">
        <Routes>
          <Route path="/" element={<Navigate to="/products" />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <CheckoutPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <OrdersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <PrivateRoute>
                <FavoritesPage />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
