# Open Gate Plugin Improvement Specification

## 1. Feasibility Analysis

We have analyzed the requested features and confirmed their feasibility within the Obsidian and Electron environment.

| Feature Request | Feasibility | Technical Implementation Strategy |
| :--- | :--- | :--- |
| **1. Page Navigation**<br>(Back/Forward Buttons) | **High** | The Electron `webview` tag (used by this plugin on Desktop) supports history navigation (`goBack`, `goForward`). We can add standard Obsidian action buttons to the view header to control this. |
| **2. AI Text "Apply"**<br>(Copy/Paste Integration) | **High** | We can programmatically access the text selected by the user inside the webview using `executeJavaScript`. We can then insert this text into Obsidian using the `Editor` and `Vault` APIs. |
| **3. Insertion Options**<br>(Cursor, Bottom, New Note) | **High** | We can inject a lightweight toolbar strip at the top of the Gate view containing a dropdown for these options. The plugin will store the selected state and act accordingly when "Apply" is clicked. |
| **4. English UI** | **High** | This is a straightforward localization task. We will ensure all labels, tooltips, and UI elements are hardcoded in English. |
| **5. Popup Behavior**<br>(Open link in floating window) | **High** | We can intercept the `new-window` event emitted by the webview when a link tries to open a new tab/window. We will prevent the default behavior and instead open a custom Obsidian `Modal` that contains a simplified webview, effectively creating a "floating" browser window inside Obsidian. |
| **6. Multi-Tab Gate Switcher**<br>(Browser-like Tabs) | **High** | We can implement a horizontal "Tab Bar" or "Favorites Bar" within the Gate View. This allows users to switch between different configured Gates without opening multiple Obsidian leaves. |
| **7. Quick Address Bar**<br>(Quick Add Gate) | **High** | We can add an address input. When a URL is entered, we can automatically create a new Gate configuration (persisted to settings) and immediately navigate to it. |

---

## 2. Development Plan & Specifications

### 2.1 UI / UX Enhancements

#### A. Header Actions (View Toolbar)
We will add the following buttons to the top-right header of the Open Gate view (standard Obsidian action bar):
1.  **Back Arrow** (`arrow-left`): Navigates the browser history back.
2.  **Forward Arrow** (`arrow-right`): Navigates the browser history forward.
3.  **Apply / Paste** (`check-square` or `download`): Extracts selected text from the browser content and inserts it into Obsidian based on the selected "Insertion Mode".

#### B. In-View Control Bar
Since the header action bar handles buttons well but not dropdowns, we will create a dedicated **Control Bar** immediately below the header (inside the view content area, above the browser frame).

**Layout (Top to Bottom)**:
1.  **Gate Switcher / Tab Bar**: A horizontal list of "Tabs" or "Chips" representing all saved Gates. Allows single-click switching.
2.  **Navigation & Actions Line**:
    *   **Address Input**: A text field showing the current URL. Users can type a new URL here and press Enter.
    *   **Insertion Mode Dropdown**: [Insert to: Cursor / Bottom / New Note]
    *   **Apply Button**: [Icon: Download/Check] To trigger the text insertion.

### 2.2 Functional logic (Pseudo-Code & Logic)

#### Feature 6: Multi-Tab Gate Switcher
*   **UI**: Render a list of buttons/tabs for each `gate` in `settings.gates`.
*   **Action**: When clicked, call `this.setUrl(gate.url)`. Optional: Highlight the active tab.

#### Feature 7: Quick Address Bar (New Gate Creation)
*   **UI**: `<input type="text" placeholder="https://..." />`
*   **Event**: `onKeyDown` (Enter)
*   **Logic**:
    1.  Check if input is a valid URL.
    2.  Check if this URL already exists in `settings.gates`.
    3.  If not, auto-generate a generic title (e.g., domain name) and ID.
    4.  Save to `settings.gates`.
    5.  Refresh the "Gate Switcher" list.
    6.  Navigate the WebView to the new URL.

#### Feature 1: Navigation
Inside `GateView.ts`:
```typescript
// Add actions in onload/addActions
this.addAction('arrow-left', 'Go Back', () => {
    if (this.frame.canGoBack()) this.frame.goBack();
});
this.addAction('arrow-right', 'Go Forward', () => {
    if (this.frame.canGoForward()) this.frame.goForward();
});
// Note: We might move these buttons to the new "Navigation & Actions Line" for better UX closer to the address bar.
```

#### Feature 2 & 3: AI Text "Apply" & Insertion Logic
**Workflow**:
1. User selects text in the Open Gate browser (e.g., Gemini output).
2. User clicks the "Apply" button in the header.
3. **Extraction**:
   ```typescript
   const selectedText = await this.frame.executeJavaScript('window.getSelection().toString()');
   ```
4. **Insertion**:
   Based on the Dropdown value:
   *   **Case A: Cursor Position**
       *   Get active `MarkdownView`.
       *   `editor.replaceSelection(selectedText)`
   *   **Case B: Bottom of Note**
       *   Get `workspace.getActiveFile()`.
       *   `vault.append(file, "\n" + selectedText)`
   *   **Case C: New Note**
       *   Generate unique filename (e.g., `AI-Note-YYYYMMDD-HHmm`).
       *   `vault.create(path, selectedText)`
       *   Open the new file in a split leaf or new tab.

#### Feature 4: Popup Management (Floating Window)
**Logic**:
Inside `createFrame()` setup:
```typescript
this.frame.addEventListener('new-window', (event) => {
    event.preventDefault(); // Stop creating a real new window
    const targetUrl = event.url;
    
    // Open Custom Modal
    new GatePopupModal(this.app, targetUrl).open();
});
```

**New Class**: `GatePopupModal`
*   Extends `Modal` from Obsidian API.
*   `onOpen()`: Creates a `webview` (or `iframe` on mobile) inside the modal content.
*   CSS: Set dimensions to ~80% width/height of the app, centered. "Small" as requested, but usable.

### 2.3 File Structure Changes

No new directories needed, but we will add/modify files in `src/`:
1.  **`src/GateView.ts`**:
    *   Implement Back/Forward logic.
    *   Implement "Apply" button and logic.
    *   Implement Control Bar (Dropdown) rendering.
    *   Add `new-window` listener.
2.  **`src/PopupGateModal.ts`** (New File):
    *   Implements the floating browser modal.
3.  **`styles.css`**:
    *   Add styling for `.gate-control-bar` (flexbox, padding, border-bottom).
    *   Add styling for `.gate-popup-modal` (size, centering).

### 2.4 Localization
*   All user-facing strings in Code & UI will be set to English.
*   "새 페이지" -> "New Note"
*   "설정" -> "Settings"
*   etc.

---

## 3. Implementation Steps

1.  **Preparation**:
    *   Backup `GateView.ts`.
    *   Ensure `styles.css` is clean.
2.  **Step 1: Navigation & Header**:
    *   Modify `GateView.ts` to add Left/Right arrow icons and handlers.
3.  **Step 2: Control Bar**:
    *   Modify `GateView.ts` `onload` to prepend a `div` with the `<select>` element.
    *   Add styles for the bar.
4.  **Step 3: Text Extraction**:
    *   Implement the `onApply` function.
    *   Test extraction from common AI sites (ChatGPT, Gemini).
5.  **Step 4: Popups**:
    *   Create `PopupGateModal.ts`.
    *   Wire up the event listener in `GateView`.

## 4. Dependencies
*   Obsidian API (`MarkdownView`, `Editor`, `Modal`, `Notice`).
*   Electron (`WebviewTag`, `clipboard`).
