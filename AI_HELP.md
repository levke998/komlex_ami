# AI Agent & Developer Help Guide

This document is the **Source of Truth** for AI agents and developers working on the MagicDraw project. Use this guide to understand the workflow, testing procedures, and debugging tools.

## 1. Agentic Workflow & Architecture

### **Core Rules (NON-NEGOTIABLE)**
- **Strict Layering**: `Controller` → `Service` → `DbContext`.
- **No Repositories**: Do NOT implement the Repository or Unit of Work patterns. `DbContext` is the UoW.
- **DTOs Everywhere**: Never expose Domain Entities in Controllers. Use DTOs.
- **Root Aggregates**: `Drawing` is the Aggregate Root. `Layer` operations MUST go through `DrawingService`.

### **Task Management**
- **Artifacts**: Maintain `task.md` (checklist), `implementation_plan.md` (design), and `walkthrough.md` (verification).
- **Communication**: Update `WORKLOG.txt` and `STATUS.md` after every significant task.

---

## 2. API Testing (`MagicDraw.Api.http`)

We use the `.http` file for manual "end-to-end" verification of the API without the frontend.

### **Location**
`src/MagicDraw.Api/MagicDraw.Api.http`

### **How to Use**
1.  **Run the API**: Ensure `MagicDraw.Api` is running (`dotnet run`).
2.  **Execute sequentially**:
    -   Run **Create User**.
    -   🛑 **STOP & UPDATE VARIABLE**: Copy the `id` from the Create User response. Update `eUserId` variable in the file.
    -   Run **Create Drawing**.
    -   🛑 **STOP & UPDATE VARIABLE**: Copy the `id` from the Create Drawing response. Update `@DrawingId` variable within the file.
    -   Run **Add Layer** requests.
    -   Run **Get Drawing** to verify the final state.

> **Crucial for AI**: If a user reports "Foreign Key Constraint" errors during testing, it is 99% likely they forgot to update the `@UserId` variable in the `.http` file. Remind them to check this first.

---

## 3. Debugging / Visualizer (`debug_visualizer.html`)

Since the frontend may not always be ready, we use a standalone HTML file to visualize the JSON output from the API.

### **Location**
`root/debug_visualizer.html`

### **How to Use**
1.  Open `debug_visualizer.html` in any web browser.
2.  Execute the **Get Drawing** request in `MagicDraw.Api.http`.
3.  Copy the **entire JSON response**.
4.  Paste it into the text area of the visualizer.
5.  Click **Render Drawing**.

### **Capabilities**
- Renders `fill` layers (solid colors).
- Renders `stroke` layers (vector points).
- Shows placeholders for `image` layers.
- Respects `opacity`, `visibility`, and `orderIndex`.
