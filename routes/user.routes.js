import express from "express";
import { updateUser, getUser, RegisterUser, LoginUser, googleAuthUser } from "../controllers/user.js";

const UserRouter = express.Router();

UserRouter.post("/user-register", RegisterUser);
UserRouter.post("/update-user", updateUser);
UserRouter.get("/getUser/:id", getUser);
UserRouter.post("/login-user", LoginUser);
UserRouter.post("/google-auth", googleAuthUser);

export default UserRouter;