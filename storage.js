/*global require, exports, applicationContext */
'use strict';
var isSystem = Boolean(applicationContext.mount.match(/^\/?_/));
var _ = require('underscore');
var joi = require('joi');
var arangodb = require('org/arangodb');
var db = arangodb.db;
var Foxx = require('org/arangodb/foxx');
var errors = require('./errors');
var User = Foxx.Model.extend({
  schema: {
    user: joi.string().required(),
    authData: joi.object().required(),
    userData: joi.object().required()
  }
});
var users = new Foxx.Repository(
    isSystem
    ? db._collection('_users')
    : applicationContext.collection('users'),
    {model: User}
);


function resolve(username) {
  var user = users.firstExample({user: username});
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
  if (isSystem && !authData.hasOwnProperty('active')) {
    authData.active = true;
  }

  if (!username) {
    throw new Error('Must provide username!');
  }
  var user;
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
  if (isSystem) {
    require('org/arangodb/users').reload();
  }
  return user;
}

function getUser(uid) {
  var user;
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
  if (isSystem) {
    require('org/arangodb/users').reload();
  }
  return null;
}

_.extend(User.prototype, {
  save: function () {
    var user = this;
    users.replace(user);
    if (isSystem) {
      require('org/arangodb/users').reload();
    }
    return user;
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
    if (isSystem) {
      require('org/arangodb/users').reload();
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