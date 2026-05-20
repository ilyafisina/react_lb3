import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRequest, selectItems, selectLoading } from '../store/entities/favorites';
import { selectItems as selectProducts } from '../store/entities/products';
import { fetchRequest as fetchProducts } from '../store/entities/products';
import { selectUser } from '../store/entities/auth';
import ProductCard from '../components/ProductCard';

function FavoritesPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const favorites = useSelector(selectItems);
  const products = useSelector(selectProducts);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    if (user) {
      dispatch(fetchRequest(user.id));
    }
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch, user, products.length]);

  const favoriteProducts = products.filter((product) =>
    favorites.some((fav) => fav.productId === product.id)
  );

  if (loading) return <div className="loading">Загрузка избранного...</div>;

  return (
    <div className="page">
      <h1 className="page__title">Избранное</h1>
      {favoriteProducts.length === 0 ? (
        <div className="cart-empty">
          <p>В избранном пока ничего нет</p>
        </div>
      ) : (
        <div className="products-grid">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;
