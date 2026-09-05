class BroadcastController {
    async index(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'BroadcastController',
            action: 'index'
        });
    }

    async show(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'BroadcastController',
            action: 'show',
            id: req.params.id
        });
    }

    async create(req, res) {
        return res.status(201).json({
            success: true,
            controller: 'BroadcastController',
            action: 'create',
            data: req.body
        });
    }

    async update(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'BroadcastController',
            action: 'update',
            id: req.params.id,
            data: req.body
        });
    }

    async delete(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'BroadcastController',
            action: 'delete',
            id: req.params.id
        });
    }
}

module.exports = new BroadcastController();
