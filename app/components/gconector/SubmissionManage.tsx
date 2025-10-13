import { FiPenTool, FiTrash2 } from "react-icons/fi";
import React from "react";
import Link from "next/link";
import { useRouter } from 'next/router';

// Define the type of a single submission
interface Submission {
    description: string;
    _id: string;
    name: string;
    createdAt: string;
    script_name?: string;
}

// Define the props type
interface SubmissionManageProps {
    submissions: Submission[];
    setViewTable: (value: boolean) => void;
    setSubmissionId: (id: string) => void;
    handleDelete: (id: string) => void;
    editUrl: string | null;
    query:string | null
}


const SubmissionManage: React.FC<SubmissionManageProps> = ({
    submissions,
    setViewTable,
    setSubmissionId,
    editUrl = null,
    handleDelete, 
    query = null
}) => {
    return (
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submission ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((script) => (
                    <tr key={script._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span
                                onClick={() => {
                                    setViewTable(true);
                                    setSubmissionId(script._id);
                                }}
                                className="px-2 cursor-pointer inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                            >
                                {script._id}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(script.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                                {editUrl && (
                                    <Link href={editUrl + script._id + query}
                                        className="bg-blue-500 hover:bg-blue-700 cursor-pointer text-white font-bold py-1 px-2 rounded text-sm shadow flex items-center gap-2 transition duration-200"

                                    >
                                        <FiPenTool />
                                    </Link>
                                )}
                                <button
                                    className="bg-red-500 hover:bg-red-700 cursor-pointer text-white font-bold py-1 px-2 rounded text-sm shadow flex items-center gap-2 transition duration-200"
                                    onClick={() => handleDelete(script._id)}
                                >
                                    <FiTrash2 />
                                </button>
                            </div>

                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default SubmissionManage;
