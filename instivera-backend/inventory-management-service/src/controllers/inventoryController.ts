import { Request, Response, NextFunction } from "express";
import { getTenantModels } from "../models";
import { InventorySettingsService } from "../services/inventorySettingsService";
import { InventoryService } from "../services/inventoryService";
import { FinanceIntegrationService } from "../client/financeServiceIntegration";

const settingsService = new InventorySettingsService();
const inventoryService = new InventoryService();
const financeService = new FinanceIntegrationService();

// --- Categories ---
export const getCategories = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);

        const categories = await models.InventoryCategories.findAll();

        res.json({
            status: "success",
            message: "Categories fetched successfully",
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ status: "error", message: "Category name is required" });
        }

        const category = await models.InventoryCategories.create({ name, description });

        res.status(201).json({
            status: "success",
            message: "Category created successfully",
            data: category
        });
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);
        const { id } = req.params;

        const category: any = await models.InventoryCategories.findByPk(id);

        if (!category) {
            return res.status(404).json({ status: "error", message: "Category not found" });
        }

        await category.destroy();

        res.json({
            status: "success",
            message: "Category deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// --- Departments ---
export const getDepartments = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);

        const departments = await models.InventoryDepartments.findAll();

        res.json({
            status: "success",
            message: "Departments fetched successfully",
            data: departments
        });
    } catch (error) {
        next(error);
    }
};

export const createDepartment = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);
        const { name, head_of_department_id } = req.body;

        if (!name) {
            return res.status(400).json({ status: "error", message: "Department name is required" });
        }

        const department = await models.InventoryDepartments.create({ name, head_of_department_id });

        res.status(201).json({
            status: "success",
            message: "Department created successfully",
            data: department
        });
    } catch (error) {
        next(error);
    }
};

export const deleteDepartment = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);
        const { id } = req.params;

        const department: any = await models.InventoryDepartments.findByPk(id);

        if (!department) {
            return res.status(404).json({ status: "error", message: "Department not found" });
        }

        await department.destroy();

        res.json({
            status: "success",
            message: "Department deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// --- Vendors ---
export const getVendors = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);

        const vendors = await models.InventoryVendors.findAll();

        res.json({
            status: "success",
            message: "Vendors fetched successfully",
            data: vendors
        });
    } catch (error) {
        next(error);
    }
};

export const createVendor = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);
        const { name, contact_person, email, phone, address } = req.body;

        if (!name) {
            return res.status(400).json({ status: "error", message: "Vendor name is required" });
        }

        const vendor = await models.InventoryVendors.create({ name, contact_person, email, phone, address });

        res.status(201).json({
            status: "success",
            message: "Vendor created successfully",
            data: vendor
        });
    } catch (error) {
        next(error);
    }
};

