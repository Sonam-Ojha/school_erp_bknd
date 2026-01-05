import { Router } from "express";
import { login, getEmployeeById, authMiddleware,createUser,updateUser,deleteUser ,getEmpBankDetailsReport  } from "../controllers/authController";


const router = Router();

router.post("/login", login);
router.get("/search_emp_by_id_all/:id", authMiddleware, getEmployeeById);

router.post('/add-user', authMiddleware,createUser);
router.put("/update-user/:id",authMiddleware,updateUser);
router.delete("/delete-user/:id",authMiddleware, deleteUser);
router.post("/get-emp-bank-details",authMiddleware, getEmpBankDetailsReport);

export default router;
