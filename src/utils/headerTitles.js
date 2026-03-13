export const headerTitles = [
    { title: "Dashboard", path: "/dashboard" },
    { title: "Manage Project", path: "/dashboard/manage-project" },
    { title: "Manage Tickets", path: "/dashboard/manage-tickets" },
    { title: "Manage Department", path: "/dashboard/manage-department" },
    { title: "Manage User", path: "/dashboard/manage-user" },
    { title: "Manage Status", path: "/dashboard/manage-status" },
    { title: "Manage Role", path: "/dashboard/manage-role" },
    { title: "Add Role", path: "/dashboard/manage-role/add" },
    { title: "Edit Role", path: "/dashboard/manage-role/edit/:id" },
    { title: "Manage Company", path: "/dashboard/manage-company" },
];

export const matchRoute = (routePath, currentPath) => {
    const routeParts = routePath.split("/").filter(Boolean)
    const currentParts = currentPath.split("/").filter(Boolean)

    if (routeParts.length !== currentParts.length) return false

    return routeParts.every((part, i) => {
        return part.startsWith(":") || part === currentParts[i]
    })
}