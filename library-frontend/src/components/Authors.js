import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { ALL_AUTHORS, UPDATE_AUTHOR } from '../queries';

const Authors = (props) => {
  const result = useQuery(ALL_AUTHORS);

  const [name, setName] = useState('');
  const [year, setYear] = useState('');

  const [editAuthor] = useMutation(UPDATE_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  if (!props.show) {
    return null;
  }

  if (result.loading) {
    return <div>loading...</div>;
  }

  const authors = result.data.allAuthors;

  const updateAuthor = (event) => {
    event.preventDefault();
    editAuthor({
      variables: { name, setBornTo: Number(year) },
    });

    setName('');
    setYear('');
  };

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Set birthyear</h3>
      <form onSubmit={updateAuthor}>
        <div>
          name
          <select value={name} onChange={({ target }) => setName(target.value)}>
            {authors.map((a, i) => (
              <option value={a.name} key={i}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          born
          <input
            type="number"
            value={year}
            onChange={({ target }) => setYear(target.value)}
          ></input>
        </div>
        <button type="submit">update author</button>
      </form>
    </div>
  );
};

export default Authors;
