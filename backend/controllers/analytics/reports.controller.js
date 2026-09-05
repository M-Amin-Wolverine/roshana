class ReportsController {
    async index(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'ReportsController',
            action: 'index'
        });
    }

    async show(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'ReportsController',
            action: 'show',
            id: req.params.id
        });
    }

    async create(req, res) {
        return res.status(201).json({
            success: true,
            controller: 'ReportsController',
            action: 'create',
            data: req.body
        });
    }

    async update(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'ReportsController',
            action: 'update',
            id: req.params.id,
            data: req.body
        });
    }

    async delete(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'ReportsController',
            action: 'delete',
            id: req.params.id
        });
    }
}

module.exports = new ReportsController();
