class ThreatController {
    async index(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'ThreatController',
            action: 'index'
        });
    }

    async show(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'ThreatController',
            action: 'show',
            id: req.params.id
        });
    }

    async create(req, res) {
        return res.status(201).json({
            success: true,
            controller: 'ThreatController',
            action: 'create',
            data: req.body
        });
    }

    async update(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'ThreatController',
            action: 'update',
            id: req.params.id,
            data: req.body
        });
    }

    async delete(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'ThreatController',
            action: 'delete',
            id: req.params.id
        });
    }
}

module.exports = new ThreatController();
