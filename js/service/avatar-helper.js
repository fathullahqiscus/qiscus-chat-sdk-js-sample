// Avatar Placeholder Helper
// Generate SVG placeholder with first letter of name
define([], function () {
    function getAvatarPlaceholder(name) {
        var initial = name ? name.charAt(0).toUpperCase() : '?';
        return `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%236b7280%22 font-family=%22Arial%22 font-size=%2240%22 text-anchor=%22middle%22 x=%2250%22 y=%2265%22%3E${initial}%3C/text%3E%3C/svg%3E`;
    }

    function getAvatarErrorHandler(name) {
        return `this.onerror=null; this.src='${getAvatarPlaceholder(name)}';`;
    }

    return {
        getPlaceholder: getAvatarPlaceholder,
        getErrorHandler: getAvatarErrorHandler
    };
});
