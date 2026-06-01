function getAuthCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production"

    return {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
    }
}

module.exports = { getAuthCookieOptions }
