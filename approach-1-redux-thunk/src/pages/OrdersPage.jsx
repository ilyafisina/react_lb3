import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders } from '../store/actions/orderActions';

function OrdersPage() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchOrders(user.id));
    }
  }, [dispatch, user]);

  if (loading) return <div className="loading">Загрузка заказов...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;

  return (
    <div className="page">
      <h1 className="page__title">Мои заказы</h1>
      {items.length === 0 ? (
        <div className="orders-empty">У вас пока нет заказов</div>
      ) : (
        items.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-card__header">
              <div>
                <span className="order-card__id">Заказ #{order.id}</span>
                <span className="order-card__date" style={{ marginLeft: '12px' }}>
                  {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <span
                className={`order-card__status order-card__status--${order.status}`}
              >
                {order.status === 'paid' ? 'Оплачен' : 'В обработке'}
              </span>
            </div>
            <div className="order-card__items">
              {order.items.map((item, index) => (
                <div key={index} className="order-card__item">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>
                    {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ))}
            </div>
            <div className="order-card__total">
              Итого: {order.total.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default OrdersPage;
