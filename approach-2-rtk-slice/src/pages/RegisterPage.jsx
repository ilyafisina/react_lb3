import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerRequest, selectUser, selectLoading, selectError } from '../store/entities/auth';

function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) navigate('/products');
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registerRequest({ name, email, password }));
  };

  return (
    <section className="page" aria-labelledby="register-heading">
      <div className="auth-page">
        <form className="auth-form" onSubmit={handleSubmit} aria-labelledby="register-heading" noValidate>
          <h2 id="register-heading">Регистрация</h2>
          {error && (
            <div className="auth-form__error" role="alert" aria-live="assertive" id="register-error">
              {error}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="register-name">Имя</label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Иванов"
              required
              aria-required="true"
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              aria-required="true"
              aria-describedby={error ? 'register-error' : undefined}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="register-password">Пароль</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Придумайте пароль"
              required
              aria-required="true"
              autoComplete="new-password"
            />
          </div>
          <button
            className="btn btn--primary"
            style={{ width: '100%' }}
            type="submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
          <div className="auth-form__link">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </div>
        </form>
      </div>
    </section>
  );
}

export default RegisterPage;
