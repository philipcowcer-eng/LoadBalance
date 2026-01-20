from models import RoleEnum

# Define permissions as string constants
PERM_EDIT_STAFF_PLANNING = "edit_staff_planning"
PERM_VIEW_STAFF_PLANNING = "view_staff_planning"
PERM_ADD_ENGINEER = "add_engineer"
PERM_ALLOCATE_RESOURCES = "allocate_resources"

PERM_EDIT_PROJECT_REGISTRY = "edit_project_registry"
PERM_VIEW_PROJECT_REGISTRY = "view_project_registry"
PERM_CREATE_PROJECT = "create_project"
PERM_EDIT_PROJECT_STATUS = "edit_project_status"

PERM_EXPORT_DATA = "export_data"
PERM_IMPORT_DATA = "import_data"

PERM_VIEW_ACTIVITY_LOG = "view_activity_log"
PERM_RESTORE_SNAPSHOT = "restore_snapshot"
PERM_MANAGE_USERS = "manage_users"

# Map Roles to List of Permissions
ROLE_PERMISSIONS = {
    "admin": [
        PERM_EDIT_STAFF_PLANNING, PERM_VIEW_STAFF_PLANNING, PERM_ADD_ENGINEER, PERM_ALLOCATE_RESOURCES,
        PERM_EDIT_PROJECT_REGISTRY, PERM_VIEW_PROJECT_REGISTRY, PERM_CREATE_PROJECT, PERM_EDIT_PROJECT_STATUS,
        PERM_EXPORT_DATA, PERM_IMPORT_DATA,
        PERM_VIEW_ACTIVITY_LOG, PERM_RESTORE_SNAPSHOT, PERM_MANAGE_USERS
    ],
    "resource_manager": [
        PERM_EDIT_STAFF_PLANNING, PERM_VIEW_STAFF_PLANNING, PERM_ADD_ENGINEER, PERM_ALLOCATE_RESOURCES,
        PERM_VIEW_PROJECT_REGISTRY, PERM_CREATE_PROJECT,
        PERM_EXPORT_DATA,
        PERM_VIEW_ACTIVITY_LOG
    ],
    "project_manager": [
        PERM_VIEW_STAFF_PLANNING,
        PERM_EDIT_PROJECT_REGISTRY, PERM_VIEW_PROJECT_REGISTRY, PERM_CREATE_PROJECT, PERM_EDIT_PROJECT_STATUS,
        PERM_EXPORT_DATA
    ],
    "engineer": [
        PERM_VIEW_STAFF_PLANNING,
        PERM_VIEW_PROJECT_REGISTRY, PERM_CREATE_PROJECT
    ]
}

def get_role_permissions(role: str) -> list[str]:
    return ROLE_PERMISSIONS.get(role, [])
