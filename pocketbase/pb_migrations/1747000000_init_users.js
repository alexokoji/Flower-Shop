/// <reference path="../pb_data/types.d.ts" />

// Extend the built-in `users` auth collection with profile fields and a role.
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  users.fields.add(new Field({
    name: "first_name", type: "text", max: 60, required: true,
  }));
  users.fields.add(new Field({
    name: "last_name", type: "text", max: 60, required: true,
  }));
  users.fields.add(new Field({
    name: "phone", type: "text", max: 32,
  }));
  users.fields.add(new Field({
    name: "role", type: "select", maxSelect: 1, required: true,
    values: ["customer", "admin"],
  }));
  users.fields.add(new Field({
    name: "preferred_currency", type: "text", max: 3,
  }));
  users.fields.add(new Field({
    name: "locale", type: "text", max: 8,
  }));
  users.fields.add(new Field({
    name: "marketing_opt_in", type: "bool",
  }));
  users.fields.add(new Field({
    name: "last_login_at", type: "date",
  }));

  // Allow anyone to create their account (registration is public).
  users.createRule = "";
  // Read your own profile + admins read all.
  users.listRule = "@request.auth.id != \"\" && (@request.auth.id = id || @request.auth.role = \"admin\")";
  users.viewRule = "@request.auth.id != \"\" && (@request.auth.id = id || @request.auth.role = \"admin\")";
  // You can update only your own record; admins can update anyone.
  users.updateRule = "@request.auth.id = id || @request.auth.role = \"admin\"";
  // No one deletes via API except admins.
  users.deleteRule = "@request.auth.role = \"admin\"";

  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  ["first_name", "last_name", "phone", "role", "preferred_currency",
   "locale", "marketing_opt_in", "last_login_at"].forEach((n) => {
    const f = users.fields.getByName(n);
    if (f) users.fields.removeById(f.id);
  });
  app.save(users);
});
