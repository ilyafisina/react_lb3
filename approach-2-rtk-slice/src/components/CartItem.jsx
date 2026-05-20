import { useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity } from '../store/entities/cart';

function CartItem({ item }) {
  const dispatch = useDispatch();
  const { product, quantity } = item;

  const handleDecrease = () => {
    if (quantity > 1) {
      dispatch(updateQuantity({ productId: product.id, quantity: quantity - 1 }));
    } else {
      dispatch(removeFromCart(product.id));
    }
  };

  return (
    <article className="cart-item" aria-label={`${product.name}, количество: ${quantity}`}>
      <img className="cart-item__image" src={product.image} alt={`Изображение: ${product.name}`} />
      <div className="cart-item__info">
        <h3 className="cart-item__name">{product.name}</h3>
        <p className="cart-item__price">
          {product.price.toLocaleString('ru-RU')} ₽
        </p>
      </div>
      <div className="cart-item__controls" role="group" aria-label={`Управление количеством: ${product.name}`}>
        <button
          className="cart-item__qty-btn"
          onClick={handleDecrease}
          aria-label={`Уменьшить количество ${product.name}`}
        >
          −
        </button>
        <span className="cart-item__qty" aria-live="polite" aria-atomic="true">
          {quantity}
        </span>
        <button
          className="cart-item__qty-btn"
          onClick={() =>
            dispatch(updateQuantity({ productId: product.id, quantity: quantity + 1 }))
          }
          aria-label={`Увеличить количество ${product.name}`}
        >
          +
        </button>
        <button
          className="btn btn--danger"
          onClick={() => dispatch(removeFromCart(product.id))}
          aria-label={`Удалить ${product.name} из корзины`}
        >
          Удалить
        </button>
      </div>
    </article>
  );
}

export default CartItem;
