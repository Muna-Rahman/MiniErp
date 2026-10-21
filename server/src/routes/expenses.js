import { crudRouter } from "./crud.js";
import Expense from "../models/Expense.js";

export default crudRouter(Expense, { searchFields: ["title", "category"], sort: { date: -1 } });
