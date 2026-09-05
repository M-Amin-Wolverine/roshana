class SimulationController {
    async index(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'SimulationController',
            action: 'index'
        });
    }

    async show(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'SimulationController',
            action: 'show',
            id: req.params.id
        });
    }

    async create(req, res) {
        return res.status(201).json({
            success: true,
            controller: 'SimulationController',
            action: 'create',
            data: req.body
        });
    }

    async update(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'SimulationController',
            action: 'update',
            id: req.params.id,
            data: req.body
        });
    }

    async delete(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'SimulationController',
            action: 'delete',
            id: req.params.id
        });
    }
}

module.exports = new SimulationController();
