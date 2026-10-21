import { crudRouter } from "./crud.js";
import Supplier from "../models/Supplier.js";

export default crudRouter(Supplier, { searchFields: ["name", "phone", "email"], sort: { name: 1 } });
