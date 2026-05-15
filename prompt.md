# Project: Pantry Tracker (iOS PWA)

### **Overview**

A lightweight, mobile-first inventory management app designed to track food expiration. It uses a "Template-Instance" model where food items can exist in an `unowned` state (acting as a searchable catalog) or an `owned` state (active tracking).

### **Tech Stack**

- **Framework:** Vite + React + TypeScript.
- **Styling:** Tailwind CSS v4 (CSS-driven configuration).
- **Icons:** Lucide-React.
- **Storage:** `localStorage` (Browser-persistent, zero-backend).
- **Platform:** iOS PWA (configured with Apple-specific meta tags for standalone "app" feel).

### **Data Schema**

```typescript
type FoodItem = {
  id: string
  title: string
  daysToConsumeAfterOpening: number
  daysToConsumeAfterCooking: number
  status: "owned" | "unowned"
  originalExpirationDate: string | null // YYYY-MM-DD
  openedDate: string | null // YYYY-MM-DD
  cookedDate: string | null // YYYY-MM-DD
}
```

### **Core Logic: The "Effective Expiry" Formula**

The expiration date is calculated based on a hierarchy of states:

1. **If Cooked:** `cookedDate + daysToConsumeAfterCooking` (Overrides all other dates).
2. **If Opened:** `Min(originalExpirationDate, openedDate + daysToConsumeAfterOpening)`.
3. **Otherwise:** `originalExpirationDate`.

### **UI & Features**

- **Home Screen:** A grid of square cards color-coded by status:
  - **Red:** Expired or expires today.
  - **Yellow:** Expires within 3 days.
  - **Green:** Healthy/Safe.
  - **Grey/Blank:** Unowned (Template).
- **Sorting:** Red > Yellow > Green > Unowned.
- **Actions:**
  - `Open`: Triggers "Opened" logic.
  - `Cook`: Triggers "Cooked" logic (biological reset).
  - `Eaten`: Transitions item to `unowned` and clears instance dates.
  - `Duplicate`: Clones an existing product template for multiple purchases.
  - `Search/Add`: Integrated bar to filter existing templates or create new ones.

### **Current Implementation Status**

- Fully functional MVP.
- Type-safe build pipeline (`tsc -b && vite build`).
- Deployed on Vercel.

---

**Future scaling notes for AI:** _If we move to Supabase, swap the `setItems` logic for Edge Functions/DB triggers. If notifications are needed, look into the Web Push API via a service worker._
