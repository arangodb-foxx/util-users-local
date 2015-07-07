/*global require, exports, applicationContext */
'use strict';
const _ = require('underscore');
const joi = require('joi');
const arangodb = require('org/arangodb');
const db = arangodb.db;
const Foxx = require('org/arangodb/foxx');
const errors = require('./errors');
const User = Foxx.Model.extend({
  schema: {
    user: joi.string().required(),
    authData: joi.object().required(),
    userData: joi.object().required()
  }
});
const users = new Foxx.Repository(
  applicationContext.collection('users'),
  {model: User}
);

function resolve(username) {
  const user = users.firstExample({user: username});
  if (!user.get('_key')) {
    return null;
  }
  return user;
}

function listUsers() {
  return users.collection.all().toArray().map(function (user) {
    return user.user;
  }).filter(Boolean);
}

function createUser(username, userData, authData) {
  if (!userData) {
    userData = {};
  }
  if (!authData) {
    authData = {};
  }

  if (!username) {
    throw new Error('Must provide username!');
  }
  let user;
  db._executeTransaction({
    collections: {
      read: [users.collection.name()],
      write: [users.collection.name()]
    },
    action: function () {
      if (resolve(username)) {
        throw new errors.UsernameNotAvailable(username);
      }
      user = new User({
        user: username,
        userData: userData,
        authData: authData
      });
      users.save(user);
    }
  });
  return user;
}

function getUser(uid) {
  let user;
  try {
    user = users.byId(uid);
  } catch (err) {
    if (
      err instanceof arangodb.ArangoError
      && err.errorNum === arangodb.ERROR_ARANGO_DOCUMENT_NOT_FOUND
    ) {
      throw new errors.UserNotFound(uid);
    }
    throw err;
  }
  return user;
}

function deleteUser(uid) {
  try {
    users.removeById(uid);
  } catch (err) {
    if (
      err instanceof arangodb.ArangoError
      && err.errorNum === arangodb.ERROR_ARANGO_DOCUMENT_NOT_FOUND
    ) {
      throw new errors.UserNotFound(uid);
    }
    throw err;
  }
  return null;
}

_.extend(User.prototype, {
  save: function () {
    users.replace(this);
    return this;
  },
  delete: function () {
    try {
      deleteUser(this.get('_key'));
    } catch (e) {
      if (e instanceof errors.UserNotFound) {
        return false;
      }
      throw e;
    }
    return true;
  }
});

exports.resolve = resolve;
exports.list = listUsers;
exports.create = createUser;
exports.get = getUser;
exports.delete = deleteUser;
exports.errors = errors;
exports.repository = users;