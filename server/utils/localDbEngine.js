const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');
const dbFilePath = path.join(dataDir, 'sriyas_db.runtime.json');

function generateObjectId(seedStr) {
  if (seedStr) {
    return crypto.createHash('md5').update(String(seedStr)).digest('hex').slice(0, 24);
  }
  return crypto.randomBytes(12).toString('hex');
}

function loadStore() {
  try {
    if (fs.existsSync(dbFilePath)) {
      const raw = fs.readFileSync(dbFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Warning reading local runtime DB file:', err.message);
  }
  return {
    Brand: [],
    Category: [],
    Product: [],
    Admin: [],
    ProductView: []
  };
}

let store = loadStore();

function saveStore() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbFilePath, JSON.stringify(store, null, 2), 'utf8');
}

function reloadStore() {
  store = loadStore();
  return store;
}

function matchesFilter(doc, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, cond] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(cond)) {
      if (!cond.some(sub => matchesFilter(doc, sub))) return false;
      continue;
    }
    if (key === '$and' && Array.isArray(cond)) {
      if (!cond.every(sub => matchesFilter(doc, sub))) return false;
      continue;
    }

    const val = key.includes('.')
      ? key.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), doc)
      : doc[key];

    if (cond === null) {
      if (val !== null && val !== undefined) return false;
      continue;
    }

    if (cond instanceof RegExp) {
      if (!cond.test(String(val || ''))) return false;
      continue;
    }

    if (typeof cond === 'object' && !(cond instanceof Date) && !Array.isArray(cond)) {
      if ('$regex' in cond) {
        const flags = cond.$options || '';
        const rx = cond.$regex instanceof RegExp ? cond.$regex : new RegExp(cond.$regex, flags);
        if (!rx.test(String(val || ''))) return false;
        continue;
      }
      if ('$in' in cond && Array.isArray(cond.$in)) {
        const strSet = cond.$in.map(v => String(v));
        if (!strSet.includes(String(val))) return false;
        continue;
      }
      if ('$nin' in cond && Array.isArray(cond.$nin)) {
        const strSet = cond.$nin.map(v => String(v));
        if (strSet.includes(String(val))) return false;
        continue;
      }
      if ('$ne' in cond) {
        if (String(val) === String(cond.$ne)) return false;
        continue;
      }
      if ('$gte' in cond || '$lte' in cond || '$gt' in cond || '$lt' in cond) {
        const docTime = val ? new Date(val).getTime() : NaN;
        if ('$gte' in cond && !(docTime >= new Date(cond.$gte).getTime())) return false;
        if ('$gt' in cond && !(docTime > new Date(cond.$gt).getTime())) return false;
        if ('$lte' in cond && !(docTime <= new Date(cond.$lte).getTime())) return false;
        if ('$lt' in cond && !(docTime < new Date(cond.$lt).getTime())) return false;
        continue;
      }
    }

    if (String(val) !== String(cond)) {
      return false;
    }
  }
  return true;
}

const REF_MAP = {
  brand: 'Brand',
  brandId: 'Brand',
  category: 'Category',
  categoryId: 'Category',
  productId: 'Product'
};

function populateDoc(doc, populateSpecs) {
  if (!doc || !populateSpecs || populateSpecs.length === 0) return doc;
  const copy = JSON.parse(JSON.stringify(doc));
  for (const spec of populateSpecs) {
    const field = typeof spec === 'string' ? spec : spec.path;
    const selectStr = typeof spec === 'object' && spec.select ? spec.select : null;
    const targetModel = REF_MAP[field];
    if (!targetModel || !copy[field]) continue;
    const targetId = typeof copy[field] === 'object' && copy[field]._id ? copy[field]._id : copy[field];
    const found = (store[targetModel] || []).find(item => String(item._id) === String(targetId));
    if (found) {
      let popObj = JSON.parse(JSON.stringify(found));
      if (selectStr) {
        const fields = selectStr.split(/\s+/).filter(Boolean);
        const filtered = { _id: popObj._id };
        fields.forEach(f => {
          if (f in popObj) filtered[f] = popObj[f];
        });
        popObj = filtered;
      }
      copy[field] = popObj;
    }
  }
  return copy;
}

