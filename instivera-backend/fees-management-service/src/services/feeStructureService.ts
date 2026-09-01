import { getTenantModels } from "../models";

export class FeeStructureService {
  
  /* ----------------------------------------------------
     CREATE FEE HEAD
  ---------------------------------------------------- */
  async createFeeHead(payload: {
    name: string;
    description?: string;
    ledger_id: number;
    is_active?: number;
  }, tenant: string) {
    const { name, description, ledger_id, is_active = 1 } = payload;

    if (!name || !ledger_id) {
      throw new Error("Name and ledger_id are required");
    }    
    const models = getTenantModels(tenant);

    const exists = await models.FeeHead.findOne({ where: { name } });
    if (exists) {
      throw new Error("Fee head already exists");
    }

    const feeHead = await models.FeeHead.create({
      name,
      description: description || null,
      ledger_id,
      is_active,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return feeHead;
  }

  /* ----------------------------------------------------
     GET ALL FEE HEADS
  ---------------------------------------------------- */
  async getFeeHeads(tenant: string) {
    const models = getTenantModels(tenant);
    return await models.FeeHead.findAll({
      order: [["id", "ASC"]],
    });
  }

  /* ----------------------------------------------------
     CREATE FEE PARTICULAR
  ---------------------------------------------------- */
  async createFeeParticular(payload: {
    fee_head_id: number;
    academic_year_id: number;
    program_id: number;
    semester_id?: number;
    amount: number;
    is_optional?: number;
  }, tenant: string) {
    const {
      fee_head_id,
      academic_year_id,
      program_id,
      semester_id = null,
      amount,
      is_optional = 0,
    } = payload;

    if (!fee_head_id || !academic_year_id || !program_id || !amount) {
      throw new Error("Missing required fields");
    }
    const models = getTenantModels(tenant);
    // Validate fee head exists
    const head = await models.FeeHead.findByPk(fee_head_id);
    if (!head) throw new Error("Invalid fee_head_id");

    const particular = await models.FeeParticular.create({
      fee_head_id,
      academic_year_id,
      program_id,
      semester_id,
      amount,
      is_optional,
      created_at: new Date(),
      updated_at: new Date()
    });

    return particular;
  }

  /* ----------------------------------------------------
     GET FEE PARTICULARS FOR A PROGRAM + YEAR
  ---------------------------------------------------- */
  async getFeeParticulars(program_id: number, academic_year_id: number, semester_id: number, tenant: string) {
    if (!program_id || !academic_year_id || !semester_id) {
      throw new Error("program_id and academic_year_id are required");
    }
    const models = getTenantModels(tenant);
    const particulars = await models.FeeParticular.findAll({
      where: { program_id, academic_year_id, semester_id },
      include: [
        {
          model: models.FeeHead,
          as: "fee_head",
          attributes: ["id", "name", "ledger_id"],
        },
      ],
      order: [["fee_head_id", "ASC"]],
    });

    return particulars;
  }
}