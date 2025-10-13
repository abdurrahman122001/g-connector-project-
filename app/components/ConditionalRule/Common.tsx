const commonOperators = {
    isPresent: 'is present',
    isBlank: 'is blank',
    equalTo: 'equals',
    notEqualTo: 'does not equal',
    isIn: 'contains',
    isNotIn: 'does not contains',
    startsWith: 'starts with',
    endsWith: 'ends with',
};

const Common = {
    inputs: {
        text: { ...commonOperators },
        textarea: { ...commonOperators },
        number: { ...commonOperators },
        email: { ...commonOperators },
        date: { ...commonOperators },
        select: {
            ...commonOperators,
            isPresent: 'has option selected',
            isBlank: 'has no option selected',
        },
        file: {
            hasFileSelected: 'has file selected',
            hasNoFileSelected: 'has no file selected',
        },
        submit: {
            hasBeenSubmitted: "has been submitted"
        },
        radio: {
            ...commonOperators,
            isPresent: "has option selected",
            isBlank: 'has no option selected',
        },
        checkbox: {
            isChecked: "is checked",
            isNotChecked: "is not checked",
            hasValue: "has value",
            doesNotHaveValue: "does not have value"
        }
    },
};

export default Common;
