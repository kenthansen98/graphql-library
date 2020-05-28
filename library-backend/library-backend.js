const { ApolloServer, UserInputError, AuthenticationError, gql } = require('apollo-server');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'alcdnlajw4j3b4340dldnfj';

const mongoose = require('mongoose');
const Book = require('./models/book');
const Author = require('./models/author');
const User = require('./models/user');

mongoose.set('useFindAndModify', false);
const MONGODB_URI =
  'mongodb+srv://fullstack:1INq8PXmBdwIRFgY@cluster0-bjpdo.mongodb.net/gql-library?retryWrites=true&w=majority';
mongoose.set('useCreateIndex', true);
console.log('connecting to', MONGODB_URI);
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message);
  });

const typeDefs = gql`
  type Book {
    title: String!
    author: Author!
    published: Int!
    genres: [String!]!
    id: ID!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int!
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      born: Int
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }
`;

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      // if (args.author && args.genre) {
      //   return books.filter(
      //     (book) =>
      //       book.author === args.author && book.genres.includes(args.genre)
      //   );
      // } else if (args.author && !args.genre) {
      //   return books.filter((book) => book.author === args.author);
      // } else if (!args.author && args.genre) {
      //   return books.filter((book) => book.genres.includes(args.genre));
      if (args.genre) {
        return Book.find({ genres: { $in: [args.genre] } });
      } else {
        return Book.find({});
      }
    },
    allAuthors: () => {
      return Author.find({});
    },
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Book: {
    author: async (root) => {
      return await Author.findOne({ _id: root.author });
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new AuthenticationError("not authenticated");
      }

      const author = await Author.findOne({ name: args.author });
      if (!author) {
        const newAuthor = new Author({
          name: args.author,
          born: args.born,
          bookCount: 1,
        });
        const book = new Book({ ...args, author: newAuthor });
        try {
          await book.save();
          await newAuthor.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          });
        }

        return book;
      } else {
        const book = new Book({ ...args, author: author });
        author.bookCount += 1;
        try {
          await book.save();
          await author.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          });
        }
        return book;
      }
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new AuthenticationError("not authenticated");
      }
      
      const author = await Author.findOne({ name: args.name });
      if (!author) {
        return null;
      }
      author.born = args.setBornTo;
      try {
        await author.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }

      return author;
    },
    createUser: (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      });

      return user.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== 'secred') {
        throw new UserInputError('wrong credentials');
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, JWT_SECRET) };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
  },
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
