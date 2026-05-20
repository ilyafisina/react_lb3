import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../store/actions/orderActions';

const STEPS = ['Доставка', 'Оплата', 'Подтверждение'];

function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
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

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

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

  const handleSubmit = async () => {
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

    try {
      await dispatch(createOrder(orderData));
      setOrderComplete(true);
    } catch {
      // handled by reducer
    }
  };

  if (items.length === 0 && !orderComplete) {
    navigate('/cart');
    return null;
  }

  if (orderComplete) {
    return (
      <div className="page">
        <div className="checkout">
          <div className="checkout__success">
            <h3>Заказ успешно оформлен!</h3>
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
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page__title">Оформление заказа</h1>
      <div className="checkout">
        <div className="checkout__steps">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`checkout__step ${
                index === currentStep ? 'checkout__step--active' : ''
              } ${index < currentStep ? 'checkout__step--completed' : ''}`}
            >
              <div className="checkout__step-number">{index + 1}</div>
              <div className="checkout__step-label">{step}</div>
            </div>
          ))}
        </div>

        <div className="checkout__form">
          {currentStep === 0 && (
            <>
              <h3>Данные доставки</h3>
              <div className="form-group">
                <label>Адрес</label>
                <input
                  type="text"
                  value={shipping.address}
                  onChange={(e) =>
                    setShipping({ ...shipping, address: e.target.value })
                  }
                  placeholder="ул. Примерная, д. 1, кв. 10"
                />
              </div>
              <div className="form-group">
                <label>Город</label>
                <input
                  type="text"
                  value={shipping.city}
                  onChange={(e) =>
                    setShipping({ ...shipping, city: e.target.value })
                  }
                  placeholder="Москва"
                />
              </div>
              <div className="form-group">
                <label>Почтовый индекс</label>
                <input
                  type="text"
                  value={shipping.zip}
                  onChange={(e) =>
                    setShipping({ ...shipping, zip: e.target.value })
                  }
                  placeholder="101000"
                />
              </div>
              <div className="form-group">
                <label>Телефон</label>
                <input
                  type="text"
                  value={shipping.phone}
                  onChange={(e) =>
                    setShipping({ ...shipping, phone: e.target.value })
                  }
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <h3>Данные оплаты</h3>
              <div className="form-group">
                <label>Номер карты</label>
                <input
                  type="text"
                  value={payment.cardNumber}
                  onChange={(e) =>
                    setPayment({ ...payment, cardNumber: e.target.value })
                  }
                  placeholder="0000 0000 0000 0000"
                />
              </div>
              <div className="form-group">
                <label>Имя владельца</label>
                <input
                  type="text"
                  value={payment.cardHolder}
                  onChange={(e) =>
                    setPayment({ ...payment, cardHolder: e.target.value })
                  }
                  placeholder="IVAN IVANOV"
                />
              </div>
              <div className="form-group">
                <label>Срок действия</label>
                <input
                  type="text"
                  value={payment.expiry}
                  onChange={(e) =>
                    setPayment({ ...payment, expiry: e.target.value })
                  }
                  placeholder="MM/YY"
                />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input
                  type="text"
                  value={payment.cvv}
                  onChange={(e) =>
                    setPayment({ ...payment, cvv: e.target.value })
                  }
                  placeholder="123"
                />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h3>Подтверждение заказа</h3>
              <div style={{ marginBottom: '16px' }}>
                <strong>Адрес доставки:</strong> {shipping.address},{' '}
                {shipping.city}, {shipping.zip}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Телефон:</strong> {shipping.phone}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Способ оплаты:</strong> Карта **** {payment.cardNumber.slice(-4)}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Товары:</strong>
                {items.map((item) => (
                  <div key={item.product.id} style={{ padding: '4px 0' }}>
                    {item.product.name} x {item.quantity} —{' '}
                    {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Итого: {total.toLocaleString('ru-RU')} ₽
              </div>
            </>
          )}

          <div className="checkout__actions">
            {currentStep > 0 ? (
              <button className="btn btn--outline" onClick={handleBack}>
                Назад
              </button>
            ) : (
              <div />
            )}
            {currentStep < STEPS.length - 1 ? (
              <button className="btn btn--primary" onClick={handleNext}>
                Далее
              </button>
            ) : (
              <button className="btn btn--success" onClick={handleSubmit}>
                Подтвердить заказ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
