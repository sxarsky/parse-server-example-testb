// Parse Cloud Code - Sample Functions

Parse.Cloud.define("hello", function(request) {
  return "Hello from Parse Cloud Code!";
});

Parse.Cloud.define("getTodoStats", async function(request) {
  const query = new Parse.Query("TodoList");

  const totalCount = await query.count({ useMasterKey: true });

  const completedQuery = new Parse.Query("TodoList");
  completedQuery.equalTo("completed", true);
  const completedCount = await completedQuery.count({ useMasterKey: true });

  return {
    total: totalCount,
    completed: completedCount,
    pending: totalCount - completedCount
  };
});

Parse.Cloud.define("markTodoComplete", async function(request) {
  const { todoId } = request.params;

  if (!todoId) {
    throw new Error("todoId is required");
  }

  const query = new Parse.Query("TodoList");
  const todo = await query.get(todoId, { useMasterKey: true });

  todo.set("completed", true);
  await todo.save(null, { useMasterKey: true });

  return { success: true, todo: todo.toJSON() };
});

// Before Save Hook for TodoList
Parse.Cloud.beforeSave("TodoList", (request) => {
  const todo = request.object;

  // Auto-set createdBy if not set
  if (!todo.existed() && request.user) {
    todo.set("createdBy", request.user);
  }

  // Validate title
  const title = todo.get("title");
  if (!title || title.length < 3) {
    throw new Error("Title must be at least 3 characters long");
  }

  // Default priority
  if (!todo.get("priority")) {
    todo.set("priority", "medium");
  }
});

// After Save Hook for TodoList
Parse.Cloud.afterSave("TodoList", (request) => {
  const todo = request.object;
  console.log("Todo saved:", todo.id, "Completed:", todo.get("completed"));
});

// Before Delete Hook
Parse.Cloud.beforeDelete("TodoList", (request) => {
  const todo = request.object;
  console.log("Deleting todo:", todo.id);
});
