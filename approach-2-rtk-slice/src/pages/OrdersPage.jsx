import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRequest, selectItems, selectLoading, selectError } from '../store/entities/orders';
import { selectUser } from '../store/entities/auth';

function OrdersPage() {
  const dispatch = useDispatch();
  const items = useSelector(selectItems);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (user) {
      dispatch(fetchRequest(user.id));
    }
  }, [dispatch, user]);

  if (loading) {
    return (
      <div className="loading" role="status" aria-live="polite">
        <span>Загрузка заказов...</span>
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
    <section className="page" aria-labelledby="orders-heading">
      <h1 className="page__title" id="orders-heading">Мои заказы</h1>
      {items.length === 0 ? (
        <div className="orders-empty" role="status">У вас пока нет заказов</div>
      ) : (
        <div role="list" aria-label="Список заказов">
          {items.map((order) => (
            <article key={order.id} className="order-card" role="listitem" aria-label={`Заказ номер ${order.id}`}>
              <div className="order-card__header">
                <div>
                  <span className="order-card__id">Заказ #{order.id}</span>
                  <span className="order-card__date" style={{ marginLeft: '12px' }}>
                    {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <span
                  className={`order-card__status order-card__status--${order.status}`}
                  role="status"
                >
                  {order.status === 'paid' ? 'Оплачен' : 'В обработке'}
                </span>
              </div>
              <ul className="order-card__items" aria-label="Товары в заказе">
                {order.items.map((item, index) => (
                  <li key={index} className="order-card__item">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>
                      {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                    </span>
                  </li>
                ))}
              </ul>
              <div className="order-card__total" aria-label={`Итого: ${order.total.toLocaleString('ru-RU')} рублей`}>
                Итого: {order.total.toLocaleString('ru-RU')} ₽
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default OrdersPage;
