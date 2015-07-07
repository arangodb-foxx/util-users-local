/*global exports */
'use strict';
class UserNotFound extends Error {
  constructor(uid) {
    super(`User with user id {uid} not found.`);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
}

class UsernameNotAvailable extends Error {
  constructor(username) {
    super(`The username {username} is not available or already taken.`);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
}

exports.UserNotFound = UserNotFound;
exports.UsernameNotAvailable = UsernameNotAvailable;