export const deleteVendor = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);
        const { id } = req.params;

        const vendor: any = await models.InventoryVendors.findByPk(id);

        if (!vendor) {
            return res.status(404).json({ status: "error", message: "Vendor not found" });
        }

        await vendor.destroy();

        res.json({
            status: "success",
            message: "Vendor deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// --- Assets ---
export const createAsset = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);

        console.log("createAsset req.body:", req.body);

        const { quantity, ...assetData } = req.body;

        // Sanitize unique fields: empty strings cause UNIQUE constraint violations
        if (!assetData.serial_number) delete assetData.serial_number;
        if (!assetData.barcode) delete assetData.barcode;
        if (!assetData.qr_code) delete assetData.qr_code;

        const qty = quantity ? parseInt(quantity, 10) : 1;

        if (qty > 1) {
            // Bulk insert logic
            const assetsToCreate = [];
            const baseAssetCode = assetData.asset_code || `AST-${Date.now().toString().slice(-6)}`;

            // Delete unique manual fields to prevent constraint errors
            delete assetData.serial_number;
            delete assetData.barcode;
            delete assetData.qr_code;

            // Generate array of assets
            for (let i = 0; i < qty; i++) {
                const uniqueSuffix = `${Date.now().toString().slice(-6)}-${i + 1}`;
                assetsToCreate.push({
                    ...assetData,
                    asset_code: `${baseAssetCode}-${i + 1}`,
                    qr_code: `QR-${uniqueSuffix}`,
                    barcode: `BC-${uniqueSuffix}`,
                    created_by: req.user?.id || 1
                });
            }

            try {
                const assets = await models.InventoryAssets.bulkCreate(assetsToCreate);

                if (req.body.status) {
                    const verificationsToCreate = assets.map((asset: any) => ({
                        asset_id: asset.id,
                        status: req.body.status,
                        verified_by: req.user?.id || 1,
                        remarks: 'Initial status on asset creation',
                        verification_date: new Date()
                    }));
                    await models.InventoryVerifications.bulkCreate(verificationsToCreate);
                }

                // Add activity logs for manual auto-created assets in bulk
                const activitiesToCreate = assets.map((asset: any) => ({
                    action_type: 'CREATE',
                    description: `Asset ${asset.asset_code} created manually (Bulk).`,
                    user_id: req.user?.id || 1,
                    timestamp: new Date()
                }));
                await models.InventoryActivities.bulkCreate(activitiesToCreate);

                return res.status(201).json({
                    status: "success",
                    message: `${qty} assets created successfully`,
                    data: assets
                });
            } catch (bulkError: any) {
                console.error("Bulk create error:", bulkError);
                if (bulkError.name === 'SequelizeUniqueConstraintError') {
                    const field = bulkError.errors?.[0]?.path;
                    const value = bulkError.errors?.[0]?.value;
                    return res.status(400).json({
                        status: "error",
                        message: `${field} '${value}' is already in use.`
                    });
                }
                return res.status(500).json({
                    status: "error",
                    message: `Bulk Create Error: ${bulkError.message}`
                });
            }
        } else {
            // Single insert
            const uniqueSuffix = Date.now().toString().slice(-6);
            if (!assetData.asset_code) assetData.asset_code = `AST-${uniqueSuffix}`;
            if (!assetData.qr_code) assetData.qr_code = `QR-${uniqueSuffix}`;
            if (!assetData.barcode) assetData.barcode = `BC-${uniqueSuffix}`;
            assetData.created_by = req.user?.id || 1;

            const asset: any = await models.InventoryAssets.create(assetData);

            if (req.body.status) {
                await models.InventoryVerifications.create({
                    asset_id: asset.id,
                    status: req.body.status,
                    verified_by: req.user?.id || 1,
                    remarks: 'Initial status on asset creation',
                    verification_date: new Date()
                });
            }

            // Add activity log for single asset
            await models.InventoryActivities.create({
                action_type: 'CREATE',
                description: `Asset ${asset.asset_code} created manually.`,
                user_id: req.user?.id || 1,
                timestamp: new Date()
            });

            return res.status(201).json({
                status: "success",
                message: "Asset created successfully",
                data: asset
            });
        }
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors?.[0]?.path;
            const value = error.errors?.[0]?.value;
            return res.status(400).json({
                status: "error",
                message: `${field} '${value}' is already in use.`
            });
        }
        next(error);
    }
};

export const deleteAsset = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);
        const { id } = req.params;

        const asset: any = await models.InventoryAssets.findByPk(id);

        if (!asset) {
            return res.status(404).json({ status: "error", message: "Asset not found" });
        }

        await asset.destroy();

        res.json({
            status: "success",
            message: "Asset deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};


// --- Locations ---
export const getLocations = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);

        const locations = await models.InventoryLocations.findAll();

        res.json({
            status: "success",
            message: "Locations fetched successfully",
            data: locations
        });
    } catch (error) {
        next(error);
    }
};

export const createLocation = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);
        const { name, building, campus, description } = req.body;

        if (!name) {
            return res.status(400).json({ status: "error", message: "Location name is required" });
        }

        const location = await models.InventoryLocations.create({ name, building, campus, description });

        res.status(201).json({
            status: "success",
            message: "Location created successfully",
            data: location
        });
    } catch (error) {
        next(error);
    }
};

