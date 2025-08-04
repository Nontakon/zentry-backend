
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { OGM, Model } from '@neo4j/graphql-ogm';
import { NEO4J_OGM, NEO4J_DRIVER } from '../database.module';
import { Integer, Driver, QueryResult } from 'neo4j-driver';
import { UserScore, UserNetwork, UserProfileResult, User, UserReferralCount } from 'src/interfaces/user.interface';
import { CreateUserAndRelationShip } from '../entities/user.entity';

function toNumber(value: number | Integer): number {
    return typeof value === 'number' ? value : value.toNumber();
}
@Injectable()
export class UserRepository implements OnModuleInit {
    private UserModel: Model;

    constructor(
        @Inject(NEO4J_OGM) private ogm: OGM,
        @Inject(NEO4J_DRIVER) private driver: Driver,
    ) {}

    onModuleInit() {
        this.UserModel = this.ogm.model('User');
    }

    async bulkUpsertUserAndRelationShips(userAndRelationShip: CreateUserAndRelationShip): Promise<void> {
      const session = this.driver.session();
      const tx = session.beginTransaction();
      try {
          const promises: Promise<QueryResult>[] = [];

          if (userAndRelationShip.registerUser.length > 0) {
              const query = `
                  UNWIND $users AS user
                  MERGE (u:User {name: user.name})
                  ON CREATE SET u.created_at = datetime(user.created_at)
              `;
              await tx.run(query, { users: userAndRelationShip.registerUser });
          }

          if (userAndRelationShip.referralRelationShip.length > 0) {
              const query = `
                  UNWIND $relationShips AS relationShip
                  MATCH (referrer:User {name: relationShip.referredBy})
                  MATCH (newUser:User {name: relationShip.user})
                  MERGE (referrer)-[r:REFERRED]->(newUser)
                  SET r.created_at = datetime(relationShip.created_at)
              `;
              promises.push(tx.run(query, { relationShips: userAndRelationShip.referralRelationShip }))
          }

          if (userAndRelationShip.addFriendRelationShip.length > 0) {
              const query = `
                  UNWIND $relationShips AS relationShip
                  MATCH (u1:User {name: relationShip.user1_name})
                  MATCH (u2:User {name: relationShip.user2_name})
                  MERGE (u1)-[r:FRIENDS_WITH]->(u2)
                  SET r.created_at = datetime(relationShip.created_at)
                  MERGE (u2)-[r2:FRIENDS_WITH]->(u1)
                  ON CREATE SET r2.created_at = datetime(relationShip.created_at)
              `;
              promises.push(tx.run(query, { relationShips: userAndRelationShip.addFriendRelationShip }))
          }

          if (userAndRelationShip.unFriendRelationShip.length > 0) {
              const query = `
                  UNWIND $relationShips AS relationShip
                  MATCH (u1:User {name: relationShip.user1_name})
                  MATCH (u2:User {name: relationShip.user2_name})
                  MATCH (u1)-[r:FRIENDS_WITH]-(u2)
                  DELETE r
              `;
              promises.push(tx.run(query, { relationShips: userAndRelationShip.unFriendRelationShip }))
          }
          await Promise.all(promises);
          await tx.commit();
      } catch (error) {
          console.error('Transaction failed, rolling back...', error);
          await tx.rollback();
          throw error; // Re-throw the error to be handled by the service
      } finally {
          await session.close();
      }
  }

    async findUserNetWork(username: string): Promise<UserNetwork | null> {
        const session = this.driver.session();
        const query = `
            MATCH (u:User {name: $username})
            RETURN u.name as name,
                   toString(u.created_at) as created_at,
                   [(u)-[:FRIENDS_WITH]->(f:User) | f { .name }] as friends,
                   [(u)-[:REFERRED]->(ref:User) | ref { .name }] as referred,
                   head([(u)<-[:REFERRED]-(rb:User) | rb { .name }]) as referredBy
        `;
        try {
            const result = await session.run(query, { username });
            if (result.records.length === 0) {
                return null;
            }
            return result.records[0].toObject() as UserNetwork;
        } finally {
            await session.close();
        }
    }

