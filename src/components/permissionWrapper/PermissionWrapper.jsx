import { getUserDetails } from "../../utils/getUserDetails";

const checkPermission = ({
    functionalityName,
    moduleName,
    actionId,
    actionIds,
    checkAll = false,
}) => {
    const userData = getUserDetails() || {};
    // Allow Admins / full-access users 
    if (userData?.rolename === "Administrator" || userData?.roleName === "Admin") {
        return true;
    }

    const actionsToCheck = actionIds || (actionId ? [actionId] : []);

    const hasPermission = userData?.permissions?.functionalities?.some((item) =>
        item?.functionalityName?.toLowerCase() === functionalityName?.toLowerCase() &&
        item?.modules?.some((row) =>
            row?.moduleName?.toLowerCase() === moduleName?.toLowerCase() &&
            (checkAll
                ? actionsToCheck.every((action) => row?.roleAssignedActions?.includes(action))
                : actionsToCheck.some((action) => row?.roleAssignedActions?.includes(action))
            )
        )
    );

    return !!hasPermission;
};

const PermissionWrapper = ({
    component,
    fallbackComponent = null,
    functionalityName,
    moduleName,
    actionId,
    actionIds,
    checkAll = false,
}) => {
    const hasPermission = checkPermission({
        functionalityName,
        moduleName,
        actionId,
        actionIds,
        checkAll,
    });

    return hasPermission ? <>{component}</> : fallbackComponent;
};

// 🔹 Static helper so you can call it from anywhere
PermissionWrapper.hasPermission = (options) => checkPermission(options);

export default PermissionWrapper;