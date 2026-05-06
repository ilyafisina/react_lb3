import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';

function ProductCard({ product }) {
  const dispatch = useDispatch();

  return (
    <div className="product-card">
      <img
        className="product-card__image"
        src={product.image}
        alt={product.name}
      />
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
