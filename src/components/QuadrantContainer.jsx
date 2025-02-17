export default function QuadrantContainer({ title, tasks, onTaskEdit }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onTaskEdit}
        />
      ))}
    </div>
  );
} 