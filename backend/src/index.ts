import { ApolloServer } from "apollo-server";
import "dotenv/config";
import { prisma } from "./db";
import { hashPassword, comparePassword, createToken } from "./auth";
import { verifyToken } from "./auth";



const typeDefs = `
  type User {
    id: ID!
    email: String!
    name: String!
    role: String!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type Query {
    hello: String!
    me: User
  }

  type Mutation {
    register(email: String!, password: String!, name: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hello from backend! ✅",
    me: async (_: any, __: any, context: any) => {
      if (!context.userId) return null;
      return prisma.user.findUnique({ where: { id: context.userId } });
    },
  },

  Mutation: {
    register: async (_: any, args: any) => {
      const { email, password, name } = args;
      
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new Error("Email is already registered.");

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: { email, passwordHash, name },
      });

      const token = createToken(user.id);

      return { user, token };
    },

    login: async (_: any, args: any) => {
      const { email, password } = args;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("User not found.");

      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) throw new Error("Invalid password.");

      const token = createToken(user.id);

      return { user, token };
    },
  },
};

const context = ({ req }: any) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return { userId: null };

  const payload = verifyToken(token);
  return { userId: payload ? payload.userId : null };
};

async function start() {
    await prisma.$connect();
    console.log("✅ Connected to DB");
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context,
    });

    const { url } = await server.listen({ port: process.env.PORT || 4000 });
    console.log(`🚀 Server ready at ${url}`);
}

start().catch((err) => {
    console.error("Server error:", err);
});