import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/entities/cart';
import { toggleRequest, selectIsFavorite } from '../store/entities/favorites';

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isFavorite = useSelector(selectIsFavorite(product.id));

  const handleToggleFavorite = () => {
    if (!user) return;
    dispatch(toggleRequest({ userId: user.id, productId: product.id }));
  };

  return (
    <article className="product-card" aria-label={`Товар: ${product.name}`}>
      <div className="product-card__image-wrapper">
        <img
          className="product-card__image"
          src={product.image}
          alt={`Изображение товара: ${product.name}`}
        />
        {user && (
          <button
            className={`product-card__fav ${isFavorite ? 'product-card__fav--active' : ''}`}
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? `Убрать ${product.name} из избранного` : `Добавить ${product.name} в избранное`}
            aria-pressed={isFavorite}
          >
            {isFavorite ? '\u2665' : '\u2661'}
          </button>
        )}
      </div>
      <div className="product-card__body">
        <p className="product-card__category">{product.category}</p>
        <h2 className="product-card__name">{product.name}</h2>
        <p className="product-card__description">{product.description}</p>
        <div className="product-card__footer">
          <span className="product-card__price" aria-label={`Цена: ${product.price.toLocaleString('ru-RU')} рублей`}>
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          <button
            className="btn btn--primary"
            onClick={() => dispatch(addToCart(product))}
            aria-label={`Добавить ${product.name} в корзину`}
          >
            В корзину
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
