const Controller = require("./controller");

module.exports = class BarangayController extends Controller {

  constructor() {

    var table = 'barangays';
    var hidden = [];

    super(table, hidden);
  }


  /**
   * Get Active Collection
   */
  getActive = async () => {
    let res = await this.qb.select().where({
      status: 1
    }).call();
    res = this._hideColumns(res);
    return res;
  }

  getById = async(req) => {
    let barangayId = req.params.id;
    let res = await this._getById(barangayId);
    return res;
  }

  /**
   * Create or Update
   */
  save = async (req) => {

    let barangayId = req.params.id;
    if(!req.body.barangay) {
      return {
        error: "Missing parameter `barangay`"
      }
    }

    //Create
    if(barangayId === undefined) {
      return await this._add(req.body.barangay);
    }
    
    //Update
    else {

      if(barangayId === ":id") {
        return {
          error: "Missing route parameter `id`"
        }
      }
      else {

        return await this._updateById(barangayId, req.body.barangay);
      }
    }
  }

  /**
   * Delete By Id
   */
  deleteById = async (req) => {
    let barangayId = req.params.id;
    if(barangayId === ":id") {
      return {
        error: "Missing route parameter `id`"
      }
    }
    else {
      return await this._updateById(barangayId, {
        status: 0
      })
    }
  }
}