# Task Manager Matrix

A React-based task management application using the Eisenhower Matrix to help prioritize tasks based on their urgency and importance.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/shmatt05/manager.git

# Navigate to project directory
cd manager

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🛠️ Tech Stack

- React
- Vite
- Tailwind CSS
- React Beautiful DND

## 📋 Features

- **Interactive Matrix Layout**: Four quadrants based on the Eisenhower Matrix
- **Drag & Drop**: Easily move tasks between quadrants
- **Task Management**: Create, edit, and delete tasks
- **Responsive Design**: Works on both desktop and mobile devices

## 💻 Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
manager/
├── src/
│   ├── components/
│   │   └── TaskCard.jsx
│   ├── App.jsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## 📱 Usage

1. **Adding Tasks**
   - Click the "+" button in any quadrant
   - Fill in the task details
   - Click "Save"

2. **Managing Tasks**
   - Drag tasks between quadrants
   - Click a task to edit
   - Use delete button to remove tasks

3. **Matrix Quadrants**
   - Top Left: Important & Urgent
   - Top Right: Important & Not Urgent
   - Bottom Left: Not Important & Urgent
   - Bottom Right: Not Important & Not Urgent

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
