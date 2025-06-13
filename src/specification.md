# Website Requirement Document

**Project**: Catering Website for Shiv Shakti Catering Service  
**Prepared For**: Developer  
**Purpose**: To build a customer-facing interface for creating custom catering orders with food selection, pricing, and PDF generation.

---

## Overview

The website will have 3 main screens:
Logo is in public folder use logo
---

## Screen 1: Customer Details

**Fields**:
- Customer Name (Text, Required)
- Phone Number (Number, Required)
- Email Address (Email, Optional)
- Catering Date (Date Picker, Required)
- Venue (Text, Required)
- Event Time
- Number of Persons (Number, Required)

**Actions**:
- **Next** (Button): Navigates to Menu Creation screen

**Validation**:
- All required fields must be filled
- Phone number must be valid (10 digits)
- Number of persons must be a positive number

---

## Screen 2: Menu Creation

**Layout**:
- **Left**: Food Categories (List view – e.g., "Starter", "Main Course", "Desserts")
- **Middle**: Food Items (Based on selected category)
- **Right**: Selected Menu Items (with pricing and quantity)

**Features**:
- Clicking a category displays relevant food items in the middle section
- Food items can be:
  - Dragged and dropped into the right panel (desktop)
  - Tapped with "Add" button on mobile for easier UX
- Each selected item allows:
  - Entering price (per unit or per person)
  - Entering quantity (optional)
- Display running total price at the bottom
- Allow adding custom food item via "Other" input

**Actions**:
- **Next** (Button): Takes user to Summary & PDF screen

---

## Screen 3: Summary & PDF Generation

**Fields & Display**:
- Other Instructions (Multiline Text Box, Optional)
- Summary Table:
  - Number of Persons
  - Menu Items with Quantity and Price
  - Subtotal = (Sum of selected item prices)
  - Grand Total = Subtotal × Number of Persons (if pricing is per person)

**Actions**:
- **Generate PDF** (Button): Creates a branded PDF with full order summary
- **Create Another Menu** (Button): Returns to Menu screen with previously entered customer info retained

**PDF Content**:
- Shiv Shakti Catering branding (logo, address, contact)
- Customer details
- Selected menu with pricing
- Date and time stamp
- Optional field for customer signature

---

## Additional Notes

- Website should be fully responsive (mobile + desktop)
- UI must be clean, user-friendly, and accessible
- Drag-and-drop must work smoothly (with mobile-friendly alternatives)
- Strong form validations to ensure accurate input
- Scalable backend-ready structure (in case of admin panel or data storage in future)
