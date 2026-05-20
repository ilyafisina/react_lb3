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
    <div className="product-card">
      <div className="product-card__image-wrapper">
        <img
          className="product-card__image"
          src={product.image}
          alt={product.name}
        />
        {user && (
          <button
            className={`product-card__fav ${isFavorite ? 'product-card__fav--active' : ''}`}
            onClick={handleToggleFavorite}
            title={isFavorite ? 'Убрать из избранного' : 'В избранное'}
          >
            {isFavorite ? '\u2665' : '\u2661'}
          </button>
        )}
      </div>
      <div className="product-card__body">
        <div className="product-card__category">{product.category}</div>
        <div className="product-card__name">{product.name}</div>
        <div className="product-card__description">{product.description}</div>
        <div className="product-card__footer">
          <span className="product-card__price">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          <button
            className="btn btn--primary"
            onClick={() => dispatch(addToCart(product))}
          >
            В корзину
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
