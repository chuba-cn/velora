#!/bin/bash

# Array of shadcn-ui components
components=(
    "accordion"
    "alert"
    "alert-dialog"
    "aspect-ratio"
    "avatar"
    "badge"
    "breadcrumb"
    "button"
    "calendar"
    "card"
    "carousel"
    "checkbox"
    "collapsible"
    "combobox"
    "command"
    "context-menu"
    "dialog"
    "dropdown-menu"
    "form"
    "hover-card"
    "input"
    "label"
    "menubar"
    "navigation-menu"
    "pagination"
    "popover"
    "progress"
    "radio-group"
    "resizable"
    "scroll-area"
    "select"
    "separator"
    "sidebar"
    "sheet"
    "skeleton"
    "slider"
    "sonner"
    "switch"
    "table"
    "tabs"
    "textarea"
    "toast"
    "toggle"
    "toggle-group"
    "tooltip"
)

# Function to add a component
add_component() {
    echo "Adding component: $1"
    pnpm dlx shadcn@latest add "$1"
}

# Loop through components and add each one
for component in "${components[@]}"; do
    add_component "$component"
done

echo "All shadcn-ui components have been added!"
