migrate((app) => {
  const records = app.findRecordsByFilter("users", "id != ''", "", 0, 0);
  for (const r of records) {
    if (!r.get("verified")) {
      r.set("verified", true);
      try { app.save(r); } catch (e) { /* skip if save fails */ }
    }
  }
}, (app) => { /* no rollback */ });