class LocalQuery {
  constructor(modelName, filter = {}, isSingle = false, byId = null) {
    this.modelName = modelName;
    this.filter = filter;
    this.isSingle = isSingle;
    this.byId = byId;
    this._populates = [];
    this._sort = null;
    this._skip = 0;
    this._limit = null;
    this._select = null;
  }

  populate(pathOrObj, select) {
    if (typeof pathOrObj === 'string') {
      this._populates.push({ path: pathOrObj, select });
    } else if (Array.isArray(pathOrObj)) {
      pathOrObj.forEach(p => this.populate(p));
    } else if (pathOrObj && typeof pathOrObj === 'object') {
      this._populates.push(pathOrObj);
    }
    return this;
  }

  sort(sortSpec) {
    this._sort = sortSpec;
    return this;
  }

  skip(n) {
    this._skip = Number(n) || 0;
    return this;
  }

  limit(n) {
    this._limit = Number(n) || null;
    return this;
  }

  select(sel) {
    this._select = sel;
    return this;
  }

  lean() {
    return this;
  }

  exec() {
    reloadStore();
    const coll = store[this.modelName] || [];
    let results;
    if (this.byId !== null) {
      const found = coll.find(d => String(d._id) === String(this.byId));
      results = found ? [found] : [];
    } else {
      results = coll.filter(d => matchesFilter(d, this.filter));
    }

    if (this._sort) {
      const sortEntries = typeof this._sort === 'string'
        ? this._sort.split(/\s+/).filter(Boolean).map(k => (k.startsWith('-') ? [k.slice(1), -1] : [k, 1]))
        : Object.entries(this._sort);

      results = [...results].sort((a, b) => {
        for (const [field, dir] of sortEntries) {
          const va = a[field];
          const vb = b[field];
          if (va === vb) continue;
          if (va === undefined || va === null) return 1;
          if (vb === undefined || vb === null) return -1;
          if (typeof va === 'string' && typeof vb === 'string') {
            const cmp = va.localeCompare(vb);
            if (cmp !== 0) return cmp * dir;
          } else {
            if (va < vb) return -1 * dir;
            if (va > vb) return 1 * dir;
          }
        }
        return 0;
      });
    }

    if (this._skip > 0) {
      results = results.slice(this._skip);
    }
    if (this._limit !== null) {
      results = results.slice(0, this._limit);
    }

    results = results.map(doc => populateDoc(doc, this._populates));

    if (this.isSingle) {
      const single = results[0] || null;
      if (single && this.modelName === 'Admin') {
        const bcrypt = require('bcryptjs');
        Object.defineProperty(single, 'comparePassword', {
          enumerable: false,
          value: async function (candidate) {
            return bcrypt.compare(candidate, this.passwordHash);
          }
        });
      }
      if (single) {
        Object.defineProperty(single, 'save', {
          enumerable: false,
          value: async function () {
            reloadStore();
            const list = store[this.modelName] || store[
              Object.keys(store).find(k => (store[k] || []).some(x => String(x._id) === String(single._id)))
            ];
            if (list) {
              const idx = list.findIndex(x => String(x._id) === String(single._id));
              if (idx !== -1) {
                single.updatedAt = new Date().toISOString();
                const plain = JSON.parse(JSON.stringify(single));
                // Restore unpopulated ObjectIds if populated
                for (const refKey of ['brand', 'category']) {
                  if (plain[refKey] && typeof plain[refKey] === 'object' && plain[refKey]._id) {
                    plain[refKey] = plain[refKey]._id;
                  }
                }
                list[idx] = plain;
                saveStore();
              }
            }
            return single;
          }
        });
      }
      return Promise.resolve(single);
    }

    return Promise.resolve(results);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

function attachLocalAdapterToModel(Model) {
  const modelName = Model.modelName;
  if (!store[modelName]) store[modelName] = [];

  Model.find = function (filter = {}) {
    return new LocalQuery(modelName, filter, false);
  };

  Model.findOne = function (filter = {}) {
    return new LocalQuery(modelName, filter, true);
  };

  Model.findById = function (id) {
    return new LocalQuery(modelName, {}, true, id);
  };

  Model.countDocuments = async function (filter = {}) {
    reloadStore();
    return (store[modelName] || []).filter(d => matchesFilter(d, filter)).length;
  };

  Model.create = async function (data) {
    reloadStore();
    const isArr = Array.isArray(data);
    const items = isArr ? data : [data];
    const created = [];
    const now = new Date().toISOString();

    for (const item of items) {
      const doc = {
        _id: item._id ? String(item._id) : generateObjectId(),
        ...JSON.parse(JSON.stringify(item)),
        createdAt: item.createdAt || now,
        updatedAt: item.updatedAt || now
      };
      if (modelName === 'Product') {
        if (doc.isActive === undefined) doc.isActive = true;
        if (doc.deletedAt === undefined) doc.deletedAt = null;
        if (doc.viewCount === undefined) doc.viewCount = 0;
        if (doc.displayOrder === undefined) doc.displayOrder = 0;
      }
      if (modelName === 'Brand' || modelName === 'Category') {
        if (doc.isActive === undefined) doc.isActive = true;
        if (doc.displayOrder === undefined) doc.displayOrder = 0;
      }
      if (modelName === 'ProductView' && !doc.viewedAt) {
        doc.viewedAt = now;
      }
      store[modelName].push(doc);
      created.push(doc);
    }
    saveStore();
    return isArr ? created : created[0];
  };

  Model.findOneAndUpdate = function (filter, update, options = {}) {
    reloadStore();
    const coll = store[modelName] || [];
    let idx = coll.findIndex(d => matchesFilter(d, filter));
    const now = new Date().toISOString();

    const applyUpdate = (target) => {
      const copy = { ...target };
      if (update.$set) {
        Object.assign(copy, JSON.parse(JSON.stringify(update.$set)));
      }
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          copy[k] = (Number(copy[k]) || 0) + Number(v);
        }
      }
      for (const [k, v] of Object.entries(update)) {
        if (!k.startsWith('$')) {
          copy[k] = v !== undefined ? JSON.parse(JSON.stringify(v)) : v;
        }
      }
      copy.updatedAt = now;
      return copy;
    };

    if (idx === -1) {
      if (options.upsert) {
        const base = { _id: generateObjectId(), createdAt: now };
        for (const [k, v] of Object.entries(filter)) {
          if (!k.startsWith('$') && typeof v !== 'object') base[k] = v;
        }
        const doc = applyUpdate(base);
        coll.push(doc);
        saveStore();
        return new LocalQuery(modelName, {}, true, doc._id);
      }
      return new LocalQuery(modelName, { _id: '__none__' }, true);
    }

    coll[idx] = applyUpdate(coll[idx]);
    saveStore();
    return new LocalQuery(modelName, {}, true, coll[idx]._id);
  };

  Model.findByIdAndUpdate = function (id, update, options = {}) {
    return Model.findOneAndUpdate({ _id: String(id) }, update, options);
  };

  Model.findByIdAndDelete = async function (id) {
    reloadStore();
    const coll = store[modelName] || [];
    const idx = coll.findIndex(d => String(d._id) === String(id));
    if (idx === -1) return null;
    const [removed] = coll.splice(idx, 1);
    saveStore();
    return removed;
  };

  Model.deleteMany = async function (filter = {}) {
    reloadStore();
    const coll = store[modelName] || [];
    const remaining = coll.filter(d => !matchesFilter(d, filter));
    const deletedCount = coll.length - remaining.length;
    store[modelName] = remaining;
    saveStore();
    return { deletedCount };
  };
}

function activateLocalDbAdapter() {
  const Brand = require('../models/Brand');
  const Category = require('../models/Category');
  const Product = require('../models/Product');
  const Admin = require('../models/Admin');
  const ProductView = require('../models/ProductView');

  [Brand, Category, Product, Admin, ProductView].forEach(attachLocalAdapterToModel);
}

module.exports = {
  activateLocalDbAdapter,
  generateObjectId,
  dbFilePath
};

