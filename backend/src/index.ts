import { ApolloServer } from "apollo-server";
import "dotenv/config";
import { prisma } from "./db";

const typeDefs = `
  type Query {
    hello: String!
  }
`;

const resolvers = {
    Query: {
        hello: () => "Hello from backend! ✅",
    },
};

async function start() {
    await prisma.$connect();
    console.log("✅ Connected to DB");
    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    const { url } = await server.listen({ port: process.env.PORT || 4000 });
    console.log(`🚀 Server ready at ${url}`);
}

start().catch((err) => {
    console.error("Server error:", err);
});