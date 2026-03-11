// Define schema for custom classes and extend built-in classes

// Extend User class schema with email verification fields
const userSchema = new Parse.Schema('_User');

// Add email verification fields
userSchema.addString('emailVerificationToken');
userSchema.addDate('emailVerificationTokenCreatedAt');
userSchema.addBoolean('emailVerified');

// Save/update the schema
userSchema.save().catch((error) => {
  // Schema might already exist or some fields might be defined
  // This is expected on subsequent runs
  if (error.code !== Parse.Error.INVALID_CLASS_NAME) {
    console.log('User schema update info:', error.message);
  }
});

// Example: Define TodoList class schema for future scenarios
const todoSchema = new Parse.Schema('TodoList');

todoSchema.addString('title');
todoSchema.addString('description');
todoSchema.addBoolean('completed', { defaultValue: false });
todoSchema.addString('priority', { defaultValue: 'medium' });
todoSchema.addDate('dueDate');
todoSchema.addPointer('owner', '_User');

// Create TodoList schema if it doesn't exist
todoSchema.save().catch((error) => {
  if (error.code !== Parse.Error.DUPLICATE_VALUE) {
    console.log('TodoList schema info:', error.message);
  }
});
