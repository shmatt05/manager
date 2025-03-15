# Task Zero (TØ)

A modern task management application based on the Eisenhower Matrix methodology to help you prioritize tasks and boost productivity.

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

- **Eisenhower Matrix**: Organize tasks by urgency and importance
- **Smart Task Creation**: Quick entry with natural language processing
- **Task Management**: Create, edit, complete, and delete tasks
- **Drag and Drop**: Easily reorganize tasks between quadrants
- **History Tracking**: View a complete history of all task changes
- **Cloud Sync**: Automatically sync data across devices (when using Firebase)
- **Responsive Design**: Works on desktop and mobile devices

## 💻 Development

### Prerequisites

- Node.js (v14.0 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/task-matrix.git
   cd task-matrix
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the project root with the following variables:
   ```
   VITE_USE_FIREBASE=true  # Set to false for local storage only
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_DATABASE_URL=your_database_url
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 🧠 How to Use

### Task Creation

- Use the input field at the top of the app to create new tasks
- Add special syntax for advanced features:
  - `@time` - Add a due time (e.g., `@2pm`, `@3:30pm`)
  - `#tag` - Add categories or tags to your task
  - Special tags:
    - `#do` - Mark as urgent & important (Quadrant 1)
    - `#schedule` - Mark as important but not urgent (Quadrant 2)
    - `#delegate` - Mark as urgent but not important (Quadrant 3)
    - `#eliminate` - Mark as neither urgent nor important (Quadrant 4)
    - `#tomorrow` - Schedule task for tomorrow

### Example:

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🚀 Deployment

1. **Setup Firebase**
   ```bash
   # Install Firebase CLI globally
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase in your project
   firebase init
   ```

2. **Configure Firebase**
   - Select Hosting and Realtime Database
   - Choose "manager-85af0" as your project
   - Set build directory to `dist`
   - Configure as single-page app

3. **Deploy**
   ```bash
   # Build the project
   npm run build
   
   # Deploy to Firebase
   firebase deploy
   ```

Your app will be live at `https://manager-85af0.web.app`
