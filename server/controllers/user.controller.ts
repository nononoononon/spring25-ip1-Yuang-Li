import express, { Response, Router } from 'express';
import { UserRequest, User, UserCredentials, UserByUsernameRequest } from '../types/types';
import {
  deleteUserByUsername,
  getUserByUsername,
  loginUser,
  saveUser,
  updateUser,
} from '../services/user.service';

const userController = () => {
  const router: Router = express.Router();

  /**
   * Validates that the request body contains all required fields for a user.
   * @param req The incoming request containing user data.
   * @returns `true` if the body contains valid user fields; otherwise, `false`.
   */
  const isUserBodyValid = (req: UserRequest): boolean => {
    const u = req?.body?.username;
    const p = req?.body?.password;

    const hasValidUsername = typeof u === 'string' && u.trim().length > 0;
    const hasValidPassword = typeof p === 'string' && p.trim().length > 0;

    return hasValidUsername && hasValidPassword;
  };

  /**
   * Handles the creation of a new user account.
   * @param req The request containing username, email, and password in the body.
   * @param res The response, either returning the created user or an error.
   * @returns A promise resolving to void.
   */
  const createUser = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      if (!isUserBodyValid(req)) {
        res.status(400).json({ error: 'username and password are required' });
        return;
      }

      const resp = await saveUser({
        username: req.body.username.trim(),
        password: req.body.password.trim(),
        dateJoined: new Date(),
      } as User);

      if ('error' in resp) {
        res.status(500).json(resp);
        return;
      }
      res.status(201).json(resp);
    } catch (err: unknown) {
      res.status(500).send('Error when creating user');
    }
  };

  /**
   * Handles user login by validating credentials.
   * @param req The request containing username and password in the body.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const userLogin = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      if (!isUserBodyValid(req)) {
        res.status(400).json({ error: 'username and password are required' });
        return;
      }
      const creds: UserCredentials = {
        username: req.body.username.trim(),
        password: req.body.password.trim(),
      };

      const resp = await loginUser(creds);
      if ('error' in resp) {
        res.status(500).json(resp);
        return;
      }
      res.status(200).json(resp);
    } catch (err: unknown) {
      res.status(500).send('Error when logging in');
    }
  };

  /**
   * Retrieves a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const getUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const uname = req?.body?.username;
      if (!uname) {
        res.status(400).send('Invalid username is required');
      }

      const resp = await getUserByUsername(uname);
      if ('error' in resp) {
        res.status(500).json(resp);
        return;
      }
      res.status(200).json(resp);
    } catch (err: unknown) {
      res.status(500).send('Error when fetching user');
    }
  };

  /**
   * Deletes a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either the successfully deleted user object or returning an error.
   * @returns A promise resolving to void.
   */
  const deleteUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const uname = req?.body?.username;
      if (!uname) {
        res.status(400).send('Invalid username is required');
      }

      const resp = await deleteUserByUsername(uname);
      if ('error' in resp) {
        res.status(500).json(resp);
        return;
      }
      res.status(200).json(resp);
    } catch (err: unknown) {
      res.status(500).send('Error when deleting user');
    }
  };

  /**
   * Resets a user's password.
   * @param req The request containing the username and new password in the body.
   * @param res The response, either the successfully updated user object or returning an error.
   * @returns A promise resolving to void.
   */
  const resetPassword = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      const uname = req?.params?.username?.trim();
      const newPwd = req?.body?.password?.trim();

      if (!uname) {
        res.status(400).json({ error: 'username is required' });
        return;
      }
      if (!newPwd) {
        res.status(400).json({ error: 'new password is required' });
        return;
      }

      const resp = await updateUser(uname, { password: newPwd });
      if ('error' in resp) {
        res.status(500).json(resp);
        return;
      }
      res.status(200).json(resp);
    } catch (err: unknown) {
      res.status(500).send('Error when resetting password');
    }
  };

  router.post('/users', createUser);
  router.post('/users/login', userLogin);
  router.get('/users/:username', getUser);
  router.delete('/users/:username', deleteUser);
  router.patch('/users/:username/password', resetPassword);
  return router;
};

export default userController;
