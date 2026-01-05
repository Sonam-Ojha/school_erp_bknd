import { Request, Response } from "express";
import { loginService, searchEmpByIdAll,addUser,updateUserService,deleteUserService,getEmpBankDetailsReportService} from "../services/authService";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ status: false, msg: "Username and password required" });

  try {
    const result = await loginService(username, password);
    return res.status(result.status ? 200 : 401).json(result);
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ status: false, msg: "Server error" });
  }
};

export const authMiddleware = (req: Request, res: Response, next: any) => {
  console.log("JWT_SECRET:", process.env.JWT_SECRET);

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ status: false, msg: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ status: false, msg: "Invalid token" });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  // console.log("Route hit! Params:", req.params, "Headers:", req.headers);

  const empId = req.params.id;
  // console.log('Fetching employee with ID:', empId);

  try {
    const result = await searchEmpByIdAll(empId);
    // console.log('DB result:', result);
    res.json(result); // send response once
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, msg: "Server error" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, name, email } = req.body;
    if (!username || !name || !email) {
      return res.status(400).json({ status: false, msg: "All fields required" });
    }

    const id = await addUser(username, name, email);
    res.json({ status: true, msg: "Inserted successfully", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, msg: err });
  }
};
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { name, email } = req.body;

    if (!userId || !name || !email) {
      return res.status(400).json({ status: false, msg: "All fields required" });
    }

    const affectedRows = await updateUserService(userId, name, email);

    if (affectedRows > 0)
      return res.json({ status: true, msg: "User updated successfully" });
    else
      return res.status(404).json({ status: false, msg: "User not found" });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ status: false, msg: "DB error" });
  }
};
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ status: false, msg: "User ID required" });
    }

    const affectedRows = await deleteUserService(userId);

    if (affectedRows > 0)
      return res.json({ status: true, msg: "User deleted successfully" });
    else
      return res.status(404).json({ status: false, msg: "User not found" });

  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ status: false, msg: "DB error" });
  }
};
export const getEmpBankDetailsReport = async (req: Request, res: Response) => {
  try {
    const data = await getEmpBankDetailsReportService(req.body);
    if (!data || data.length === 0) {
      return res.status(200).json({ status: false, msg: "Data not found" });
    }

    res.status(200).json({
      status: true,
      msg: "Employee Bank Details",
      data,
    });
  } catch (error) {
    console.error("Error in getEmpBankDetailsReport:", error);
    res.status(500).json({ status: false, msg: "Server error" });
  }
};

