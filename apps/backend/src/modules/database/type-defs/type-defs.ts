import { gql } from 'graphql-tag';

export const typeDefs = gql`
    type RelationshipProperties @relationshipProperties{
        created_at: DateTime!
    }

    type User {
        name: String! @unique
        created_at: DateTime!
        friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, properties: "RelationshipProperties")
        referred: [User!]! @relationship(type: "REFERRED", direction: OUT, properties: "RelationshipProperties")
        referredBy: [User!]! @relationship(type: "REFERRED", direction: IN, properties: "RelationshipProperties")
    }
`;

