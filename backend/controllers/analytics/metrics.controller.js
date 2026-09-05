class MetricsController {
    async index(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'MetricsController',
            action: 'index'
        });
    }

    async show(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'MetricsController',
            action: 'show',
            id: req.params.id
        });
    }

    async create(req, res) {
        return res.status(201).json({
            success: true,
            controller: 'MetricsController',
            action: 'create',
            data: req.body
        });
    }

    async update(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'MetricsController',
            action: 'update',
            id: req.params.id,
            data: req.body
        });
    }

    async delete(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'MetricsController',
            action: 'delete',
            id: req.params.id
        });
    }
}

module.exports = new MetricsController();
