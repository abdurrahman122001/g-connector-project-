type Status = 'operational' | 'degraded' | 'outage' | 'success' | 'failed';

interface StatusItemProps {
  title: string;
  status: Status;
  lastChecked: string;
}

const StatusItem: React.FC<StatusItemProps> = ({ title, status, lastChecked }) => {
  const statusColors = {
    success: { text: 'text-green-800', bg: 'bg-green-100', dot: 'bg-green-500' },
    operational: { text: 'text-blue-800', bg: 'bg-blue-100', dot: 'bg-blue-500' },
    degraded: { text: 'text-yellow-800', bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
    failed: { text: 'text-red-800', bg: 'bg-red-100', dot: 'bg-red-500' },
    //Add outage
    outage: { text: 'text-red-800', bg: 'bg-red-100', dot: 'bg-red-500' }
  } as const; // This is important for type safety and exhaustiveness

  // Default to 'failed' if status is not recognized
  const color = statusColors[status] || statusColors.failed;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <span className={`w-3 h-3 rounded-full mr-3 ${color?.dot}`}></span>
        <span className="font-medium text-gray-800">{title}</span>
      </div>
      <div className="flex items-center">
        <span className={`text-xs px-2 py-1 rounded-full ${color?.bg} ${color?.text}`}>
          {status}
        </span>
        <span className="text-xs text-gray-500 ml-2">{lastChecked}</span>
      </div>
    </div>
  );
};

export default StatusItem;