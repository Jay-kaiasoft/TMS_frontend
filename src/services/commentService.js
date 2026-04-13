import { COMMENT_TYPES } from "../utils/constants";
import { getUserDetails } from "../utils/getUserDetails";

export const getAllowedCommentTypes = () => {
    const user = getUserDetails();
    // If no user is found, default to a safe empty list or just "Open"
    if (!user || !user.rolename) {
        return COMMENT_TYPES.filter(type => type.id === 1);
    }

    const { rolename } = user;

    switch (rolename) {
        case 'Developer':
            // Return: Only Open (ID: 1)
            return COMMENT_TYPES.filter(type => [6].includes(type.id));

        case 'Manager':
            // Return: Private for Developer (ID: 2), Admin only (ID: 5), Open (ID: 1)
            return COMMENT_TYPES.filter(type => [1, 2, 5].includes(type.id));

        case 'Administrator':
            // Return: Private for manager (ID: 4), Admin only (ID: 5), Open (ID: 1), Private for Customer (ID: 3)
            return COMMENT_TYPES.filter(type => [1, 3, 4, 5].includes(type.id));

        default:
            // Fallback for unknown roles
            return COMMENT_TYPES.filter(type => [4, 5].includes(type.id));
    }
};