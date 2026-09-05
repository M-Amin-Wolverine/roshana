class UserActivityController {
    async index(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'UserActivityController',
            action: 'index'
        });
    }

    async show(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'UserActivityController',
            action: 'show',
            id: req.params.id
        });
    }

    async create(req, res) {
        return res.status(201).json({
            success: true,
            controller: 'UserActivityController',
            action: 'create',
            data: req.body
        });
    }

    async update(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'UserActivityController',
            action: 'update',
            id: req.params.id,
            data: req.body
        });
    }

    async delete(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'UserActivityController',
            action: 'delete',
            id: req.params.id
        });
    }
}

module.exports = new UserActivityController();
