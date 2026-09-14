import security from "eslint-plugin-security";
import noUnsanitized from "eslint-plugin-no-unsanitized";
export default [{ plugins: { security, "no-unsanitized": noUnsanitized }, files: ["src/**/*.{js,jsx,ts,tsx}"], rules: { "security/detect-eval-with-expression": "error", "security/detect-new-buffer": "error", "security/detect-unsafe-regex": "error", "security/detect-object-injection": "error", "no-unsanitized/DOM": "error" } }];
