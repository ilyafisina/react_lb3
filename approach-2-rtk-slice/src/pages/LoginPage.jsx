import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginRequest, selectUser, selectLoading, selectError } from '../store/entities/auth';

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) navigate('/products');
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginRequest({ email, password }));
  };

  return (
    <section className="page" aria-labelledby="login-heading">
      <div className="auth-page">
        <form className="auth-form" onSubmit={handleSubmit} aria-labelledby="login-heading" noValidate>
          <h2 id="login-heading">Вход</h2>
          {error && (
            <div className="auth-form__error" role="alert" aria-live="assertive" id="login-error">
              {error}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              aria-required="true"
              aria-describedby={error ? 'login-error' : undefined}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Пароль</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              aria-required="true"
              autoComplete="current-password"
            />
          </div>
          <button
            className="btn btn--primary"
            style={{ width: '100%' }}
            type="submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
          <div className="auth-form__link">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </div>
        </form>
      </div>
    </section>
  );
}

export default LoginPage;
