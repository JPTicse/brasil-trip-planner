const fs = require("fs");
let f = fs.readFileSync("src/lib/actions.ts", "utf-8");

// Add image_url to createActivity
f = f.replace(
  /notes: \(formData\.get\("notes"\) as string\) \|\| null,\s*assigned_to: \(formData\.get\("assigned_to"\) as string\) \|\| null,/,
  `notes: (formData.get("notes") as string) || null,\n      image_url: (formData.get("image_url") as string) || null,\n      assigned_to: (formData.get("assigned_to") as string) || null,`
);

// Add image_url to updateActivity
f = f.replace(
  /notes: \(formData\.get\("notes"\) as string\) \|\| null,\s*\}\)\s*\.eq\("id", activityId\);/,
  `notes: (formData.get("notes") as string) || null,\n      image_url: (formData.get("image_url") as string) || null,\n    })\n    .eq("id", activityId);`
);

fs.writeFileSync("src/lib/actions.ts", f);
console.log("image_url inserted");