    async findInfluentialUsers(limit: number, friendsOfUser?: string): Promise<UserScore[]> {
        const session = this.driver.session();
        
        const matchClause = friendsOfUser
            ? `MATCH (u:User {name: $friendsOfUser})-[:FRIENDS_WITH]->(target:User)`
            : `MATCH (target:User)`;

        const query = `
            ${matchClause}
            WITH target,
                    (size([(target)-[:FRIENDS_WITH]-(f) | f]) + 
                    size([(target)-[:REFERRED]->(ref_out) | ref_out]) + 
                    size([(target)<-[:REFERRED]-(ref_in) | ref_in])) AS networkStrength,
                    size([(target)-[:REFERRED*1..2]->(ref) | ref]) AS referralPoints
            WITH target, networkStrength + referralPoints AS influenceScore
            RETURN target.name as name, influenceScore
            ORDER BY influenceScore DESC
            LIMIT $limit
        `;
        try {
            const params = { friendsOfUser, limit: Integer.fromNumber(limit) };
            const result = await session.run(query, params);
            return result.records.map(record => ({
                name: record.get('name'),
                score: toNumber(record.get('influenceScore')),
            }));
        } finally {
            await session.close();
        }
    }

    async findStrengthLeaderboard(limit: number,sinceDatetime: string): Promise<UserScore[]> {
        const session = this.driver.session();
        const query = `
            MATCH (target:User)
            WITH target,
                 size([(target)-[r1:FRIENDS_WITH]-(f) WHERE r1.created_at >= datetime($sinceDatetime) | f]) as friends,
                 size([(target)-[r2:REFERRED]->(ref_out) WHERE r2.created_at >= datetime($sinceDatetime) | ref_out]) as referred,
                 size([(target)<-[r3:REFERRED]-(ref_in) WHERE r3.created_at >= datetime($sinceDatetime) | ref_in]) as referrer
            RETURN target.name AS name, friends + referred + referrer AS score
            ORDER BY score DESC
            LIMIT $limit
        `;
        try {
            const params = { limit: Integer.fromNumber(limit)  ,sinceDatetime};
            const result = await session.run(query, params);
            return result.records.map(record => ({
                name: record.get('name'),
                score: toNumber(record.get('score')),
            }));
        } finally {
            await session.close();
        }
    }

    async findReferralLeaderboard(limit: number,sinceDatetime: string): Promise<UserScore[]> {
        const session = this.driver.session();
        const query = `
            MATCH (target:User)
            WITH target
            MATCH path = (target)-[r:REFERRED*1..2]->(ref:User)
            WHERE all(rel IN r WHERE rel.created_at >= datetime($sinceDatetime))
            WITH target.name AS name, count(DISTINCT ref) AS score
            RETURN name, score
            ORDER BY score DESC
            LIMIT $limit
        `;
        try {
            const params = { limit: Integer.fromNumber(limit) ,sinceDatetime };
            const result = await session.run(query, params);
            return result.records.map(record => ({
                name: record.get('name'),
                score: toNumber(record.get('score')),
            }));
        } finally {
            await session.close();
        }
    }

