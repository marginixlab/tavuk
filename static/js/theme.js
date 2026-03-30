(function () {
    const storageKey = "purchase-price-analyzer-theme";
    let systemThemeQuery = null;

    function readStoredTheme() {
        try {
            return window.localStorage.getItem(storageKey);
        } catch (error) {
            return null;
        }
    }

    function writeStoredTheme(theme) {
        try {
            window.localStorage.setItem(storageKey, theme);
        } catch (error) {
            return;
        }
    }

    function getTheme() {
        return document.documentElement.getAttribute("data-theme") || "light";
    }

    function updateThemeToggleLabel(themeToggle) {
        if (!themeToggle) return;

        const activeTheme = getTheme();
        themeToggle.textContent = activeTheme === "dark" ? "Light Mode" : "Dark Mode";
        themeToggle.setAttribute(
            "aria-label",
            `Switch to ${activeTheme === "dark" ? "light" : "dark"} mode`
        );
    }

    function applyTheme(theme, options = {}) {
        const { persist = true, onChange = null, themeToggle = null } = options;

        document.documentElement.setAttribute("data-theme", theme);

        if (persist) {
            writeStoredTheme(theme);
        }

        updateThemeToggleLabel(themeToggle);

        if (typeof onChange === "function") {
            onChange(theme);
        }
    }

    function bindThemeToggle(themeToggle, onChange) {
        updateThemeToggleLabel(themeToggle);

        if (!themeToggle) return;

        themeToggle.addEventListener("click", () => {
            const nextTheme = getTheme() === "dark" ? "light" : "dark";
            applyTheme(nextTheme, { persist: true, onChange, themeToggle });
        });
    }

    function bindSystemPreference(themeToggle, onChange) {
        if (!window.matchMedia) {
            return;
        }

        if (!systemThemeQuery) {
            systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
        }

        const handleThemeChange = (event) => {
            if (!readStoredTheme()) {
                applyTheme(event.matches ? "dark" : "light", {
                    persist: false,
                    onChange,
                    themeToggle
                });
            }
        };

        if (typeof systemThemeQuery.addEventListener === "function") {
            systemThemeQuery.addEventListener("change", handleThemeChange);
            return;
        }

        if (typeof systemThemeQuery.addListener === "function") {
            systemThemeQuery.addListener(handleThemeChange);
        }
    }

    window.PriceAnalyzerTheme = {
        storageKey,
        getTheme,
        applyTheme,
        updateThemeToggleLabel,
        bindThemeToggle,
        bindSystemPreference
    };
})();
