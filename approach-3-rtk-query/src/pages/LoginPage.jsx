import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginUserMutation } from '../store/api';
import { setUser, setAuthError } from '../store/authSlice';

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, error } = useSelector((state) => state.auth);
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) navigate('/products');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await loginUser({ email, password }).unwrap();
      dispatch(setUser(userData));
    } catch (err) {
      dispatch(setAuthError(err.data?.message || 'Неверный email или пароль'));
    }
  };

  return (
    <div className="page">
      <div className="auth-page">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Вход</h2>
          {error && <div className="auth-form__error">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
            />
          </div>
          <button
            className="btn btn--primary"
            style={{ width: '100%' }}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
          <div className="auth-form__link">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
