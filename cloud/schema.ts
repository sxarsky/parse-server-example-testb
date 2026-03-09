export const schemaDefinitions = [
  {
    className: 'Item',
    fields: {
      name: { type: 'String', required: true },
      description: { type: 'String' },
      price: { type: 'Number' },
      quantity: { type: 'Number', defaultValue: 0 },
    },
    classLevelPermissions: {
      find: { '*': true },
      count: { '*': true },
      get: { '*': true },
      update: { '*': true },
      create: { '*': true },
      delete: { '*': true },
    },
  },
  {
    className: 'TestObject',
    fields: {
      beforeSave: { type: 'Boolean', defaultValue: false },
      additionalData: { type: 'String' },
    },
    classLevelPermissions: {
      find: { '*': true },
      count: { '*': true },
      get: { '*': true },
      update: { '*': true },
      create: { '*': true },
      delete: { '*': true },
    },
  },
];
