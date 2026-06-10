# GrowT — Google Stitch Design Specification & Prompts

This document contains a comprehensive design specification and generation prompts for Google Stitch. It translates the design keywords (**GUI, minimalistic, simple, modest, modern, beautiful, comfy, with both dark and light themes**) into design system configurations and screen-by-screen text prompts for both **Desktop** and **Mobile (Phone)** screens.

---

## Why did the Settings page show "Workspace, Team, Reports" tabs?
Stitch's generative model defaults to corporate dashboard settings templates (which typically include workspace settings, team members management, and billing/reports) if the prompt is not highly prescriptive. 

To fix this, we must explicitly instruct the AI to **avoid corporate team tabs** and instead build a **personal user profile customizer** containing the exact fields from our database schema (Display Name, Username, Light/Dark/System Theme mode buttons, Sprout/Penguin/Rose/Lavender/Duck color palette choices, and avatar icon selections).

---

## 1. Design System Parameters (JSON Config)

Configure the Stitch design system with these settings to match the existing fonts and structure of GrowT:

```json
{
  "displayName": "GrowT Minimalist Comfy System",
  "theme": {
    "headlineFont": "OUTFIT",
    "bodyFont": "PLUS_JAKARTA_SANS",
    "customColor": "#6C52E0",
    "colorMode": "LIGHT",
    "colorVariant": "TONAL_SPOT",
    "roundness": "ROUND_TWELVE",
    "overridePrimaryColor": "#6C52E0",
    "overrideNeutralColor": "#F0EFF8"
  }
}
```

---

## 2. Design System Markdown (`design.md`)

```markdown
# GrowT Visual Design Identity

## Visual Principles
- **Minimalistic & Simple**: Ample breathing room, minimal border lines, and high typographic hierarchy. Empty states are styled cleanly with soft graphics.
- **Modest & Comfy**: Rounded corner profiles (`12px` and `18px`), warm background tints, and soft natural shadows. Absolutely no harsh pitch blacks or neon shades.
- **Modern & Beautiful**: Glassmorphic dashboard container backdrops, clean micro-interactive indicators, and vibrant colored tag pills representing categories.
- **Adaptive Themes**: 
  - **Light Mode**: Soothing lavender-grey base (`#F0EFF8`), pure white cards (`#FFFFFF`), and soft violet primary text.
  - **Dark Mode**: Cozy midnight-amethyst base (`#0F0A20`), dark plum-violet cards (`#17112B`), and warm lavender-grey text (`#F0EEFF`).

## Layout Structure (Desktop vs. Mobile)
- **Desktop Layout**: A fixed left-hand vertical sidebar (width: `256px`) for navigation, with a glassmorphic background blur, side padding, and clean iconography.
- **Mobile (Phone) Layout**: Collapsed side navigation replaced by a bottom tab bar with 4 quick-action icons (Dashboard, Folders, Tasks, Settings) and a top header containing a hamburger menu icon (for Acquaintances, Notifications, and Restore), the logo, and the pulsing realtime connection status indicator.
- **Cards & Items**: Cards have a subtle `1px` border, soft shadows (`0 8px 32px 0 rgba(31, 38, 135, 0.07)`), and hover-lift transitions.
```

---

## 3. Desktop Screen Prompts (`deviceType: DESKTOP`)

### Screen 1: Dashboard View (Desktop)
```text
Create a modern, minimalistic Dashboard screen for a project tracker called GrowT.
Layout:
- Left sidebar navigation with a frosted-glass background. Items: Dashboard (active), Folders, Tasks, Acquaintances, Notifications, Restore, and Settings.
- Main area with a top bar showing workspace name selector, a search bar, and a pulsing 'Realtime: Syncing' indicator.
- Core body includes:
  1. A horizontal statistics grid showing 4 minimalistic cards: Total Folders (number), Active Tasks (number), Shared Items (number), and Archive Items (number).
  2. A status contribution graph or widget showing completion metrics: Ongoing, Half Done, and Completed totals in a cozy, rounded progress ring or soft bar charts.
  3. A 'Recent Updates' panel listing live user activity with display names, action descriptions (e.g., 'modified status of a task'), and relative timestamps.
