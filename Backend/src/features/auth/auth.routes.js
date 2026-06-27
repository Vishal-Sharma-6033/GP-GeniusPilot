import { Router } from "express"
import * as authController from "./auth.controller.js"
import * as authMiddleware from "./auth.middleware.js"

const authRouter = Router()

authRouter.post("/register", authController.registerUserController)

authRouter.post("/login", authController.loginUserController)

authRouter.post("/logout", authController.logoutUserController)

authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)

authRouter.get("/me", authMiddleware.authUser, authController.getMeController)

authRouter.post("/clerk-sync", authController.clerkSyncController)

export default authRouter