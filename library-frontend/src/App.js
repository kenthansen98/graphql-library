import React, { useState, useEffect } from 'react';
import Authors from './components/Authors';
import Books from './components/Books';
import NewBook from './components/NewBook';
import LoginForm from './components/LoginForm';
import { useApolloClient } from '@apollo/client';

const App = () => {
  const [page, setPage] = useState('authors');
  const [token, setToken] = useState(null);
  const client = useApolloClient();

  useEffect(() => {
    const token = localStorage.getItem('library-user-token');
    if (token) {
      setToken(token);
    }
  }, []);

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
  };

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {token !== null ? (
          <>
            <button onClick={() => setPage('add')}>add book</button>
            <button onClick={logout}>logout</button>
          </>
        ) : (
          <button onClick={() => setPage('login')}>login</button>
        )}
      </div>

      <Authors show={page === 'authors'} />

      <Books show={page === 'books'} />

      <NewBook show={page === 'add'} />

      {page === 'login' ? (
        <LoginForm setToken={setToken} />
      ) : (
        ''
      )}
    </div>
  );
};

export default App;
