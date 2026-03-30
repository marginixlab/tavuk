(function () {
    const storageKey = "purchase-price-analyzer-theme";
    let savedTheme = null;
    try {
        savedTheme = window.localStorage.getItem(storageKey);
    } catch (error) {
        savedTheme = null;
    }
    const systemPrefersDark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : false;
    const theme = savedTheme || (systemPrefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
})();
