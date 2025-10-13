"use client"

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { resetRule } from "@/store/slices/ConditionalRuleSlice";
import ConditionalRules from "@/app/components/ConditionalRule/ConditionalRules";
type PageProps = {
    params: { id: string; };
  }
export default function Page({ params }: PageProps) {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(resetRule());
    }, [dispatch]);

    return (
        <div>
            <ConditionalRules formId={params.id} />
        </div>
    );
}
