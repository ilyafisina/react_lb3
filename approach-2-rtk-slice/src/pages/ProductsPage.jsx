import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRequest } from '../store/entities/products';
import { selectItems, selectLoading, selectError } from '../store/entities/products';
import ProductCard from '../components/ProductCard';

function ProductsPage() {
  const dispatch = useDispatch();
  const items = useSelector(selectItems);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  useEffect(() => {
    dispatch(fetchRequest());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="loading" role="status" aria-live="polite">
        <span>Загрузка товаров...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error" role="alert" aria-live="assertive">
        Ошибка: {error}
      </div>
    );
  }

  return (
    <section className="page" aria-labelledby="products-heading">
      <h1 className="page__title" id="products-heading">Каталог товаров</h1>
      <div className="products-grid" role="list" aria-label="Список товаров">
        {items.map((product) => (
          <div role="listitem" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProductsPage;
