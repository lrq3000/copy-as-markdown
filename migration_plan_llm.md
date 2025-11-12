## Manifest V2 to V3 Migration Plan for Chrome Extension via LLMs

This document outlines the plan to migrate the Chrome extension from Manifest V2 to Manifest V3. The extension converts selected HTML text on a webpage to Markdown and copies it to the clipboard. The migration will ensure all existing functionalities are maintained in Manifest V3.

**Key Changes in Manifest V3:**

- **Service Workers:**  Replaces background pages with service workers for background scripts. Service workers are event-driven and have a different lifecycle compared to background pages.
- **DeclarativeNetRequest API:**  Replaces `webRequest` and `webRequestBlocking` APIs for network request modification with the more performant `declarativeNetRequest` API (not directly relevant to this extension but important to note for future considerations).
- **Manifest File Changes:**  Updates to the `manifest.json` structure, including `manifest_version: 3` and changes in how background scripts are declared.
- **Permissions:** Review and potential adjustments to required permissions.

**Migration Steps:**

1. **Analyze Manifest V2 (`public/manifest.json`):**
    - Examine the current manifest file to understand the existing structure, background scripts, content scripts, permissions, and functionalities.
    - Identify background scripts, content scripts, permissions, and any APIs used that might be affected by the migration.

2. **Update Manifest to V3 (`public/manifest.json`):**
    - Modify `public/manifest.json` to comply with Manifest V3 requirements:
        - Update `"manifest_version"` to `3`.
        - Replace the `"background"` script definition with a service worker definition.
        - Review and update `"permissions"` to ensure they are correctly declared for Manifest V3 and still necessary.
        - Check for any deprecated APIs and identify necessary replacements or adjustments.

3. **Migrate Background Script to Service Worker (`src/background_script.ts`):**
    - Refactor the background script (`src/background_script.ts`) to function as a service worker.
    - Adapt event listeners and message handling mechanisms to the service worker lifecycle. Service workers are event-driven and may require changes in how persistent states or tasks are managed.

4. **Review Content Scripts (`src/content_script_get_selection.ts`, `src/content_script_show_message.ts`):**
    - Check content scripts for compatibility with Manifest V3, particularly in terms of message passing to the service worker.
    - Adjust message passing between content scripts and the service worker if needed to align with service worker communication patterns.

5. **Update Permissions (`public/manifest.json`):**
    - Review the list of permissions in `public/manifest.json`.
    - Ensure all declared permissions are still required and are correctly specified for Manifest V3. Remove any unnecessary or deprecated permissions.

6. **Install `@types/chrome`:**
    - Install the `@types/chrome` package to provide type definitions for Chrome APIs.
    - `npm install --save-dev @types/chrome`

7. **Test Functionality:**
    - **HTML to Markdown Conversion:** Verify that the core functionality of converting selected HTML to Markdown remains operational and produces the same output as in Manifest V2.
    - **Clipboard Integration:** Ensure the converted Markdown is correctly copied to the clipboard.
    - **End-to-End Testing:** Perform comprehensive testing of all extension features to ensure no regressions were introduced during the migration.
    - **Load unpacked extension:** Load the extension as unpacked in Chrome to test.
    - **Test context menu:** Test the "Copy as Markdown" context menu.
    - **Test keyboard shortcut:** Test the "Alt+Shift+Y" keyboard shortcut.
    - **Test browser action:** Test clicking the extension icon.

8. **Documentation (if applicable):**
    - Update any existing documentation to reflect the Manifest V3 migration and any changes in setup, usage, or architecture.

**Implementation Steps:**

The following steps have been taken to implement the migration plan:

1. **Read `public/manifest.json`:** Used `read_file` to examine the current Manifest V2 file.
2. **Modify `public/manifest.json`:** Used `apply_diff` to update the manifest to Manifest V3 format, including service worker and permissions.
3. **Modify `src/background_script.ts`:** Used `apply_diff` to refactor the background script to a service worker.
4. **Install `@types/chrome`:** Used `execute_command` to install `@types/chrome`.

Next steps:

5. **Test and Validate:**  Manually test the extension in Chrome after loading it as an unpacked extension to ensure all functionalities work as expected.

Let's proceed with testing the extension in Chrome. Please load the extension as unpacked and test the functionalities. Let me know if there are any issues.

--------

Changes from v0.0.9 to v0.0.10:
* The service worker and listener got started before they are needed so that they can catch. But the listeners are still created on-demand when needed (on click). Also, the listeners now have a timeout, so this avoids listeners piling up in RAM.

Changes from v0.0.10 to v0.0.11 (aka how all the bugs with the clicks got fixed):
* Before (Original Code):
    * Created/removed message listeners for each click
    * Service worker was already running (no change)
* After (Current Code):
    * One persistent message listener (always active, very low overhead)
    * A small Map that tracks pending requests: Map<number, {resolve, reject, timeout}>
    * Service worker stays running (same as before)
