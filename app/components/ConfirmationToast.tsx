
// Define props for the ConfirmationToastComponent
interface ConfirmationToastProps {
    closeToast?: () => void; // Injected by react-toastify
    onConfirm: () => void;
    
  }
  
  // Custom component for the confirmation dialog content
const ConfirmationToastComponent: React.FC<ConfirmationToastProps> = ({ closeToast, onConfirm }) => (
    <div className="p-2"> {/* Add some padding for the content within the toast body */}
      <p className="mb-2 font-semibold text-gray-800">Confirm Deletion</p>
      <p className="mb-3 text-sm text-gray-700">
        Are you sure you want to delete this record ?
        <br />
        This action cannot be undone.
      </p>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => {
            onConfirm();
            if (closeToast) closeToast();
          }}
          className="px-4 py-2 text-sm cursor-pointer font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
        >
          Delete
        </button>
        <button
          onClick={closeToast}
          className="px-4 py-2 text-sm cursor-pointer font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
  export default ConfirmationToastComponent