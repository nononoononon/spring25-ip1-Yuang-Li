import UserModel from '../../models/users.model';
import {
  deleteUserByUsername,
  getUserByUsername,
  loginUser,
  saveUser,
  updateUser,
} from '../../services/user.service';
import { SafeUser, User, UserCredentials } from '../../types/user';
import { user, safeUser } from '../mockData.models';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

describe('User model', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  describe('saveUser', () => {
    beforeEach(() => {
      mockingoose.resetAll();
    });

    it('should return the saved user', async () => {
      mockingoose(UserModel).toReturn(user, 'create');

      const savedUser = (await saveUser(user)) as SafeUser;

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toEqual(user.username);
      expect(savedUser.dateJoined).toEqual(user.dateJoined);
    });

    //  additional test cases for saveUser
    it('should return error when username already exists', async () => {
      mockingoose(UserModel).toReturn(user, 'findOne');

      const saved = await saveUser(user);
      expect(saved).toEqual({ error: 'Username already exists' });
    });

    it('should fill dateJoined with current time if not provided', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');
      const withoutDate = { ...user } as Omit<User, 'dateJoined'> as User;
      delete (withoutDate as Partial<User>).dateJoined;

      const before = new Date();
      mockingoose(UserModel).toReturn(
        {
          id: '123',
          username: user.username,
          password: user.password,
          dateJoined: new Date(),
        },
        'create',
      );

      const saved = (await saveUser(withoutDate as User)) as SafeUser;
      const after = new Date();

      expect(saved.dateJoined).toBeDefined();
      expect(saved.dateJoined.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(saved.dateJoined.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});

describe('getUserByUsername', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the matching user', async () => {
    mockingoose(UserModel).toReturn(safeUser, 'findOne');

    const retrievedUser = (await getUserByUsername(user.username)) as SafeUser;

    expect(retrievedUser.username).toEqual(user.username);
    expect(retrievedUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should return SafeUser and strip password when DB returns full User', async () => {
    // with password
    mockingoose(UserModel).toReturn(user, 'findOne');

    const resp = (await getUserByUsername('user1')) as SafeUser;

    expect('error' in resp).toBe(false);
    expect(resp.username).toBe('user1');
    expect(resp.dateJoined.toISOString()).toBe('2024-12-03T00:00:00.000Z');
    expect((resp as Partial<User>).password).toBeUndefined();
  });

  it('should return error when user is not found', async () => {
    mockingoose(UserModel).toReturn(null, 'findOne');

    const resp = await getUserByUsername('nope');
    expect(resp).toEqual({ error: 'User not found' });
  });
});

describe('loginUser', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the user if authentication succeeds', async () => {
    mockingoose(UserModel).toReturn(safeUser, 'findOne');

    const credentials: UserCredentials = {
      username: user.username,
      password: user.password,
    };

    const loggedInUser = (await loginUser(credentials)) as SafeUser;

    expect(loggedInUser.username).toEqual(user.username);
    expect(loggedInUser.dateJoined).toEqual(user.dateJoined);
  });

  // additional test cases for loginUser
  it('returns error for invalid credentials (no match)', async () => {
    mockingoose(UserModel).toReturn(null, 'findOne');

    const credentials: UserCredentials = {
      username: user.username,
      password: user.password,
    };
    const resp = await loginUser(credentials);
    expect(resp).toEqual({ error: 'Invalid credentials' });
  });

  it('returns error when username is missing/empty after trim', async () => {
    const resp1 = await loginUser({ username: '', password: 'secret' });
    expect(resp1).toEqual({ error: 'Invalid credentials' });

    const resp2 = await loginUser({ username: '   ', password: 'secret' });
    expect(resp2).toEqual({ error: 'Invalid credentials' });
  });

  it('returns error when password is missing/empty after trim', async () => {
    const resp1 = await loginUser({ username: 'user1', password: '' });
    expect(resp1).toEqual({ error: 'Invalid credentials' });

    const resp2 = await loginUser({ username: 'user1', password: '   ' });
    expect(resp2).toEqual({ error: 'Invalid credentials' });
  });
});

describe('deleteUserByUsername', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the deleted user when deleted succesfully', async () => {
    mockingoose(UserModel).toReturn(safeUser, 'findOneAndDelete');

    const deletedUser = (await deleteUserByUsername(user.username)) as SafeUser;

    expect(deletedUser.username).toEqual(user.username);
    expect(deletedUser.dateJoined).toEqual(user.dateJoined);
  });

  //  additional test cases for deleteUserByUsername
  it('should return error when user is not found', async () => {
    mockingoose(UserModel).toReturn(null, 'findOneAndDelete');

    const resp = await deleteUserByUsername('nope');
    expect(resp).toEqual({ error: 'User not found' });
  });

  it('should treat blank username as not found', async () => {
    mockingoose(UserModel).toReturn(null, 'findOneAndDelete');

    const resp1 = await deleteUserByUsername('');
    expect(resp1).toEqual({ error: 'User not found' });

    const resp2 = await deleteUserByUsername('    ');
    expect(resp2).toEqual({ error: 'User not found' });
  });
});

describe('updateUser', () => {
  const updatedUser: User = {
    ...user,
    password: 'newPassword',
  };

  const safeUpdatedUser: SafeUser = {
    username: user.username,
    dateJoined: user.dateJoined,
  };

  const updates: Partial<User> = {
    password: 'newPassword',
  };

  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the updated user when updated succesfully', async () => {
    mockingoose(UserModel).toReturn(safeUpdatedUser, 'findOneAndUpdate');

    const result = (await updateUser(user.username, updates)) as SafeUser;

    expect(result.username).toEqual(user.username);
    expect(result.username).toEqual(updatedUser.username);
    expect(result.dateJoined).toEqual(user.dateJoined);
    expect(result.dateJoined).toEqual(updatedUser.dateJoined);
  });

  // additional test cases for updateUser
  it('updates password successfully and returns SafeUser', async () => {
    const updatedDoc: User = { ...user, password: 'newPassword' };
    mockingoose(UserModel).toReturn(updatedDoc, 'findOneAndUpdate');

    const resp = (await updateUser('user1', { password: 'newPassword' })) as SafeUser;

    expect('error' in resp).toBe(false);
    expect(resp.username).toBe('user1');
    expect(resp.dateJoined.toISOString()).toBe('2024-12-03T00:00:00.000Z');
    expect('password' in resp).toBe(false);
  });

  it('returns error when user is not found', async () => {
    mockingoose(UserModel).toReturn(null, 'findOneAndUpdate');

    const resp = await updateUser('user1', { password: 'newPassword' });
    expect(resp).toEqual({ error: 'User not found' });
  });
});
