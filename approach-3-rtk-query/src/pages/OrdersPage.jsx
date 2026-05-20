import { useSelector } from 'react-redux';
import { useGetOrdersQuery } from '../store/api';

function OrdersPage() {
  const { user } = useSelector((state) => state.auth);
  const { data: orders, isLoading, error } = useGetOrdersQuery(user?.id, {
    skip: !user,
  });

  if (isLoading) return <div className="loading">Загрузка заказов...</div>;
  if (error) return <div className="error">Ошибка: {error.message || 'Не удалось загрузить заказы'}</div>;

  return (
    <div className="page">
      <h1 className="page__title">Мои заказы</h1>
      {!orders || orders.length === 0 ? (
        <div className="orders-empty">У вас пока нет заказов</div>
      ) : (
        orders.map((order) => (
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