// --- Procurement Requests ---
export const createProcurementRequest = async (req: any, res: Response, next: NextFunction) => {
    // 1. Initialize the tenant's database connection models
    const tenant = req.tenant;
    const models = getTenantModels(tenant);

    // Extract the items array and the rest of the request payload
    const { items, ...requestData } = req.body;

    // Determine the base request number
    const baseReqNumber = requestData.request_number || `PRQ-${Date.now().toString().slice(-6)}`;

    // 2. Start a Database Transaction
    const sequelizeInstance = models.InventoryProcurementRequests.sequelize!;
    const transaction = await sequelizeInstance.transaction();

    try {
        if (items && Array.isArray(items) && items.length > 0) {
            const createdRequests = [];
            const createdItems = [];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const qty = Number(item.quantity) || 1;
                const cost = Number(item.estimated_unit_cost) || 0;
                const totalBudget = qty * cost;
                const { id, category_id, ...cleanItemData } = item;

                // Make unique request number if multiple items
                const reqNumber = items.length === 1 ? baseReqNumber : `${baseReqNumber}-${i + 1}`;

                // Create independent parent request for each item
                const procurementRequest: any = await models.InventoryProcurementRequests.create({
                    ...requestData,
                    request_number: reqNumber,
                    total_estimated_budget: totalBudget
                }, { transaction });

                const itemDataToInsert: any = {
                    ...cleanItemData,
                    quantity: qty,
                    estimated_unit_cost: cost,
                    procurement_request_id: procurementRequest.id,
                    category_id: (category_id && category_id !== "") ? category_id : null,
                    location_id: (item.location_id && item.location_id !== "") ? item.location_id : null,
                    vendor_id: (item.vendor_id && item.vendor_id !== "") ? item.vendor_id : null
                };

                const createdItem = await models.InventoryProcurementItems.create(itemDataToInsert, { transaction });

                createdRequests.push(procurementRequest);
                createdItems.push(createdItem);
            }

            await models.InventoryActivities.create({
                action_type: 'CREATE',
                description: `Procurement request(s) created with base number ${baseReqNumber}.`,
                user_id: req.user?.id || 1,
                timestamp: new Date()
            }, { transaction });

            await transaction.commit();

            return res.status(201).json({
                status: "success",
                message: "Procurement requests created successfully",
                data: {
                    requests: createdRequests,
                    items: createdItems
                }
            });

        } else {
            // Fallback for 0 items
            const totalBudget = Number(requestData.total_estimated_budget) || 0;

            const procurementRequest: any = await models.InventoryProcurementRequests.create({
                ...requestData,
                request_number: baseReqNumber,
                total_estimated_budget: totalBudget
            }, { transaction });

            await models.InventoryActivities.create({
                action_type: 'CREATE',
                description: `Procurement request created with number ${baseReqNumber}.`,
                user_id: req.user?.id || 1,
                timestamp: new Date()
            }, { transaction });

            await transaction.commit();

            return res.status(201).json({
                status: "success",
                message: "Procurement request created successfully",
                data: {
                    request: procurementRequest,
                    items: []
                }
            });
        }

    } catch (error) {
        // Rollback on failure
        await transaction.rollback();
        next(error);
    }
};

export const getProcurementRequests = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);

        const requests = await models.InventoryProcurementRequests.findAll({
            order: [['created_at', 'DESC']],
            include: [{
                model: models.InventoryProcurementItems,
                as: 'items',
                required: false
            }]
        });

        res.json({
            status: "success",
            message: "Procurement requests fetched successfully",
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// --- Verifications ---
export const createVerification = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);
        const { asset_id, status, remarks, verification_date } = req.body;

        if (!asset_id) {
            return res.status(400).json({ status: "error", message: "Asset ID is required" });
        }

        let verification = await models.InventoryVerifications.findOne({ where: { asset_id } });

        const verificationData = {
            status: status || 'Active',
            remarks,
            verification_date: verification_date ? new Date(verification_date) : new Date(),
            verified_by: req.user?.id || 1, // Fallback to 1 if user ID is unavailable
        };

        if (verification) {
            verification = await verification.update(verificationData);
        } else {
            verification = await models.InventoryVerifications.create({
                asset_id,
                ...verificationData
            });
        }

        res.status(201).json({
            status: "success",
            message: "Verification created successfully",
            data: verification
        });
    } catch (error) {
        next(error);
    }
};

