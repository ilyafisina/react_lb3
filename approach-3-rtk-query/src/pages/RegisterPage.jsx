import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterUserMutation, useLazyCheckEmailExistsQuery } from '../store/api';
import { setUser, setAuthError } from '../store/authSlice';

function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, error } = useSelector((state) => state.auth);
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const [checkEmail] = useLazyCheckEmailExistsQuery();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) navigate('/products');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: existing } = await checkEmail(email);
      if (existing && existing.length > 0) {
        dispatch(setAuthError('Пользователь с таким email уже существует'));
        return;
      }
      const userData = await registerUser({ name, email, password }).unwrap();
      dispatch(setUser(userData));
    } catch (err) {
      dispatch(setAuthError(err.data?.message || 'Ошибка регистрации'));
    }
  };

  return (
    <div className="page">
      <div className="auth-page">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Регистрация</h2>
          {error && <div className="auth-form__error">{error}</div>}
          <div className="form-group">
            <label>Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Иванов"
              required
            />
          </div>
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
              placeholder="Придумайте пароль"
              required
            />
          </div>
          <button
            className="btn btn--primary"
            style={{ width: '100%' }}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
          <div className="auth-form__link">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
