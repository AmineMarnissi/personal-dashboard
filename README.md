# Personal Manager

A comprehensive desktop application built with Electron for managing your personal life, including expenses, ideas, projects, training sessions, and contacts. Features an intuitive dashboard with data visualization and cross-platform compatibility.

## Features

### 📊 Dashboard
- Real-time overview of all your data
- Interactive charts showing expense categories and project status
- Recent activity log
- Current date display

### 💰 Expense Tracking
- Add, edit, and delete expenses
- Categorize expenses (Food, Transport, Utilities, Entertainment, Health, Shopping, Other)
- Monthly expense trends visualization
- Expense overview pie chart

### 💡 Ideas Management
- Capture and organize your ideas
- Tag-based organization system
- Search functionality to quickly find ideas
- Date tracking for idea creation

### 📋 Project Management
- Kanban-style project board (To Do, In Progress, Done)
- Priority levels (Low, Medium, High)
- Due date tracking
- Project status visualization

### 🏃 Training Log
- Track workout sessions and activities
- Duration monitoring
- Weekly training progress charts
- Notes for each training session

### 📞 Contact Management
- Store contact information (name, email, phone)
- Categorize contacts (Family, Friends, Work, Business, Other)
- Search functionality
- Additional notes for each contact

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Setup
1. Clone the repository:
```bash
git clone <repository-url>
cd personal-manager
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Desktop Framework**: Electron
- **Database**: SQLite (via Electron APIs)
- **Charts**: Chart.js
- **Styling**: Custom CSS with modern design principles

## Project Structure

```
personal-manager/
├── index.html          # Main HTML structure
├── renderer.js         # Frontend JavaScript logic
├── style.css          # Application styling
├── main.js            # Electron main process (not shown)
├── package.json       # Project dependencies
└── README.md          # This file
```

## Database Schema

The application uses SQLite with the following tables:

### Expenses
- `id` (INTEGER PRIMARY KEY)
- `date` (TEXT)
- `category` (TEXT)
- `description` (TEXT)
- `amount` (REAL)

### Ideas
- `id` (INTEGER PRIMARY KEY)
- `title` (TEXT)
- `description` (TEXT)
- `tags` (TEXT)
- `date` (TEXT)

### Projects
- `id` (INTEGER PRIMARY KEY)
- `title` (TEXT)
- `description` (TEXT)
- `due_date` (TEXT)
- `status` (TEXT)
- `priority` (TEXT)

### Training
- `id` (INTEGER PRIMARY KEY)
- `date` (TEXT)
- `activity` (TEXT)
- `duration` (INTEGER)
- `notes` (TEXT)

### Contacts
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `category` (TEXT)
- `notes` (TEXT)

### Activities (Log)
- `id` (INTEGER PRIMARY KEY)
- `date` (TEXT)
- `category` (TEXT)
- `description` (TEXT)

## Usage

### Adding Data
1. Navigate to the desired section using the top navigation tabs
2. Click the "Add [Item]" button
3. Fill in the required information in the modal form
4. Click "Save" to store the data

### Editing Data
1. Find the item you want to edit in the respective section
2. Click the "Edit" button next to the item
3. Modify the information in the modal form
4. Click "Save" to update the data

### Searching
- Use search boxes in the Ideas and Contacts sections to quickly find specific items
- Search works across multiple fields (title, description, tags for ideas; name, email, phone for contacts)

### Viewing Analytics
- Dashboard provides visual summaries of your data
- Expense charts show spending patterns by category and month
- Project charts display status distribution
- Training charts track weekly progress

## Customization

### Adding New Expense Categories
Edit the expense category dropdown in `index.html`:
```html
<select id="expense-category" class="form-select" required>
    <option value="">Select Category</option>
    <!-- Add new categories here -->
    <option value="NewCategory">New Category</option>
</select>
```

### Modifying Chart Colors
Update chart configurations in `renderer.js`:
```javascript
backgroundColor: [
    '#FF6384', '#36A2EB', '#FFCE56', // Add or modify colors
    '#4BC0C0', '#9966FF', '#FF9F40'
]
```

## Development

### Key Files
- `renderer.js`: Contains all frontend logic and database interactions
- `index.html`: Application structure and modal definitions
- `style.css`: Application styling (not shown but referenced)

### Adding New Features
1. Update the HTML structure in `index.html`
2. Add corresponding JavaScript functions in `renderer.js`
3. Update the database schema if needed
4. Add styling in `style.css`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## Security Notes

- The application stores data locally using SQLite
- No external data transmission occurs
- All data remains on the user's device

## Troubleshooting

### Common Issues

**Charts not displaying:**
- Ensure Chart.js is properly loaded from CDN
- Check browser console for JavaScript errors

**Database errors:**
- Verify Electron APIs are properly exposed
- Check that database tables are initialized

**Modal not opening:**
- Ensure event listeners are properly attached
- Check for JavaScript errors in console

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please create an issue in the repository or contact the development team.

---

**Note**: This application is designed for personal use and local data storage. Always backup your data regularly.