export const getAssetVerifications = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);
        const { id } = req.params;

        const verifications = await models.InventoryVerifications.findAll({
            where: { asset_id: id },
            order: [['verification_date', 'DESC']]
        });

        res.json({
            status: "success",
            data: verifications
        });
    } catch (error) {
        next(error);
    }
};


export const getAssets = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);

        const assets = await models.InventoryAssets.findAll({
            include: [{
                model: models.InventoryVerifications,
                as: 'verification',
                required: false
            }]
        });

        res.json({
            status: "success",
            message: "Assets fetched successfully",
            data: assets
        });
    } catch (error) {
        next(error);
    }
};

export const deleteProcurementRequest = async (req: any, res: Response, next: NextFunction) => {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);
    const { id } = req.params;

    const sequelizeInstance = models.InventoryProcurementRequests.sequelize!;
    const transaction = await sequelizeInstance.transaction();

    try {
        const request: any = await models.InventoryProcurementRequests.findByPk(id, { transaction });

        if (!request) {
            await transaction.rollback();
            return res.status(404).json({ status: "error", message: "Procurement Request not found" });
        }

        // Delete items first due to foreign key constraints
        await models.InventoryProcurementItems.destroy({
            where: { procurement_request_id: id },
            transaction
        });

        // Delete parent request
        await request.destroy({ transaction });

        await transaction.commit();

        res.status(200).json({
            status: "success",
            message: "Procurement Request deleted successfully"
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

export const updateProcurementRequestStatus = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);
        const { id } = req.params;
        const { status, remarks, approved_by } = req.body;

        const request: any = await models.InventoryProcurementRequests.findByPk(id);

        if (!request) {
            return res.status(404).json({ status: "error", message: "Procurement Request not found" });
        }

        const updateData: any = {};
        let actionType = 'UPDATE';
        if (status) {
            updateData.status = status;
            // Automatically set approved_by when status becomes Approved
            if (status === 'Approved' && request.status !== 'Approved') {
                updateData.approved_by = req.user?.id || 1;
                actionType = 'APPROVE';
            } else if (status === 'Rejected' && request.status !== 'Rejected') {
                actionType = 'REJECT';
            }
        }
        if (remarks !== undefined) updateData.remarks = remarks;
        if (approved_by) updateData.approved_by = approved_by;

        await request.update(updateData);

        await models.InventoryActivities.create({
            action_type: actionType,
            description: `Procurement request ${request.request_number || id} status updated to ${status || request.status}.`,
            user_id: req.user?.id || 1,
            timestamp: new Date()
        });

        res.status(200).json({
            status: "success",
            message: "Procurement Request status updated successfully",
            data: request
        });
    } catch (error) {
        next(error);
    }
};

