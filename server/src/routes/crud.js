import { Router } from "express";
import { escapeRegex, httpError } from "../lib/http.js";

// Generic list/create/update/delete router so simple entities stay tiny.
// readOnly: fields the client may never set directly (e.g. product stock).
export function crudRouter(Model, { searchFields = [], populate = "", readOnly = [], sort = { createdAt: -1 } } = {}) {
  const router = Router();

  const strip = (body) => {
    const clean = { ...body };
    readOnly.forEach((f) => delete clean[f]);
    delete clean._id;
    return clean;
  };

  router.get("/", async (req, res) => {
    const q = String(req.query.q || "").trim();
    const filter = {};
    if (q && searchFields.length) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = searchFields.map((f) => ({ [f]: rx }));
    }
    let query = Model.find(filter).sort(sort).limit(200);
    if (populate) query = query.populate(populate);
    res.json(await query);
  });

  router.post("/", async (req, res) => {
    const doc = await Model.create(strip(req.body));
    res.status(201).json(doc);
  });

  router.put("/:id", async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, strip(req.body), { new: true, runValidators: true });
    if (!doc) throw httpError(404, "Record not found");
    res.json(doc);
  });

  router.delete("/:id", async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw httpError(404, "Record not found");
    res.json({ ok: true });
  });

  return router;
}
