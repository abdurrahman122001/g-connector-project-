"use client";
import { ReactNode, useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import { addRule, setFormFields, setForms, setRepeaterFields, Rule } from "../../../store/slices/ConditionalRuleSlice";
import { RootState } from "@/store/store";
import ConditionalRuleBlock from "./ConditionalRuleBlock";
import { FieldDefinition, RepeatFieldDefinition } from "@/store/slices/ConditionalRuleSlice";

interface ConditionalRulesProps {
    children?: ReactNode;
    formId: string;
}

const ConditionalRules: React.FC<ConditionalRulesProps> = ({ formId }) => {
    const dispatch = useDispatch();
    const [rulesAdd, setRulesAdd] = useState<Rule | null>(null);
    const rules = useSelector((state: RootState) => state.conditionalReducer.rules);
    const formFields = useSelector((state: RootState) => state.conditionalReducer.formFields);
    const repeaterFormFields = useSelector((state: RootState) => state.conditionalReducer.repeaterFormFields);

    useEffect(() => {
        // Fetch form fields when component mounts
        const fetchFormFields = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${formId}`,

                    {
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}` },

                    }


                );
                const data = await response.json();
                if (data.success) {
                    const fields = data.data.fields || [];
                    const repeatable = data.data.repeatable || [];

                    // Dispatch top-level fields and flattened repeater sub-fields
                    dispatch(setFormFields(fields));
                    dispatch(setForms(data.data));

                    if (data.data && data.data.skipLogic) {
                        dispatch(addRule(data.data.skipLogic));
                    }

                    // Dispatch top-level repeater fields separately
                    const topLevelRepeaters = repeatable.map((rep: any) => ({
                        id: rep.id || rep._id,
                        label: rep.label,
                        name: rep.name
                    }));
                    dispatch(setRepeaterFields(topLevelRepeaters));
                }
            } catch (error) {
                console.error('Error fetching form fields:', error);
            }
        };
        fetchFormFields();
    }, [formId, dispatch]);


    useEffect(() => {

        dispatch(addRule(rulesAdd))
    }, [rulesAdd])
    const handleAddRule = () => {

        dispatch(addRule(null));
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold">Rule Builder</h1>
            <h5 className="text-gray-600">Add Conditional Logic to your Form</h5>

            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            <div className="bg-white mt-8 rounded-lg shadow-md border border-gray-200">
                {/* Card Header */}
                <div className="flex items-center px-6 py-4 border-b border-gray-200">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6 text-gray-700 mr-2"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M3 17h2.397a5 5 0 0 0 4.096 -2.133l.177 -.253m3.66 -5.227l.177 -.254a5 5 0 0 1 4.096 -2.133h3.397" />
                        <path d="M18 4l3 3l-3 3" />
                        <path d="M3 7h2.397a5 5 0 0 1 4.096 2.133l4.014 5.734a5 5 0 0 0 4.096 2.133h3.397" />
                        <path d="M18 20l3 -3l-3 -3" />
                    </svg>
                    <h1 className="text-lg font-semibold text-gray-800">
                        Conditional Rules
                    </h1>
                </div>

                {/* Main Content */}
                <div className="p-6">
                    {rules.map((rule) => (
                        <ConditionalRuleBlock
                            key={rule.id}
                            id={rule.id}
                            formId={formId}
                            repeaterFormFields={repeaterFormFields}
                            formFields={formFields}
                        />
                    ))}
                </div>

                {/* Add Rule Button (bottom-right) */}
                <div className="px-6 py-4 flex justify-end border-t border-gray-200">
                    <button
                        onClick={handleAddRule}
                        className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition"
                    >
                        <FiPlus className="w-5 h-5" />
                        Add rule
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConditionalRules;
