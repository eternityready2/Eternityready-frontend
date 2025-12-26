API_BASE_URL = "https://api.eternityready.com"
ETERNITY_BASE_URL = "https://eternityready.com"
ETERNITY_ENV_MODE = "production"

if (ETERNITY_ENV_MODE === "production") {
    window.console = {
        log: function () {},
        error: function () {},
        warn: function () {},
    };
}