    async findUserProfile(username: string, bucketIntervalSeconds: number,sinceDatetime: string): Promise<UserProfileResult | null> {
        const session = this.driver.session();
        const query = `
            MATCH (u:User {name: $username})
            CALL {
                WITH u
                MATCH (u)-[r:FRIENDS_WITH]->(f)
                WHERE r.created_at >= datetime($sinceDatetime)
                WITH toInteger(floor(r.created_at.epochSeconds / $bucketIntervalSeconds) * $bucketIntervalSeconds) AS timeBucket, count(f) AS friendCount
                WITH datetime({epochSeconds: timeBucket}) as time, friendCount
                RETURN collect({time: toString(time), count: friendCount}) AS friendCountByTime
            }
            CALL {
                WITH u
                MATCH (u)-[r:REFERRED]->(ref)
                WHERE r.created_at >= datetime($sinceDatetime)
                WITH toInteger(floor(r.created_at.epochSeconds / $bucketIntervalSeconds) * $bucketIntervalSeconds)AS timeBucket, count(ref) AS referralCount
                WITH datetime({epochSeconds: timeBucket}) as time, referralCount
                RETURN collect({time: toString(time), count: referralCount}) AS referralCountByTime
            }
            RETURN u.name as name, friendCountByTime, referralCountByTime
        `;
        try {
                const result = await session.run(query, { username,bucketIntervalSeconds, sinceDatetime });
                if (result.records.length === 0) {
                    return null;
                }
                const profile = result.records[0];
                return {
                    name: profile.get('name'),
                    friendCountByTime: profile.get('friendCountByTime').map((r: { count: number | Integer; }) => ({...r, count: toNumber(r.count)})),
                    referralCountByTime: profile.get('referralCountByTime').map((r: { count: number | Integer; })=> ({...r, count: toNumber(r.count)})),
                };
            } finally {
                await session.close();
            }
    }

    async countTotalFriends(username: string): Promise<number> {
        const session = this.driver.session();
        const query = `
            MATCH (u:User {name: $username})-[:FRIENDS_WITH]->(f:User)
            RETURN count(f) as total
        `;
        try {
            const result = await session.run(query, { username });
            if (result.records.length === 0) {
                return 0;
            }
            return toNumber(result.records[0].get('total'));
        } finally {
            await session.close();
        }
    }

    async fecthFriends(username: string, page: number, limit: number): Promise<User[]> {
        const session = this.driver.session();
        const skip = (page - 1) * limit;
        const query = `
            MATCH (u:User {name: $username})-[r:FRIENDS_WITH]->(f:User)
            RETURN f.name as name, toString(r.created_at) as createdAt
            ORDER BY name ASC
            SKIP $skip
            LIMIT $limit
        `;
        try {
            const result = await session.run(query, { username, skip: Integer.fromNumber(skip), limit: Integer.fromNumber(limit) });
            return result.records.map(record => record.toObject() as User);
        } finally {
            await session.close();
        }
    }

    async deleteAllData(): Promise<void> {
        const session = this.driver.session();
        try {
            await session.run('MATCH (n) DETACH DELETE n');
        } catch (error) {
            console.error('Failed to clean up data:', error);
            throw error;
        } finally {
            await session.close();
        }
    }

    async findCircularReferrals(): Promise<{ user1: string; user2: string }[]> {
        const session = this.driver.session();
        const query = `
            MATCH (u1:User)-[:REFERRED]->(u2:User)
            WHERE (u2)-[:REFERRED]->(u1) AND id(u1) < id(u2)
            RETURN u1.name AS user1, u2.name AS user2
        `;
        try {
            const result = await session.run(query);
            return result.records.map(record => ({
                user1: record.get('user1'),
                user2: record.get('user2'),
            }));
        } finally {
            await session.close();
        }
    }

    async deleteSpecificUsers(userNames: string[]): Promise<void> {
        if (userNames.length === 0) {
            return;
        }
        const session = this.driver.session();
        try {
            await session.run(`
                UNWIND $userNames AS name
                MATCH (u:User {name: name})
                DETACH DELETE u
            `, { userNames });
        } catch (error) {
            console.error('Failed to clean up specific users:', error);
            throw error;
        } finally {
            await session.close();
        }
    }

    async findUsersWithMultipleReferrers(): Promise<UserReferralCount[]> {
        const session = this.driver.session();
        const query = `
            MATCH (:User)-[:REFERRED]->(referred:User)
            WITH referred, count(*) AS referrerCount
            WHERE referrerCount > 1
            RETURN referred.name AS name, referrerCount
            ORDER BY referrerCount DESC
        `;
        try {
            const result = await session.run(query);
            return result.records.map(record => ({
                name: record.get('name'),
                count: toNumber(record.get('referrerCount')),
            }));
        } finally {
            await session.close();
        }
    }

}