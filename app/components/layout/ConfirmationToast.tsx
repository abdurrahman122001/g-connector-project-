'use client';
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
type ConfirmToastProps = {
    closeToast: () => void;
  };
export const showConfirmationToast = (message: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, onConfirm: () => void) => {
    const ConfirmToast = ({ closeToast } : ConfirmToastProps) => (
        <div>
      <p>{message}</p>
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          onClick={() => {
            onConfirm();
            toast.dismiss(); // close the toast
          }}
          style={{ padding: '5px 10px', background: 'green', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Yes
        </button>
        <button
          onClick={closeToast}
          style={{ padding: '5px 10px', background: 'gray', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          No
        </button>
      </div>
    </div>
  );
}