Style: Comfy, modest, rounded corners, clean icons, light theme with soft violet accents (#6c52e0). Include a toggle for dark theme showing midnight-amethyst tones.
```

### Screen 2: Folders List Page (Desktop)
```text
Create a minimalistic, cozy Folders List page for the GrowT application.
Layout:
- Standard left sidebar navigation.
- Header with page title 'Folders' and a 'Create Folder' button styled as a modest violet button with rounded corners.
- Search input bar at the top to filter items.
- Main grid of folder cards:
  - Each card represents a folder, styled with soft background tones (violet, sky blue, light pink, pastel green, soft yellow).
  - Cards show Folder Title, Description, and a Category Chip (Work, Personal, Shared).
  - Include quick control buttons on each card: a draggable handle for reordering (move up/down), an 'Open' folder button, and a soft red 'Delete' icon.
Style: Modular layout, clean typography, soft card borders, beautiful negative space, comfortable margins, support light and dark modes.
```

### Screen 3: Folder Detail View (Desktop)
```text
Create a modern, minimalistic Folder Detail screen representing a live collaborative workspace.
Layout:
- Left sidebar. Main view has a header showing 'Folder Title', 'Category Tag (Shared)', and a due date.
- Right-hand side or header contains a 'Live Members' row showing member profile avatars with status indicators, and a clean 'Invite Member' form field with input for username and a '+' invite button.
- Main section contains the Tasks List:
  - List of collaborative tasks. Each task row is expandable.
  - Interactive status cycle buttons for each task: 'Ongoing' (soft blue), 'Half Done' (soft orange), and 'Completed' (soft green).
  - Profile avatar of the member assigned to each task next to the title.
  - A persistent, floatable 'Undo last action' bar showing the most recent task change (e.g., 'You completed Task X') with a clear, comfortable 'Undo' button.
Style: Ultra-clean, cozy grid, subtle indicators, beautiful font hierarchy, minimalistic, supporting light and dark themes.
```

### Screen 4: Tasks List Page (Desktop)
```text
Create a clean, minimalistic Task Board view for standalone tasks.
Layout:
- Standard navigation sidebar.
- Top action bar with 'Search tasks' input and a '+ Add Task' button.
- Main workspace splits tasks into categories or lists them in a clean vertical stack:
  - Task item card displays: Title, due date, category chip (Work, Personal, Shared).
  - List of Task Levels (subtasks/checklist items) underneath the description, each with its own completion status.
  - A dropdown selector to assign/reassign a member from a list of acquaintances.
  - An edit button, a delete button, and a quick reorder handle.
Style: Extremely neat, modest, cozy typography, soft shadows, plenty of whitespace, light gray background transitioning to deep navy in dark mode.
```

### Screen 5: Folder / Task Form Page (Desktop)
```text
Create a minimalistic Form page for creating or editing folders and tasks in project GrowT.
Layout:
- Top bar with a 'Back' button (arrow icon with 'Back to list' label).
- A centered, comfy card container containing the form fields:
  - Title text input with placeholder 'Enter title...'.
  - Category selector (Personal, Work, Shared) represented as a three-segmented cozy radio pill or button toggle.
  - Rich textarea input for Description.
  - Optional due date picker field with clean styling.
  - For Tasks: A section to add multiple 'Task Levels' (sub-tasks/checklist items) with input fields and a '+' button.
  - Form action buttons at the bottom: 'Cancel' (flat style) and 'Save' (solid modern violet button).
Style: Simple, clean input designs, modest styling with 12px rounded borders, beautiful typographic input labels, clear focus outlines.
```

### Screen 6: Acquaintances & Connections View (Desktop)
```text
Create a minimalistic, beautiful Acquaintances management panel.
Layout:
- Left navigation sidebar.
- Screen is split into two cozy columns or panels:
  1. 'Acquaintances' column listing current connections with display name, username, avatar icon, and a button to remove acquaintance.
  2. 'Requests' column with tabs for 'Received Requests' (shows pending requests with 'Accept' and 'Reject' buttons) and 'Sent Requests' (shows pending invitations with 'Cancel' button).
  - Header has an 'Add Acquaintance' search box to invite users by typing their username.
Style: Comfy card layouts, soft color feedback for Accept (greenish highlight) and Reject (reddish highlight), clean border separators, responsive design.
```

### Screen 7: Profile & Settings View (Desktop - CORRECTED)
```text
Create a minimalistic personal profile settings screen for GrowT.
DO NOT include corporate team management tabs like 'Workspace', 'Team', or 'Reports'.
Layout:
- Left navigation sidebar.
- Centered main panel structured as a single-column stack of cards:
  1. 'Public Identity' card: Input text field for 'Display name' and another input text field for 'Username'.
  2. 'Theme Mode' card: A horizontal button bar with options 'Light', 'Dark', and 'System' (displaying the selected mode as active).
  3. 'Web-app Color' card: A grid of 6 rounded color picker buttons (labeled 'Violet', 'Penguin Blue', 'Sprout Green', 'Rose Pink', 'Lavender Purple', 'Duck Gold') with description labels.
  4. 'Profile Picture' card: A grid showing 6 circular vector avatar options, each with a selectable border.
- At the bottom, a prominent primary button labeled 'Save profile'.
Style: Simple, cozy, rounded elements, light background (#F0EFF8), high typography hierarchy.
```

---

## 4. Mobile Screen Prompts (`deviceType: MOBILE`)

*For phone screens, we replace the desktop sidebar with a cozy bottom navigation tab bar and layout elements scaled for single-column touch input.*

### Screen 1: Dashboard View (Mobile)
```text
Create a minimalistic Mobile Dashboard screen (deviceType: MOBILE) for project tracker GrowT.
Layout:
- Top bar with a hamburger menu icon on the left, centered logo 'GrowT', and a small pulsing green badge on the right indicating 'Realtime: Syncing'.
- Main scrollable content in a single-column layout:
  - 2x2 grid of statistics blocks: Folders, Tasks, Shared, Archive.
  - Large circular progress ring displaying completion metrics (Ongoing, Half Done, Completed) with comfy desaturated status indicators.
  - A scrollable list of recent status updates showing user avatars, display names, and relative timestamps.
- Bottom navigation bar with icons for: Dashboard (active), Folders, Tasks, Settings.
Style: Rounded corners, comfortable padding, cozy typography, light theme with subtle violet accent glow.
```

### Screen 2: Folders List Page (Mobile)
```text
Create a minimalistic Mobile Folders List screen (deviceType: MOBILE).
Layout:
- Top bar showing page title 'Folders' and a '+' icon on the right to add folders.
- Search input bar with rounded edges below the header.
- A single column stack of card folders:
  - Each card features folder title, description snippet, category tag (Work, Personal, Shared), and total tasks counter.
  - Slide or quick-action icons: 'Open' folder chevron, and 'Move Up' / 'Move Down' arrow controls.
- Bottom navigation bar with Folders icon set as active.
Style: Clean typography, comfortable touch targets, soft colors, modest shadows.
```

### Screen 3: Folder Detail View (Mobile)
```text
Create a collaborative Mobile Folder Detail screen (deviceType: MOBILE).
Layout:
- Top bar showing a back arrow, folder title, and a 'Live' indicator.
- 'Collaborators' row below the header displaying a horizontal scroll of round profile avatars, and a button to slide open the 'Invite by Username' popup.
- Single column list of collaborative tasks:
  - Each task row contains title, assigned user avatar, and a horizontal 3-segmented button toggle for statuses: 'Ongoing' (blue), 'Half Done' (orange), and 'Completed' (green).
  - Floating 'Undo last change' bar at the bottom with a clear 'Undo' action.
- Bottom navigation bar.
Style: Soft backgrounds, touch-friendly status cycle controls, minimalistic and clean.
```

### Screen 4: Tasks List Page (Mobile)
```text
Create a clean Mobile Standalone Tasks screen (deviceType: MOBILE).
Layout:
- Top bar with Search bar and a '+' icon on the right.
- Single column stack of task items:
  - Each item card shows task title, category pill, and due date.
  - Under the task title, checklist items (Task Levels) are shown as bullet points with individual status indicator rings.
  - Assignee select dropdown widget styled as a simple rounded row.
- Bottom navigation bar.
Style: Modular layout, clean borders, comfy whitespace, light theme with violet highlights.
```

### Screen 5: Folder / Task Form Page (Mobile)
```text
Create a Mobile Form screen (deviceType: MOBILE) to create or edit folders/tasks.
Layout:
- Top bar with a Back arrow on the left, screen title 'Create Task' or 'Create Folder'.
- A single scrollable card container containing:
  - Text input for Title.
  - Segmented toggle control for Category (Personal, Work, Shared).
  - Description textarea.
  - Date input field.
  - Dynamic subtasks (Task Levels) checklist fields with a '+' button.
- Sticky action buttons at the bottom: 'Cancel' (flat text link) and 'Save' (solid violet button).
Style: Simple input boxes, large touch fields, modest rounded corners, modern look.
```

### Screen 6: Acquaintances View (Mobile)
```text
Create a Mobile Acquaintances screen (deviceType: MOBILE).
Layout:
- Top bar with title 'Acquaintances' and search input to type username and invite.
- Two segmented tabs at the top: 'My Connections' and 'Requests'.
- 'My Connections' panel lists friends with avatar circles and 'Remove' buttons.
- 'Requests' tab lists received invites with Accept/Reject buttons, and sent invites with a Cancel button.
- Bottom navigation bar.
Style: Comfy, touch-friendly, desaturated red/green for action feedback.
```

### Screen 7: Profile & Settings View (Mobile - CORRECTED)
```text
Create a minimalistic Mobile Settings and Profile screen (deviceType: MOBILE).
DO NOT include corporate team management tabs like 'Workspace', 'Team', or 'Reports'.
Layout:
- Top bar showing 'Settings'.
- Single-column scrollable sections:
  1. 'Public Identity': Text input fields for Display Name and Username.
  2. 'Theme Mode': 3 horizontal buttons 'Light', 'Dark', and 'System' with active states.
  3. 'Web-app Color': Horizontal scroll of color circles (Violet, Blue, Green, Pink, Purple, Gold).
  4. 'Profile Picture': 2x3 grid of circular avatar selections.
- A prominent 'Save profile' solid violet button.
- Bottom navigation bar with Settings icon active.
Style: Modest, cozy layout spacing, clean and beautiful.
```
