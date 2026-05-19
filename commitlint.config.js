module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      ["api", "web", "admin", "db", "shared", "config", "ui", "utils", "ci", "docker", "deps"],
    ],
  },
};
