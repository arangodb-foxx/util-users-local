# The Local User Storage

The users-local utility service provides a username-based, collection-based user storage JavaScript API that can be used in other Foxx apps.

[![Build status](https://img.shields.io/travis/arangodb-foxx/util-users-local.svg)](https://travis-ci.org/arangodb-foxx/util-users-local)

## JavaScript API

This app exposes a user storage via a JavaScript API.

**Examples**

First add this app to your dependencies:

```js
{
  ...
  "dependencies": {
    "users": "users-local:^3.0.0"
  }
  ...
}
```

Once you've configured both apps correctly, you can use it like this:

```js
var users = applicationContext.dependencies.users;
var user = users.resolve(username);
```

### Exceptions

#### User Not Found

Indicates a user could not be found in the database.

`new users.errors.UserNotFound(userId)`

Thrown by the user storages *delete* and *get* methods if passed a user ID that does not exist in the database.

**Examples**

```js
try {
    users.get(invalidUserId);
} catch(err) {
    assertTrue(err instanceof users.errors.UserNotFound);
}
```

#### Username Not Available

Indicates a username is already in use.

`new users.errors.UsernameNotAvailable(username)`

Thrown by the user storages *create* method if passed a *userData* object with a *username* that is already in use.

**Examples**

```js
try {
    users.create('alreadyTaken', {some: 'data'});
} catch(err) {
    assertTrue(err instanceof users.errors.UsernameNotAvailable);
}
```

### The user object

User objects are instances of a Foxx model with the following attributes:

* *user*: the user's unique *username*
* *userData*: application-specific user data
* *authData*: an arbitrary object used by authentication apps to store sensitive data. For password authentication this could be a hash, for third-party authentication services this could be information about the user's identity. This attribute should never be exposed to the user directly

### Create a user

Creates and saves a new instance of the user model.

`users.create(username, [userData,] [authData])`

Throws *UsernameNotAvailable* if a user with the given username already exists.

*Note:* When using the system users app (mounted at */\_system/users*), new users will automatically have their *active* flag set to *true* if no value is provided in the *authData* (or if *authData* is omitted entirely).

*Parameter*

* *username*: an arbitrary string that will be used as the user's username
* *userData* (optional): an arbitrary object that will be stored as the user's *userData* attribute when the model is saved to the database
* *authData* (optional): an arbitrary object that will be stored as the user's *authData* attribute when the model is saved to the database

**Examples**

```js
var user = users.create('malaclypse', {hair: 'fuzzy'});
assertEqual(user.get('userData').hair, 'fuzzy');
```

### Fetch an existing user

There are two ways to fetch a user via the user storage API:

* resolving a *username* with the user storages *resolve* method
* calling the user storages *get* method with a user ID directly

#### Resolve a *username*

Fetches a user with a given *username*.

`users.resolve(username)`

If the username can not be resolved, `null` will be returned instead.

*Parameter*

* *username*: an arbitrary string matching the username of the user you are trying to fetch.

**Examples**

```js
var user = users.resolve('malaclypse');
assertEqual(user.user, 'malaclypse');
```

#### Resolve a user ID directly

Fetches a user with a given ID.

`users.get(userId)`

Attempts to fetch the user with the given ID from the database. If the user does not exist, an *UserNotFound* exception will be thrown instead.

*Parameter*

* *userId*: a user *_key*.

**Examples**

```js
var user = users.get(userId);
assertEqual(user.get('_key'), userId);
```

### Delete a user

There are two ways to delete a user from the database:

* calling the user storages *delete* method with a user ID directly
* telling a user to delete itself

#### Delete a user by its ID

Delete a user with a given ID.

`users.delete(userId)`

Attempts to delete the user with the given user ID from the database. If the user does not exist, a *UserNotFound* exception will be thrown. The method always returns *null*.

*Parameter*

* *userId*: a user *_key*.

**Examples**

```js
users.delete(userId);
```

#### Tell a user to delete itself

Delete a user from the database.

`user.delete()`

Attempts to delete the user from the database.

Returns *true* if the user was deleted successfully.

Returns *false* if the user already didn't exist.

**Examples**

```js
var user = users.get(userId);
user.delete();
```

### Save a user

Save a user to the database.

`user.save()`

In order to commit changes made to the user in your code you need to call this method.

**Examples**

```js
var userData = user.get('userData');
userData.counter++;
user.save();
```

## License

This code is distributed under the [Apache License](http://www.apache.org/licenses/LICENSE-2.0) by ArangoDB GmbH.
