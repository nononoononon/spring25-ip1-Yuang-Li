import UserModel from '../models/users.model';
import { SafeUser, User, UserCredentials, UserResponse } from '../types/types';

/**
 * Converts a full User object into a SafeUser object by removing `password`.
 *
 * @param {User} u - The complete User object.
 * @returns {SafeUser} - A safe version of the user object that excludes the `password` field,
 */
const toSafeUser = (u: User): SafeUser => {
  const { _id: id, username, dateJoined } = u;
  return { _id: id, username, dateJoined };
};

const errorResp = (message: string): UserResponse => ({ error: message });

/**
 * Saves a new user to the database.
 *
 * @param {User} user - The user object to be saved, containing user details like username, password, etc.
 * @returns {Promise<UserResponse>} - Resolves with the saved user object (without the password) or an error message.
 */
export const saveUser = async (user: User): Promise<UserResponse> => {
  try {
    const username = user?.username?.trim();
    const password = user?.password?.trim();

    const exists = await UserModel.findOne({ username }).lean<User | null>();
    if (exists) return errorResp('Username already exists');

    const newUser = await UserModel.create({
      username,
      password,
      dateJoined: new Date(),
    });
    return toSafeUser(newUser.toObject() as User);
  } catch (err) {
    return { error: 'Failed to create user' };
  }
};

/**
 * Retrieves a user from the database by their username.
 *
 * @param {string} username - The username of the user to find.
 * @returns {Promise<UserResponse>} - Resolves with the found user object (without the password) or an error message.
 */
export const getUserByUsername = async (username: string): Promise<UserResponse> => {
  try {
    const u = username?.trim();
    const doc = await UserModel.findOne({ username: u }).lean<User | null>();
    if (!doc) return errorResp('User not found');
    return toSafeUser(doc);
  } catch (err) {
    return { error: 'Failed to get user' };
  }
};

/**
 * Authenticates a user by verifying their username and password.
 *
 * @param {UserCredentials} loginCredentials - An object containing the username and password.
 * @returns {Promise<UserResponse>} - Resolves with the authenticated user object (without the password) or an error message.
 */
export const loginUser = async (loginCredentials: UserCredentials): Promise<UserResponse> => {
  try {
    const username = loginCredentials?.username?.trim();
    const password = loginCredentials?.password?.trim();

    const doc = await UserModel.findOne({ username }).lean<User | null>();
    if (!doc || doc.password !== password) return errorResp('Invalid credentials');

    return toSafeUser(doc);
  } catch (err) {
    return { error: 'Failed to login' };
  }
};

/**
 * Deletes a user from the database by their username.
 *
 * @param {string} username - The username of the user to delete.
 * @returns {Promise<UserResponse>} - Resolves with the deleted user object (without the password) or an error message.
 */
export const deleteUserByUsername = async (username: string): Promise<UserResponse> => {
  try {
    const u = username?.trim();

    const doc = await UserModel.findOneAndDelete({ username: u }).lean<User | null>();
    if (!doc) return errorResp('User not found');

    return toSafeUser(doc);
  } catch (err) {
    return { error: 'Failed to delete user' };
  }
};

/**
 * Updates user information in the database.
 *
 * @param {string} username - The username of the user to update.
 * @param {Partial<User>} updates - An object containing the fields to update and their new values.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const updateUser = async (
  username: string,
  updates: Partial<User>,
): Promise<UserResponse> => {
  try {
    const u = username?.trim();

    const patch: Partial<User> = {};
    if (typeof updates.password === 'string') patch.password = updates.password.trim();
    if (typeof updates.username === 'string') patch.username = updates.username.trim();

    const updated = (await UserModel.findOneAndUpdate(
      { username: u },
      { $set: patch },
      { new: true, lean: true },
    ).exec()) as User | null;

    if (!updated) return errorResp('User not found');
    return toSafeUser(updated);
  } catch (err) {
    return { error: 'Failed to update user' };
  }
};
