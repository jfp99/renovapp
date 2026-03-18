# Cost Tracker + ROI Module - Quick Start Guide

## Accessing the Module
Navigate to `/costs` in your Next.js app to access the Cost Tracker and ROI analysis interface.

## Dépenses Tab (Expenses)

### Adding an Expense
1. Click "Ajouter une dépense" button
2. Fill in the form:
   - **Description**: What is the expense for (required)
   - **Category**: Select from dropdown (Matériaux, Main d'œuvre, etc.)
   - **Amount**: Enter the cost (required)
   - **Currency**: Click PHP/EUR/USD button (exchange rates auto-apply)
   - **Date**: Select date (defaults to today)
   - **Vendor**: Optional supplier name
   - **Status**: Planned, Paid, or Cancelled
   - **Linked Rooms**: Select rooms related to this expense
3. Click "Ajouter" to save

### Managing Expenses
- **Sort**: Click column headers to sort (Date, Description, Category, Amount, Status)
- **Filter**: Use dropdowns to filter by Category or Status
- **Edit**: Click edit icon to modify an entry
- **Delete**: Click trash icon to remove an entry
- **Export**: Click "Exporter (CSV)" to download all entries

## Budget Tab

### Manage Categories
**Left side:** View budget allocation per category with progress bars
- Red bar indicates overspending (actual > allocated)
- Percentage shows utilization rate

**Right side:** Manage your categories
1. Click "Nouvelle Catégorie" to add
2. Enter category name
3. Select a color from presets (10 options)
4. Set budget allocation in PHP
5. Click "Ajouter"

To edit: Click edit icon on a category
To delete: Click trash icon with confirmation

### Budget Overview
Summary cards show:
- **Budget Total**: Sum of all category allocations
- **Dépenses**: Total actual spending
- **Reste**: Remaining budget (Budget - Spent)

## ROI Tab (Return on Investment)

### Configure ROI Parameters
Click "Modifier" to edit:
1. **Budget Total Rénovation**: Total renovation cost (PHP)
2. **Prix d'Achat Propriété**: Property purchase price (PHP)
3. **Loyer par Lit**: Monthly rent per bed (PHP)
4. **Nombre de Lits**: Number of available beds
5. **Taux d'Occupation**: Occupancy percentage (0-100%)
6. **Dépenses Mensuelles**: Monthly operating expenses (PHP)

Click "Enregistrer" to save

### ROI Metrics
The dashboard displays 4 key metrics:

1. **Revenu Mensuel Brut** (Gross Monthly Revenue)
   - Formula: Monthly Rent × Beds × Occupancy %
   
2. **Revenu Mensuel Net** (Net Monthly Income)
   - Formula: Gross Revenue - Monthly Expenses
   
3. **ROI Annuel** (Annual ROI %)
   - Formula: (Net Income × 12) / Total Renovation Budget × 100
   - Shows the annual return percentage
   
4. **Retour sur Investissement** (Payback Period)
   - Formula: Total Renovation Budget / (Net Monthly Income × 12)
   - Shows how many years to recoup investment

### Visualizations

**PieChart - Spending Distribution**
- Shows what percentage of budget goes to each category
- Displays category colors for easy reference
- Hover for exact amounts

**BarChart - Budget vs Actual**
- Purple bars = Planned budget per category
- Red bars = Actual spending per category
- Helps identify categories over/under budget

## Currency Conversion

The system handles multi-currency entries:
- **PHP**: Base currency, no conversion needed
- **EUR**: Converted at 58 PHP = 1 EUR
- **USD**: Converted at 52 PHP = 1 USD

All calculations use PHP as the standard unit.

## Data Persistence

All data is automatically saved to browser localStorage:
- Category definitions
- Expense entries
- ROI configuration

Data persists across browser sessions but is device-specific.

## CSV Export Format

When exporting, you get a file with these columns:
- Date
- Description
- Category (name, not ID)
- Amount (in original currency)
- Currency (PHP/EUR/USD)
- Vendor
- Status (Prévu/Payé/Annulé)
- Linked Rooms (semicolon-separated)

File is UTF-8 encoded with BOM for Excel compatibility.

## Workflow Examples

### Example 1: Track Renovation Costs
1. Create categories matching your work phases
2. Add expenses as you incur them
3. Allocate budgets per category in Budget tab
4. Monitor progress with budget bars
5. Export for accounting/records

### Example 2: Calculate Investment Returns
1. Set ROI parameters (rent, beds, occupancy, expenses)
2. Add all renovation costs as expenses
3. Watch real-time ROI calculations
4. Use charts to optimize spending
5. Monitor payback period

### Example 3: Multi-Property Tracking
Create one cost entry per property by:
1. Using "Linked Rooms" to tag by property
2. Using descriptions clearly (e.g., "Property A - Paint")
3. Note: Current version doesn't have property-level filtering
   (could be future enhancement)

## Tips & Best Practices

1. **Use consistent descriptions**: Makes searching easier
2. **Link rooms**: Helps track which rooms cost the most
3. **Set realistic budgets**: Helps with cost control
4. **Update status regularly**: Track payment status
5. **Review ROI monthly**: Monitor investment progress
6. **Export regularly**: Backup your data
7. **Use vendors**: Important for dispute resolution
8. **Color code categories**: Easier visual scanning

## Common Calculations

### Total Budget
Sum of all category budget allocations

### Total Spent
Sum of all non-cancelled expense amounts (converted to PHP)

### Budget Utilization %
(Actual Spent / Budget Allocated) × 100

### Months to Payback
Total Renovation Budget / Monthly Net Income

### Annual Return %
(Monthly Net Income × 12 / Total Renovation Budget) × 100

## Future Enhancement Ideas

- Property-level filtering
- Expense templates for common items
- Receipt attachment/documentation
- Monthly spending trends chart
- Category spending forecasts
- Collaborative expense tracking
- Integration with payment systems
