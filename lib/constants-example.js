API_BASE_URL = "https://api.eternityready.com"
ETERNITY_BASE_URL = "https://eternityready.com"
ETERNITY_ENV_MODE = "production"
GOOGLE_CLIENT_ID = "id.apps.googleusercontent.com"

if (ETERNITY_ENV_MODE === "production") {
    window.console = {
        log: function () {},
        error: function () {},
        warn: function () {},
    };
}
