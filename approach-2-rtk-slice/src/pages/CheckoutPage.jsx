import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createRequest } from '../store/entities/orders';
import { clearCart, selectItems, selectCartTotal } from '../store/entities/cart';
import { selectUser } from '../store/entities/auth';

const STEPS = ['Доставка', 'Оплата', 'Подтверждение'];

function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectItems);
  const total = useSelector(selectCartTotal);
  const user = useSelector(selectUser);
  const [currentStep, setCurrentStep] = useState(0);
  const [orderComplete, setOrderComplete] = useState(false);

  const [shipping, setShipping] = useState({
    address: '',
    city: '',
    zip: '',
    phone: '',
  });

  const [payment, setPayment] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: '',
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const orderData = {
      userId: user.id,
      items: items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      })),
      total,
      status: 'paid',
      shipping,
      createdAt: new Date().toISOString(),
    };

    dispatch(createRequest(orderData));
    dispatch(clearCart());
    setOrderComplete(true);
  };

  if (items.length === 0 && !orderComplete) {
    navigate('/cart');
    return null;
  }

  if (orderComplete) {
    return (
      <section className="page" aria-labelledby="checkout-success-heading">
        <div className="checkout">
          <div className="checkout__success" role="alert" aria-live="polite">
            <h1 id="checkout-success-heading">Заказ успешно оформлен!</h1>
            <p>Спасибо за покупку. Ваш заказ обрабатывается.</p>
            <button
              className="btn btn--primary"
              style={{ marginTop: '20px' }}
              onClick={() => navigate('/orders')}
            >
              Перейти к заказам
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page" aria-labelledby="checkout-heading">
      <h1 className="page__title" id="checkout-heading">Оформление заказа</h1>
      <div className="checkout">
        <nav className="checkout__steps" aria-label="Этапы оформления заказа">
          <ol className="checkout__steps-list">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className={`checkout__step ${
                  index === currentStep ? 'checkout__step--active' : ''
                } ${index < currentStep ? 'checkout__step--completed' : ''}`}
                aria-current={index === currentStep ? 'step' : undefined}
              >
                <div className="checkout__step-number" aria-hidden="true">{index + 1}</div>
                <div className="checkout__step-label">
                  <span className="visually-hidden">
                    {index < currentStep ? 'Завершено: ' : index === currentStep ? 'Текущий этап: ' : 'Следующий: '}
                  </span>
                  {step}
                </div>
              </li>
            ))}
          </ol>
        </nav>

        <form className="checkout__form" onSubmit={(e) => e.preventDefault()} aria-label={`Этап ${currentStep + 1}: ${STEPS[currentStep]}`}>
          {currentStep === 0 && (
            <fieldset>
              <legend><h2>Данные доставки</h2></legend>
              <div className="form-group">
                <label htmlFor="shipping-address">Адрес</label>
                <input
                  id="shipping-address"
                  type="text"
                  value={shipping.address}
                  onChange={(e) =>
                    setShipping({ ...shipping, address: e.target.value })
                  }
                  placeholder="ул. Примерная, д. 1, кв. 10"
                  required
                  aria-required="true"
                  autoComplete="street-address"
                />
              </div>
              <div className="form-group">
                <label htmlFor="shipping-city">Город</label>
                <input
                  id="shipping-city"
                  type="text"
                  value={shipping.city}
                  onChange={(e) =>
                    setShipping({ ...shipping, city: e.target.value })
                  }
                  placeholder="Москва"
                  required
                  aria-required="true"
                  autoComplete="address-level2"
                />
              </div>
              <div className="form-group">
                <label htmlFor="shipping-zip">Почтовый индекс</label>
                <input
                  id="shipping-zip"
                  type="text"
                  value={shipping.zip}
                  onChange={(e) =>
                    setShipping({ ...shipping, zip: e.target.value })
                  }
                  placeholder="101000"
                  required
                  aria-required="true"
                  autoComplete="postal-code"
                />
              </div>
              <div className="form-group">
                <label htmlFor="shipping-phone">Телефон</label>
                <input
                  id="shipping-phone"
                  type="tel"
                  value={shipping.phone}
                  onChange={(e) =>
                    setShipping({ ...shipping, phone: e.target.value })
                  }
                  placeholder="+7 (999) 123-45-67"
                  required
                  aria-required="true"
                  autoComplete="tel"
                />
              </div>
            </fieldset>
          )}

          {currentStep === 1 && (
            <fieldset>
              <legend><h2>Данные оплаты</h2></legend>
              <div className="form-group">
                <label htmlFor="payment-card">Номер карты</label>
                <input
                  id="payment-card"
                  type="text"
                  value={payment.cardNumber}
                  onChange={(e) =>
                    setPayment({ ...payment, cardNumber: e.target.value })
                  }
                  placeholder="0000 0000 0000 0000"
                  required
                  aria-required="true"
                  autoComplete="cc-number"
                  inputMode="numeric"
                />
              </div>
              <div className="form-group">
                <label htmlFor="payment-holder">Имя владельца</label>
                <input
                  id="payment-holder"
                  type="text"
                  value={payment.cardHolder}
                  onChange={(e) =>
                    setPayment({ ...payment, cardHolder: e.target.value })
                  }
                  placeholder="IVAN IVANOV"
                  required
                  aria-required="true"
                  autoComplete="cc-name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="payment-expiry">Срок действия</label>
                <input
                  id="payment-expiry"
                  type="text"
                  value={payment.expiry}
                  onChange={(e) =>
                    setPayment({ ...payment, expiry: e.target.value })
                  }
                  placeholder="MM/YY"
                  required
                  aria-required="true"
                  autoComplete="cc-exp"
                />
              </div>
              <div className="form-group">
                <label htmlFor="payment-cvv">CVV</label>
                <input
                  id="payment-cvv"
                  type="text"
                  value={payment.cvv}
                  onChange={(e) =>
                    setPayment({ ...payment, cvv: e.target.value })
                  }
                  placeholder="123"
                  required
                  aria-required="true"
                  autoComplete="cc-csc"
                  inputMode="numeric"
                />
              </div>
            </fieldset>
          )}

          {currentStep === 2 && (
            <div aria-labelledby="confirm-heading">
              <h2 id="confirm-heading">Подтверждение заказа</h2>
              <dl className="checkout__summary-list">
                <dt><strong>Адрес доставки:</strong></dt>
                <dd>{shipping.address}, {shipping.city}, {shipping.zip}</dd>
                <dt><strong>Телефон:</strong></dt>
                <dd>{shipping.phone}</dd>
                <dt><strong>Способ оплаты:</strong></dt>
                <dd>Карта **** {payment.cardNumber.slice(-4)}</dd>
              </dl>
              <div style={{ marginBottom: '16px' }}>
                <strong>Товары:</strong>
                <ul className="checkout__items-list">
                  {items.map((item) => (
                    <li key={item.product.id}>
                      {item.product.name} × {item.quantity} —{' '}
                      {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }} aria-label={`Итого: ${total.toLocaleString('ru-RU')} рублей`}>
                Итого: {total.toLocaleString('ru-RU')} ₽
              </div>
            </div>
          )}

          <div className="checkout__actions">
            {currentStep > 0 ? (
              <button className="btn btn--outline" onClick={handleBack} type="button">
                Назад
              </button>
            ) : (
              <div />
            )}
            {currentStep < STEPS.length - 1 ? (
              <button className="btn btn--primary" onClick={handleNext} type="button">
                Далее
              </button>
            ) : (
              <button className="btn btn--success" onClick={handleSubmit} type="button">
                Подтвердить заказ
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

export default CheckoutPage;
