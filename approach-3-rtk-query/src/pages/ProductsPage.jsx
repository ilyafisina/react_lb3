import { useGetProductsQuery } from '../store/api';
import ProductCard from '../components/ProductCard';

function ProductsPage() {
  const { data: products, isLoading, error } = useGetProductsQuery();

  if (isLoading) return <div className="loading">Загрузка товаров...</div>;
  if (error) return <div className="error">Ошибка: {error.message || 'Не удалось загрузить товары'}</div>;

  return (
    <div className="page">
      <h1 className="page__title">Каталог товаров</h1>
      <div className="products-grid">
        {products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ProductsPage;
