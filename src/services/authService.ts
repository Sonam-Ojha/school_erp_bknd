import { db } from "../utils/db";
import { decryptText } from "../utils/crypto"

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ResultSetHeader,RowDataPacket  } from "mysql2";
// console.log("DB connection test:", db);

export const loginService = async (username: string, password: string) => {
//   const [rows] = await db.query("SELECT * FROM users WHERE username = ? LIMIT 1", [username]);
const [rows] = await db.query("SELECT * FROM `1_user_master` WHERE username = ? LIMIT 1", [username]);

//  console.log("DB rows:", rows); 
  const user = (rows as any[])[0];

  if (!user) {
    return { status: false, msg: "Invalid credentials" };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { status: false, msg: "Invalid credentials" };
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );

  return {
    status: true,
    msg: "Login successful",
    data: {
      id: user.id,
      username: user.username,
      name: user.name,
    },
    token,
  };
};



export const searchEmpByIdAll = async (empId: string) => {
const [rows] = await db.query(`
    SELECT 
      u.id, 
      u.username, 
      u.name, 
      u.lname,
      l.lv_id,
      l.lv_type
    FROM \`1_user_master\` u
    LEFT JOIN \`3_lvs\` l ON l.emp_id = u.id
    WHERE u.username = ?
  `, [empId]);
  if ((rows as any[]).length === 0) return { status: false, msg: "Data not found" };

  // decryptText if needed
  const filtered = (rows as any[]).map(r => ({
    ...r,
    name: r.name + " " + r.lname,
  }));

  return { status: true, msg: "Employee data", data: filtered };
};

export const addUser = async (username: string, name: string, email: string): Promise<number> => {
  const query = "INSERT INTO 1_user_master (username, name, email) VALUES (?, ?, ?)";
  const [result] = await db.execute<ResultSetHeader>(query, [username, name, email]);
  console.log("DB RESULT:", result);
  return result.insertId; // 👈 yahan se id return karega
};
export const updateUserService = async (id: string, name: string, email: string): Promise<number> => {
  const query = "UPDATE 1_user_master SET name = ?, email = ? WHERE id = ?";
  const [result] = await db.execute<ResultSetHeader>(query, [name, email, id]);
  return result.affectedRows; // 👈 returns number of updated rows
};
// 🗑️ Delete User Service
export const deleteUserService = async (id: string): Promise<number> => {
  const query = "DELETE FROM 1_user_master WHERE id = ?";
  const [result] = await db.execute<ResultSetHeader>(query, [id]);
  return result.affectedRows; // returns number of deleted rows
};
export const getEmpBankDetailsReportService = async (inputs: any) => {
  const where: string[] = [
    "fin.status = 1",
    "fin.is_salary = 1",
    "fin.trash = 0",
    "um.trash = 0",
    "det.trash = 0",
    "occ.trash = 0",
    "opl.trash = 0",
    "rgn.trash = 0",
    "gct.trash = 0",
  ];

  let limit = 10;
  if (inputs.limit) limit = parseInt(inputs.limit);

  if (inputs.emp_id) where.push(`um.id = ${db.escape(inputs.emp_id)}`);
  if (inputs.cc_id) where.push(`occ.cc_id = ${db.escape(inputs.cc_id)}`);

  // bulk_emp filter
  let bulkCondition = "";
  if (inputs.bulk_emp) {
    const bulkEmp = JSON.parse(inputs.bulk_emp);
    if (Array.isArray(bulkEmp) && bulkEmp.length > 0) {
      const escaped = bulkEmp.map((e: string) => db.escape(e)).join(",");
      bulkCondition = ` AND um.username IN (${escaped})`;
    }
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const query = `
    SELECT DISTINCT
      um.username AS EmpId,
      fin.acc_no AS AccountNo,
      fin.bnk_id AS BankId,
      um.name AS Name,
      um.mobile AS Mobile,
      det.aadhar_no AS AadharNo,
      det.pan_no AS PanNo,
      occ.cc_ext_id AS CostCenter,
      opl.pl_name AS SiteName,
      rgn.rgn_name AS RegionName,
      gct.ct_name AS Location,
      go.option_desc AS BankName,
      fin.ifsc AS IfscCode,
      det.doj AS DateOfJoining,
      acctype.option_desc AS AccountType
    FROM 1_fin AS fin
    LEFT JOIN 1_user_master AS um ON um.id = fin.source_id
    LEFT JOIN 1_emp_det AS det ON det.user_id = um.id
    LEFT JOIN 0_org_cc AS occ ON occ.cc_id = um.cc_id
    LEFT JOIN 0_org_pl AS opl ON opl.pl_id = occ.pl_id
    LEFT JOIN 0_geo_rgn AS rgn ON rgn.rgn_id = opl.rgn_id
    LEFT JOIN 0_geo_ct AS gct ON gct.ct_id = opl.ct_id
    LEFT JOIN 0_gen_optn AS go ON go.option_id = fin.bnk_id
    LEFT JOIN 0_gen_optn AS acctype ON acctype.option_id = fin.acc_type
    ${whereSQL} ${bulkCondition}
    LIMIT ${limit}
  `;

  const [rows] = await db.query<RowDataPacket[]>(query);

  // Decrypt sensitive fields
  const decrypted = rows.map((row) => ({
    ...row,
    AccountNo: row.AccountNo,
    Name: row.Name,
    Mobile: row.Mobile,
    AadharNo: row.AadharNo,
    PanNo: row.PanNo,
    IfscCode: row.IfscCode,
  }));

  return decrypted;
};



