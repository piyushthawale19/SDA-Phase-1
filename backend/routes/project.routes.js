import { Router} from 'express';
import {body} from 'express-validator';
import * as projectController  from "../controllers/project.controller.js";
import * as authMiddleWare from "../middleware/auth.middleware.js"
const router = Router();
import multer from "multer";


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.post(
  "/create",
  authMiddleWare.authUser,
  upload.single("image"),
  body("name").notEmpty().withMessage("Project name is required"), // must match exactly
  projectController.createProject
);

router.get('/all',
    authMiddleWare.authUser,
    projectController.getAllProjects   // ✅ match function name
);

router.put('/add-user', 
  authMiddleWare.authUser,
  body('projectId').isString().withMessage('Project ID is reqired'),
  body('users').isArray({min: 1}).withMessage('User must be an array of strings').bail()
    .custom((users)=> users.every(user => typeof user ==='string')).withMessage('Each user must be a string'),
  projectController.addUserToProject
)


router.get('/get-project/:projectId',
    authMiddleWare.authUser,
    projectController.getProjectById   // ✅ corrected spelling
);

router.put(
  '/update-file-tree',
  authMiddleWare.authUser,
  body('projectId').isString().withMessage('project ID is required'),
  body('fileTree').isObject().withMessage('File tree is required'),
  projectController.updateFileTree
);

export default router;