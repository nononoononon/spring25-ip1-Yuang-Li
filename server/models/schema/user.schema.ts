import { Schema } from 'mongoose';

/**
 * Mongoose schema for the User collection.
 *
 * This schema defines the structure for storing users in the database.
 * Each User includes the following fields:
 * - `username`: The username of the user.
 * - `password`: The password securing the user's account.
 * - `dateJoined`: The date the user joined the platform.
 */
const userSchema: Schema = new Schema(
  {
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    dateJoined: { type: Date, default: Date.now, required: true },
  },
  { collection: 'User' },
);

export default userSchema;
