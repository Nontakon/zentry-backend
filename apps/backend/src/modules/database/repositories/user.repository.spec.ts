import { Test, TestingModule } from '@nestjs/testing';
import { OGM } from '@neo4j/graphql-ogm';
import { Driver } from 'neo4j-driver';
import { DatabaseModule, NEO4J_DRIVER, NEO4J_OGM } from '../database.module'; 
import { UserRepository } from './user.repository';
import { CreateUserAndRelationShip } from '../entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { typeDefs } from '../type-defs/type-defs';
const getPastDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

describe('UserRepository (Integration)', () => {
  let repository: UserRepository;
  let driver: Driver;
  let ogm: OGM;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        DatabaseModule],
      providers: [UserRepository],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    driver = module.get<Driver>(NEO4J_DRIVER);
    ogm = module.get<OGM>(NEO4J_OGM);

    const session = driver.session();
    try {
        await session.run('CREATE CONSTRAINT User_name_unique IF NOT EXISTS FOR (u:User) REQUIRE u.name IS UNIQUE');
    } finally {
        await session.close();
    }

    await ogm.init();
    repository.onModuleInit();
    await ogm.assertIndexesAndConstraints();
    // Clean all data before starting all tests
    await repository.deleteAllData();
  });

  afterAll(async () => {
    // Clean all data after all tests have finished
    await repository.deleteAllData();
    await driver.close();
  });

  describe('bulkUpsertUserAndRelationShips', () => {
    it('should create users, add friends, handle referrals, and unfriend correctly', async () => {
      const usersToCreate = [
        { name: 'Alice', created_at: getPastDate(10) },
        { name: 'Bob', created_at: getPastDate(10) },
        { name: 'Charlie', created_at: getPastDate(9) },
        { name: 'David', created_at: getPastDate(9) },
        { name: 'Eve', created_at: getPastDate(8) },
      ];
      const userNamesToClean = usersToCreate.map(u => u.name);

      try {
        // 1. Initial data setup
        const initialData: CreateUserAndRelationShip = {
          registerUser: usersToCreate,
          referralRelationShip: [
            { referredBy: 'Alice', user: 'Bob', created_at: getPastDate(10) },
            { referredBy: 'Bob', user: 'Charlie', created_at: getPastDate(9) },
          ],
          addFriendRelationShip: [
            { user1_name: 'Alice', user2_name: 'Bob', created_at: getPastDate(8) },
            { user1_name: 'Bob', user2_name: 'Charlie', created_at: getPastDate(7) },
            { user1_name: 'Charlie', user2_name: 'David', created_at: getPastDate(6) },
          ],
          unFriendRelationShip: [],
        };
        await repository.bulkUpsertUserAndRelationShips(initialData);

        // 2. Verify initial state
        const aliceFriends = await repository.countTotalFriends('Alice');
        expect(aliceFriends).toBe(1);
        const bobNetwork = await repository.findUserNetWork('Bob');
        expect(bobNetwork).not.toBeNull();
        expect(bobNetwork?.friends.map(f => f.name)).toContain('Alice');
        expect(bobNetwork?.friends.map(f => f.name)).toContain('Charlie');

        // 3. Unfriend operation
        const unfriendData: CreateUserAndRelationShip = {
          registerUser: [],
          referralRelationShip: [],
          addFriendRelationShip: [],
          unFriendRelationShip: [{ user1_name: 'Bob', user2_name: 'Charlie' }],
        };
        await repository.bulkUpsertUserAndRelationShips(unfriendData);
        
        // 4. Verify final state
        const bobFriendsAfterUnfriend = await repository.countTotalFriends('Bob');
        expect(bobFriendsAfterUnfriend).toBe(1);
      } finally {
        await repository.deleteSpecificUsers(userNamesToClean);
      }
    });

    it('should not create a duplicate user when a user with the same name already exists', async () => {
        const duplicateUserName = 'DuplicateUser';
        const initialDate = getPastDate(5);
        const laterDate = getPastDate(1);
        const userNamesToClean = [duplicateUserName];
      
        try {
          // 1. Create the user for the first time
          const initialCreation: CreateUserAndRelationShip = {
            registerUser: [{ name: duplicateUserName, created_at: initialDate }],
            referralRelationShip: [],
            addFriendRelationShip: [],
            unFriendRelationShip: [],
          };
          await repository.bulkUpsertUserAndRelationShips(initialCreation);
      
          // 2. Verify the user was created with the initial timestamp
          const session = driver.session();
          let result = await session.run('MATCH (u:User {name: $name}) RETURN u.created_at as createdAt', { name: duplicateUserName });
          await session.close();
          expect(result.records.length).toBe(1);
          
          // Convert both dates to milliseconds since epoch for accurate comparison
          const expectedTimeMs = new Date(initialDate).getTime();
          const receivedTimeMs = result.records[0].get('createdAt').toStandardDate().getTime();
          expect(receivedTimeMs).toBe(expectedTimeMs);
      
          // 3. Attempt to create the same user again with a different timestamp
          const duplicateCreation: CreateUserAndRelationShip = {
            registerUser: [{ name: duplicateUserName, created_at: laterDate }],
            referralRelationShip: [],
            addFriendRelationShip: [],
            unFriendRelationShip: [],
          };
          await repository.bulkUpsertUserAndRelationShips(duplicateCreation);
      
          // 4. Verify that no new user was created and the timestamp was NOT updated
          const finalSession = driver.session();
          result = await finalSession.run('MATCH (u:User {name: $name}) RETURN u.created_at as createdAt', { name: duplicateUserName });
          await finalSession.close();
          
          // There should still be only one user with this name
          expect(result.records.length).toBe(1); 
          // The created_at timestamp should remain the initial one, because ON CREATE did not run
          const finalReceivedTimeMs = result.records[0].get('createdAt').toStandardDate().getTime();
          expect(finalReceivedTimeMs).toBe(expectedTimeMs);
      
        } finally {
          await repository.deleteSpecificUsers(userNamesToClean);
        }
      });
  });

  describe('Query Functions', () => {
    const testUsers = [
        { name: 'UserA', created_at: getPastDate(30) },
        { name: 'UserB', created_at: getPastDate(29) },
        { name: 'UserC', created_at: getPastDate(28) },
        { name: 'UserD', created_at: getPastDate(15) },
        { name: 'UserE', created_at: getPastDate(14) },
        { name: 'UserF', created_at: getPastDate(5) },
        { name: 'UserG', created_at: getPastDate(1) },
    ];
    const userNamesToClean = testUsers.map(u => u.name);

    beforeEach(async () => {
        const testData: CreateUserAndRelationShip = {
            registerUser: testUsers,
            referralRelationShip: [
                { referredBy: 'UserA', user: 'UserB', created_at: getPastDate(29) },
                { referredBy: 'UserB', user: 'UserC', created_at: getPastDate(28) },
                { referredBy: 'UserA', user: 'UserD', created_at: getPastDate(15) },
                { referredBy: 'UserD', user: 'UserE', created_at: getPastDate(14) },
            ],
            addFriendRelationShip: [
                { user1_name: 'UserA', user2_name: 'UserB', created_at: getPastDate(25) },
                { user1_name: 'UserA', user2_name: 'UserC', created_at: getPastDate(24) },
                { user1_name: 'UserD', user2_name: 'UserF', created_at: getPastDate(4) },
                { user1_name: 'UserA', user2_name: 'UserG', created_at: getPastDate(1) },
            ],
            unFriendRelationShip: [],
        };
        await repository.bulkUpsertUserAndRelationShips(testData);
    });

    afterEach(async () => {
        await repository.deleteSpecificUsers(userNamesToClean);
    });

    it('findUserNetWork: should return the correct network for a user', async () => {
      const network = await repository.findUserNetWork('UserA');
      expect(network).not.toBeNull();
      expect(network?.friends.map(f => f.name).sort()).toEqual(['UserB', 'UserC', 'UserG']);
    });

    it('findInfluentialUsers: should return top users among friends of a specific user', async () => {
      const friendsOfA = await repository.findInfluentialUsers(3, 'UserA');
      expect(friendsOfA.map(u => u.name).sort()).toEqual(['UserB', 'UserC', 'UserG']);
    });

    it('findStrengthLeaderboard: should return users sorted by network activity since a given date', async () => {
      const since = getPastDate(20); // Activities from UserD, E, F, G should be counted
      const leaderboard = await repository.findStrengthLeaderboard(3, since);
      expect(leaderboard.length).toBe(3);
      expect(leaderboard[0].name).toBe('UserD'); // 1 friend, 1 referred, 1 referrer = 3
      expect(leaderboard[1].name).toBe('UserA'); // 1 friend (G)
      expect(leaderboard[2].name).toBe('UserF'); // 1 friend
    });

    it('findStrengthLeaderboard: should return users with score 0 if no activity since given date', async () => {
      const since = new Date().toISOString(); // A date in the future
      const leaderboard = await repository.findStrengthLeaderboard(3, since);
      // The top score should be 0 as there is no activity after 'now'
      const topScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
      expect(topScore).toBe(0);
    });

    it('findReferralLeaderboard: should return users sorted by referral count (up to 2 levels)', async () => {
        const since = getPastDate(40);
        const leaderboard = await repository.findReferralLeaderboard(3, since);
        expect(leaderboard.length).toBe(3);
        expect(leaderboard[0].name).toBe('UserA'); // Refers B, D. B refers C. D refers E. Total distinct: B,C,D,E = 4
        expect(leaderboard[0].score).toBe(4);
        expect(leaderboard[1].name).toBe('UserB'); // Refers C = 1
        expect(leaderboard[1].score).toBe(1);
        expect(leaderboard[2].name).toBe('UserD'); // Refers E = 1
        expect(leaderboard[2].score).toBe(1);
    });

    it('findReferralLeaderboard: should only count referrals up to 2 levels deep', async () => {
      // Add a 3rd level referral: UserC -> a new user 'UserH'
      await repository.bulkUpsertUserAndRelationShips({
          registerUser: [{ name: 'UserH', created_at: getPastDate(1) }],
          referralRelationShip: [
              { referredBy: 'UserC', user: 'UserH', created_at: getPastDate(1) }
          ],
          addFriendRelationShip: [],
          unFriendRelationShip: [],
      });
  
      const since = getPastDate(40);
      const leaderboard = await repository.findReferralLeaderboard(1, since);
      
      // UserA refers B (1) and D (1). B refers C (2). D refers E (2). C refers H (3).
      // So UserA's score should still be 4.
      expect(leaderboard.length).toBe(1);
      expect(leaderboard[0].name).toBe('UserA');
      expect(leaderboard[0].score).toBe(4);

      await repository.deleteSpecificUsers(['UserH']);
    });
  
    it('findReferralLeaderboard: should return an empty array if no referrals since given date', async () => {
        const since = new Date().toISOString(); // A date in the future
        const leaderboard = await repository.findReferralLeaderboard(3, since);
        // The MATCH path will fail because of the WHERE clause on relationship creation date, so it should return an empty array.
        expect(leaderboard.length).toBe(0);
    });
  });

  describe('Relationship Edge Cases', () => {
    const edgeCaseUsers = [
        { name: 'EdgeUser1', created_at: getPastDate(2) },
        { name: 'EdgeUser2', created_at: getPastDate(2) },
        { name: 'EdgeUser3', created_at: getPastDate(2) },
    ];
    const userNamesToClean = edgeCaseUsers.map(u => u.name);

    beforeEach(async () => {
      await repository.bulkUpsertUserAndRelationShips({
        registerUser: edgeCaseUsers,
        referralRelationShip: [], addFriendRelationShip: [], unFriendRelationShip: []
      });
    });

    afterEach(async () => {
        await repository.deleteSpecificUsers(userNamesToClean);
    });

    it('should handle circular referrals correctly', async () => {
      const circularReferral: CreateUserAndRelationShip = {
        registerUser: [],
        referralRelationShip: [
          { referredBy: 'EdgeUser1', user: 'EdgeUser2', created_at: getPastDate(1) },
          { referredBy: 'EdgeUser2', user: 'EdgeUser1', created_at: getPastDate(1) },
        ], addFriendRelationShip: [], unFriendRelationShip: []
      };
      await repository.bulkUpsertUserAndRelationShips(circularReferral);

      const network1 = await repository.findUserNetWork('EdgeUser1');
      expect(network1).not.toBeNull();
      const referredBy = await repository.findUserNetWork('EdgeUser1').then(n => n?.referredBy);
      expect(referredBy).not.toBeNull();
      expect(referredBy?.name).toBe('EdgeUser2');
    });

    it('findCircularReferrals: should find pairs of users who referred each other', async () => {
        const circularReferralData: CreateUserAndRelationShip = {
          registerUser: [],
          referralRelationShip: [
            { referredBy: 'EdgeUser1', user: 'EdgeUser2', created_at: getPastDate(1) },
            { referredBy: 'EdgeUser2', user: 'EdgeUser1', created_at: getPastDate(1) },
          ], addFriendRelationShip: [], unFriendRelationShip: []
        };
        await repository.bulkUpsertUserAndRelationShips(circularReferralData);
  
        const circularPairs = await repository.findCircularReferrals();
  
        expect(circularPairs.length).toBe(1);
        const names = [circularPairs[0].user1, circularPairs[0].user2].sort();
        expect(names).toEqual(['EdgeUser1', 'EdgeUser2']);
    });

    it('should handle duplicate FRIEND_WITH relationship creation idempotently', async () => {
      const addFriendPayload: CreateUserAndRelationShip = {
        registerUser: [],
        referralRelationShip: [],
        addFriendRelationShip: [{ user1_name: 'EdgeUser1', user2_name: 'EdgeUser2', created_at: getPastDate(1) }],
        unFriendRelationShip: [],
      };
      
      // Create relationship for the first time
      await repository.bulkUpsertUserAndRelationShips(addFriendPayload);
      
      // Create relationship for the second time
      await repository.bulkUpsertUserAndRelationShips(addFriendPayload);

      // Verify there is only one relationship in each direction
      const session = driver.session();
      const result = await session.run(
        'MATCH (u1:User {name: $u1})-[r:FRIENDS_WITH]->(u2:User {name: $u2}) RETURN count(r) as count',
        { u1: 'EdgeUser1', u2: 'EdgeUser2' }
      );
      await session.close();
      
      expect(result.records[0].get('count').toNumber()).toBe(1);
    });

    it('should handle duplicate REFERRED relationship creation idempotently', async () => {
      const addReferralPayload: CreateUserAndRelationShip = {
        registerUser: [],
        addFriendRelationShip: [],
        referralRelationShip: [{ referredBy: 'EdgeUser1', user: 'EdgeUser2', created_at: getPastDate(1) }],
        unFriendRelationShip: [],
      };

      // Create relationship for the first time
      await repository.bulkUpsertUserAndRelationShips(addReferralPayload);

      // Create relationship for the second time
      await repository.bulkUpsertUserAndRelationShips(addReferralPayload);

      // Verify there is only one relationship
      const session = driver.session();
      const result = await session.run(
        'MATCH (u1:User {name: $u1})-[r:REFERRED]->(u2:User {name: $u2}) RETURN count(r) as count',
        { u1: 'EdgeUser1', u2: 'EdgeUser2' }
      );
      await session.close();

      expect(result.records[0].get('count').toNumber()).toBe(1);
    });

    it('findUsersWithMultipleReferrers: should find users referred by more than one person', async () => {
      // Setup: 1->3, 2->3 (User3 is referred by 2 people)
      //        1->4 (User4 is referred by 1 person)
      const payload: CreateUserAndRelationShip = {
          registerUser: [],
          addFriendRelationShip: [],
          referralRelationShip: [
              { referredBy: 'EdgeUser1', user: 'EdgeUser3', created_at: getPastDate(1) },
              { referredBy: 'EdgeUser2', user: 'EdgeUser3', created_at: getPastDate(1) },
              { referredBy: 'EdgeUser1', user: 'EdgeUser4', created_at: getPastDate(1) },
          ],
          unFriendRelationShip: [],
      };
      await repository.bulkUpsertUserAndRelationShips(payload);

      const result = await repository.findUsersWithMultipleReferrers();

      expect(result.length).toBe(1); // Only one user should be in the list
      expect(result[0].name).toBe('EdgeUser3');
      expect(result[0].count).toBe(2);
    });
  });

  describe('Load Tests', () => {
    it('should handle 100,000 records for bulkUpsertUserAndRelationShips in under 10 seconds', async () => {
      jest.setTimeout(20000);

      const userCount = 40000;
      const friendCount = 30000;
      const referralCount = 30000;

      console.log('\nGenerating 100,000 records for load test...');

      const usersToCreate = Array.from({ length: userCount }, (_, i) => ({
        name: `LoadTestUser_${i}`,
        created_at: getPastDate(1),
      }));
      const userNamesToClean = usersToCreate.map(u => u.name);

      const friendsToAdd = Array.from({ length: friendCount }, (_, i) => ({
        user1_name: `LoadTestUser_${i}`,
        user2_name: `LoadTestUser_${i + 1}`,
        created_at: getPastDate(1),
      }));

      const referralsToAdd = Array.from({ length: referralCount }, (_, i) => ({
        referredBy: `LoadTestUser_${i}`,
        user: `LoadTestUser_${i + 2}`,
        created_at: getPastDate(1),
      }));

      const loadTestData: CreateUserAndRelationShip = {
        registerUser: usersToCreate,
        addFriendRelationShip: friendsToAdd,
        referralRelationShip: referralsToAdd,
        unFriendRelationShip: [],
      };
      try {
        console.log('Data generation complete. Starting bulk upsert...');
        const startTime = Date.now();
        
        await repository.bulkUpsertUserAndRelationShips(loadTestData);
        
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`Load Test (100,000 records) took ${duration} ms.`);

        expect(duration).toBeLessThan(10000); // 10 seconds
      } finally {
        await repository.deleteSpecificUsers(userNamesToClean);
      }
    });
  });
});
