import { useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity } from '../store/cartSlice';

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
    <div className="cart-item">
      <img className="cart-item__image" src={product.image} alt={product.name} />
      <div className="cart-item__info">
        <div className="cart-item__name">{product.name}</div>
        <div className="cart-item__price">
          {product.price.toLocaleString('ru-RU')} ₽
        </div>
      </div>
      <div className="cart-item__controls">
        <button className="cart-item__qty-btn" onClick={handleDecrease}>
          -
        </button>
        <span className="cart-item__qty">{quantity}</span>
        <button
          className="cart-item__qty-btn"
          onClick={() =>
            dispatch(updateQuantity({ productId: product.id, quantity: quantity + 1 }))
          }
        >
          +
        </button>
        <button
          className="btn btn--danger"
          onClick={() => dispatch(removeFromCart(product.id))}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

export default CartItem;
