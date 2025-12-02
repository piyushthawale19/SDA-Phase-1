import {Router} from 'express';
import * as userController from '../controllers/user.controller.js';
import {body} from 'express-validator';
import * as authMiddleware  from "../middleware/auth.middleware.js"
const router = Router();
// import { updateProfile } from "../controllers/user.controller.js";



router.post("/register", 
    body('email').isEmail().withMessage('Email must be a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    userController.createUserController
);

router.post('/login',
 body('email').isEmail().withMessage('Email must be a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
   userController.loginController
)

router.get("/profile", authMiddleware.authUser, userController.profileController)

router.get('/logout', authMiddleware.authUser, userController.logoutController)

router.get('/all', authMiddleware.authUser,userController.getAllUsersController)

router.put("/profile", authMiddleware.authUser, userController.updateProfile);


export default router;