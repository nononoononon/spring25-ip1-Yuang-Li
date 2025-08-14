import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as util from '../../services/user.service';
import { SafeUser, User } from '../../types/types';

const mockUser: User = {
  _id: new mongoose.Types.ObjectId(),
  username: 'user1',
  password: 'password',
  dateJoined: new Date('2024-12-03'),
};

const mockSafeUser: SafeUser = {
  _id: mockUser._id,
  username: 'user1',
  dateJoined: new Date('2024-12-03'),
};

const mockUserJSONResponse = {
  _id: mockUser._id?.toString(),
  username: 'user1',
  dateJoined: new Date('2024-12-03').toISOString(),
};

const saveUserSpy = jest.spyOn(util, 'saveUser');
const loginUserSpy = jest.spyOn(util, 'loginUser');
const updatedUserSpy = jest.spyOn(util, 'updateUser');
const getUserByUsernameSpy = jest.spyOn(util, 'getUserByUsername');
const deleteUserByUsernameSpy = jest.spyOn(util, 'deleteUserByUsername');

describe('Test userController', () => {
  describe('POST /signup', () => {
    it('should create a new user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      saveUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(saveUserSpy).toHaveBeenCalledWith({ ...mockReqBody, dateJoined: expect.any(Date) });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    // additional test cases for signupRoute
    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };
      const response = await supertest(app).post('/user/signup').send(mockReqBody);
      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 500 when username already exists (service returns error)', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };
      saveUserSpy.mockResolvedValueOnce({ error: 'Username already exists' });
      const response = await supertest(app).post('/user/signup').send(mockReqBody);
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Username already exists' });
    });

    it('should return 500 when service throws', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };
      saveUserSpy.mockRejectedValueOnce(new Error('boom'));
      const response = await supertest(app).post('/user/signup').send(mockReqBody);
      expect(response.status).toBe(500);
      expect(response.text).toEqual('Error when creating user');
    });
  });

  describe('POST /login', () => {
    it('should succesfully login for a user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      loginUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(loginUserSpy).toHaveBeenCalledWith(mockReqBody);
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    // additional test cases for loginRoute
    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };
      const response = await supertest(app).post('/user/login').send({ username: 'user1' });
      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 500 on invalid credentials (service returns error)', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };
      loginUserSpy.mockResolvedValueOnce({ error: 'Invalid credentials' });
      const response = await supertest(app).post('/user/login').send(mockReqBody);
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });

    it('should return 500 when service throws', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };
      loginUserSpy.mockRejectedValueOnce(new Error('boom'));
      const response = await supertest(app).post('/user/login').send(mockReqBody);
      expect(response.status).toBe(500);
      expect(response.text).toEqual('Error when logging in');
    });
  });

  describe('PATCH /resetPassword', () => {
    it('should succesfully return updated user object given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...mockUserJSONResponse });
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, { password: 'newPassword' });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: 'newPassword',
      };

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    // additional test cases for resetPasswordRoute
    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };
      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);
      expect(response.status).toBe(400);
      expect(response.text).toEqual('new password is required');
    });

    it('should return 500 when service returns error', async () => {
      updatedUserSpy.mockResolvedValueOnce({ error: 'User not found' });
      const response = await supertest(app)
          .patch('/user/resetPassword')
          .send({ username: 'user1', password: 'new' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'User not found' });
    });

  });

  describe('GET /getUser', () => {
    it('should return the user given correct arguments', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).get(`/user/getUser/${mockUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(getUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should return 404 if username not provided', async () => {
      // Express automatically returns 404 for missing parameters when
      // defined as required in the route
      const response = await supertest(app).get('/user/getUser/');
      expect(response.status).toBe(404);
    });

    //  additional test cases for getUserRoute
    it('should return 400 when username is only spaces', async () => {
      // %20%20%20 -> "   " -> after trim
      const response = await supertest(app).get('/user/getUser/%20%20%20');
      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid username is required');
    });
    it('should return 500 when service returns error', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce({ error: 'User not found' });
      const response = await supertest(app).get('/user/getUser/user1');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });

  describe('DELETE /deleteUser', () => {
    it('should return the deleted user given correct arguments', async () => {
      deleteUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).delete(`/user/deleteUser/${mockUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(deleteUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should return 404 if username not provided', async () => {
      // Express automatically returns 404 for missing parameters when
      // defined as required in the route
      const response = await supertest(app).delete('/user/deleteUser/');
      expect(response.status).toBe(404);
    });


    // additional test cases for deleteUserRoute
    it('should return 400 when username is only spaces', async () => {
      const response = await supertest(app).delete('/user/deleteUser/%20%20%20');
      expect(response.status).toBe(404);
    });

    it('should return 500 when service returns error', async () => {
      deleteUserByUsernameSpy.mockResolvedValueOnce({ error: 'User not found' });
      const response = await supertest(app).delete('/user/deleteUser/user1');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });
});