export const completeProcurementRequest = async (req: any, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    try {
        const tenant = req.tenant;
        const models = getTenantModels(tenant);
        const { id } = req.params;
        const { createAssets } = req.body;

        const request: any = await models.InventoryProcurementRequests.findByPk(id, {
            include: [{
                model: models.InventoryProcurementItems,
                as: 'items',
                required: false
            }]
        });

        if (!request) {
            return res.status(404).json({ status: "error", message: "Procurement Request not found" });
        }

        if (request.status !== 'Approved') {
            return res.status(400).json({ status: "error", message: "Only Approved requests can be marked as Completed." });
        }

        const sequelizeInstance = models.InventoryProcurementRequests.sequelize!;
        const transaction = await sequelizeInstance.transaction();
        const settings = await settingsService.loadSettings(tenant);

        try {
            // Update status to Completed
            await request.update({ status: 'Completed' }, { transaction });

            // Log activity
            await models.InventoryActivities.create({
                action_type: 'COMPLETE',
                description: `Procurement request ${request.request_number || id} marked as Completed.`,
                user_id: req.user?.id || 1,
                timestamp: new Date()
            }, { transaction });

            let createdAssets: any[] = [];

            // Optionally create assets
            if (createAssets && request.items && request.items.length > 0) {
                const assetsToCreate: any[] = [];
                for (const item of request.items) {
                    // Category could be mapped directly from the item. The requirement states "category_id (optional mapping)".
                    // However, original code threw an error if missing. We can fallback to a default or keep the error if strict.
                    // For safety with current implementation, we'll keep the throw if missing to avoid DB constraints unless changed.
                    if (!item.category_id) {
                        throw new Error(`Cannot create assets: Item '${item.item_name}' is missing a category.`);
                    }

                    const qty = item.quantity || 1;
                    
                    for (let i = 0; i < qty; i++) {
                        // 2. warranty_expiry
                        let warrantyMonths = null;

                        if (item.warranty_months) {
                            warrantyMonths = item.warranty_months;
                        } else if (settings.DEFAULT_WARRANTY_MONTHS) {
                            warrantyMonths = settings.DEFAULT_WARRANTY_MONTHS;
                        }
                        let warranty_expiry = null;
                        if (warrantyMonths) {
                            warranty_expiry = new Date();
                            warranty_expiry.setMonth(warranty_expiry.getMonth() + warrantyMonths);
                        }
                        const uniqueSuffix = `${Date.now().toString().slice(-6)}-${assetsToCreate.length + 1}`;
                        assetsToCreate.push({
                            name: item.item_name,
                            category_id: item.category_id,
                            inventory_department_id: request.inventory_department_id,
                            purchase_cost: item.estimated_unit_cost,
                            current_value: item.estimated_unit_cost,
                            purchase_date: new Date(),
                            warranty_expiry: warranty_expiry,
                            vendor_id: item.vendor_id || req.body.vendor_id || null,
                            location_id: item.location_id || null,
                            asset_code: `AST-${uniqueSuffix}`,
                            qr_code: `QR-${uniqueSuffix}`,
                            barcode: `BC-${uniqueSuffix}`,
                            created_by: req.user?.id || 1
                        });
                    }
                }

                if (assetsToCreate.length > 0) {
                    createdAssets = await models.InventoryAssets.bulkCreate(assetsToCreate, { transaction });
                    
                    const verificationsToCreate = createdAssets.map((asset: any) => ({
                        asset_id: asset.id,
                        status: 'Active',
                        verified_by: req.user?.id || 1,
                        remarks: 'Initial status from Procurement Completion',
                        verification_date: new Date()
                    }));
                    await models.InventoryVerifications.bulkCreate(verificationsToCreate, { transaction });

                    const activitiesToCreate = createdAssets.map((asset: any) => ({
                        action_type: 'CREATE',
                        description: `Asset ${asset.asset_code} automatically created from Procurement Request ${request.request_number || id}.`,
                        user_id: req.user?.id || 1,
                        timestamp: new Date()
                    }));
                    await models.InventoryActivities.bulkCreate(activitiesToCreate, { transaction });
                }
            }

            await transaction.commit();
            transaction.afterCommit(async () => {
                try {
                    const vendorLedgerId = await inventoryService.getVendorLedgerId(request, tenant);

                    const payload = await inventoryService.buildFinanceJournalPayload({
                        procurement: request,
                        items: request.items,
                        vendorLedgerId,
                        tenant,
                    });
                    await financeService.createJournalVoucher(payload, token, tenant);
                } catch (err) {
                    console.error("Finance sync failed:", err);
                    // Optionally store a retry flag in DB
                }
            });

            res.status(200).json({
                status: "success",
                message: "Procurement Request marked as Completed successfully",
                data: {
                    request,
                    createdAssets
                }
            });
        } catch (error: any) {
            await transaction.rollback();
            return res.status(500).json({ status: "error", message: error.message });
        }
    } catch (error) {
        next(error);
    }
};
