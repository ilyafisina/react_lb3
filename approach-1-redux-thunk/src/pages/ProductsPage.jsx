import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts } from '../store/actions/productActions';
import ProductCard from '../components/ProductCard';

function ProductsPage() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  if (loading) return <div className="loading">Загрузка товаров...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;

  return (
    <div className="page">
      <h1 className="page__title">Каталог товаров</h1>
      <div className="products-grid">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ProductsPage;
