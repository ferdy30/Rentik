// Placeholder for error boundary or check
export const checkParams = (params: any, required: string[]) => {
    if (!params) return false;
    for (const req of required) {
        if (!params[req]) return false;
    }
    return true;
};
