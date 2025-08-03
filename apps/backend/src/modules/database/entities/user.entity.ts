export interface RegisterUser {
    name: string;
    created_at: string;
  }
  
  export interface ReferralRelationShip {
    referredBy: string;
    user: string;
    created_at: string;
  }
  
  export interface AddFriendRelationShip {
    user1_name: string;
    user2_name: string;
    created_at: string;
  }
  
  export interface UnfriendRelationShip {
    user1_name: string;
    user2_name: string;
    created_at: string;
  }


export interface CreateUserAndRelationShip {
    registerUser: RegisterUser[];
    referralRelationShip: ReferralRelationShip[];
    addFriendRelationShip: AddFriendRelationShip[];
    unFriendRelationShip: UnfriendRelationShip[];
}