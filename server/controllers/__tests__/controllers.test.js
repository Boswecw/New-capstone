const assert = require('assert');

// Contact controller
const contactController = require('../contactController');
assert.strictEqual(typeof contactController.submitContact, 'function', 'submitContact should be a function');
assert.strictEqual(typeof contactController.getAllContacts, 'function', 'getAllContacts should be a function');

// Pet controller
const petController = require('../petController');
assert.strictEqual(typeof petController.getAllPets, 'function', 'getAllPets should be a function');
assert.strictEqual(typeof petController.getPetById, 'function', 'getPetById should be a function');

// User controller
const userController = require('../userController');
assert.strictEqual(typeof userController.register, 'function', 'register should be a function');
assert.strictEqual(typeof userController.login, 'function', 'login should be a function');

console.log('Controller smoke tests passed');
