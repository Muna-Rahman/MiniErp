import { crudRouter } from "./crud.js";
import Product from "../models/Product.js";

// Stock is read-only here: it only changes through purchases and sales.
export default crudRouter(Product, {
  searchFields: ["name", "sku", "category"],
  populate: "supplier",
  readOnly: ["stock"],
  sort: { name: 1 },
});
